/**
 * 真机验证「增加 / 删除视频模块」：
 * 进编辑模式 → 打开作品页签 → 填表单加一条 16:9 → 断言卡片出现在页面 →
 * 再删掉 → 断言卡片消失。
 * 用法：node scripts/cdp_addwork.mjs [url]
 */
import http from 'http'
import fs from 'fs'

const PORT = Number(process.env.CDP_PORT || 9333)
const BASE = process.argv[2] || 'http://127.0.0.1:4173/'
const OUT = process.argv[3] || 'C:/Windows/Temp/tl'

const get = (p) =>
  new Promise((res, rej) => {
    http
      .get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
        let b = ''
        r.on('data', (c) => (b += c))
        r.on('end', () => res(JSON.parse(b)))
      })
      .on('error', rej)
  })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  let targets = []
  for (let i = 0; i < 30; i++) {
    try {
      targets = await get('/json/list')
      if (targets.length) break
    } catch {}
    await sleep(500)
  }
  const page = targets.find((t) => t.type === 'page')
  if (!page) {
    console.log('NO PAGE')
    process.exit(1)
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((r) => {
    if (ws.readyState === 1) return r()
    ws.addEventListener('open', r)
    ws.addEventListener('error', r)
  })

  let id = 0
  const waiting = new Map()
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && waiting.has(m.id)) {
      waiting.get(m.id)(m)
      waiting.delete(m.id)
    }
  })
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id
      waiting.set(i, res)
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  const evalJS = async (s) => {
    const r = await send('Runtime.evaluate', {
      expression: s,
      awaitPromise: true,
      returnByValue: true,
    })
    if (r.result?.exceptionDetails) return 'EXC: ' + JSON.stringify(r.result.exceptionDetails.text)
    return r.result?.result?.value
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1700,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })

  const log = []
  // 带 ?edit=1 进入编辑模式
  await send('Page.navigate', { url: BASE + '?edit=1' })
  await sleep(5000)

  // 清掉本地覆盖，从干净状态开始
  await evalJS('localStorage.clear()')
  await send('Page.navigate', { url: BASE + '?edit=1' })
  await sleep(5200)

  const panelExists = await evalJS("!!document.querySelector('.edp, [class*=\"edp\"]')")
  log.push(`修改器面板存在: ${panelExists}`)

  const before = await evalJS("document.querySelectorAll('.works-grid .work-card, .works .card, .work-item').length")
  log.push(`原始卡片数: ${before}`)

  // 切到「作品」页签
  await evalJS(`
    (() => {
      const btns = Array.from(document.querySelectorAll('.edp nav button, .edp-tabs button, .edp button'))
      const t = btns.find(b => b.innerText.includes('视频作品'))
      if (t) t.click()
      return !!t
    })()
  `)
  await sleep(800)

  // 点「＋ 增加视频模块」
  const opened = await evalJS(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const t = btns.find(b => b.innerText.includes('增加视频模块'))
      if (t) { t.click(); return true }
      return false
    })()
  `)
  log.push(`展开新增表单: ${opened}`)
  await sleep(700)

  // 填表单：标题/英文/分类/版式 16:9/年份/说明
  const filled = await evalJS(`
    (() => {
      const form = document.querySelector('.edp-form')
      if (!form) return 'no-form'
      const inputs = form.querySelectorAll('input')
      const selects = form.querySelectorAll('select')
      const setNative = (el, v) => {
        const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
        setter.call(el, v)
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }
      setNative(inputs[0], '核验测试片')
      setNative(inputs[1], 'VERIFY TEST')
      setNative(selects[1], 'h')   // 版式：横屏 16:9
      setNative(inputs[2], '2026')
      setNative(inputs[3], '真机验证 · 待删除')
      return 'ok'
    })()
  `)
  log.push(`填表: ${filled}`)
  await sleep(500)

  // 提交
  await evalJS(`
    (() => {
      const form = document.querySelector('.edp-form')
      const btn = Array.from(form.querySelectorAll('button')).find(b => b.innerText.trim() === '添加')
      if (btn) btn.click()
      return !!btn
    })()
  `)
  await sleep(1200)

  const afterAdd = await evalJS(`
    JSON.stringify({
      cards: document.querySelectorAll('.works-grid .work-card, .works .card, .work-item').length,
      hasTest: document.body.innerText.includes('核验测试片'),
      listItems: document.querySelectorAll('.edp-list li').length,
    })
  `)
  log.push(`新增后: ${afterAdd}`)

  // 截图：作品区
  await evalJS("document.getElementById('works').scrollIntoView({block:'start'})")
  await sleep(1500)
  let img = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(`${OUT}/addwork-after.png`, Buffer.from(img.result.data, 'base64'))

  // 删除刚加的这条（列表里 title 含「核验测试片」的那条 ✕）
  const removed = await evalJS(`
    (() => {
      const lis = Array.from(document.querySelectorAll('.edp-list li'))
      const li = lis.find(l => l.innerText.includes('核验测试片'))
      if (!li) return 'not-found'
      const x = li.querySelector('button.danger')
      if (!x) return 'no-danger-btn'
      x.click()
      return 'clicked'
    })()
  `)
  log.push(`删除操作: ${removed}`)
  await sleep(1200)

  const afterDel = await evalJS(`
    JSON.stringify({
      hasTest: document.body.innerText.includes('核验测试片'),
      listItems: document.querySelectorAll('.edp-list li').length,
    })
  `)
  log.push(`删除后: ${afterDel}`)

  console.log(log.join('\n'))
  ws.close()
  process.exit(0)
})()
