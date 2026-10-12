/**
 * 访客态核验：确认普通访客（全新浏览器、空 localStorage）在页面上
 * 看不到任何「网页修改器」的痕迹；并验证自己的入口仍然有效。
 * 用法：node scripts/cdp_visitor_hide.mjs [url]
 */
import http from 'http'

const PORT = Number(process.env.CDP_PORT || 9333)
const TARGET = process.argv[2] || 'https://liu3098616818.github.io/liuyang-portfolio-site/'
// 隐藏入口的参数名与口令：必须与 src/editor/EditorContext.jsx 里的 EDIT_KEY / EDIT_TOKEN 一致
const KEY = process.env.EDIT_KEY || 'ref'
const TOKEN = process.env.EDIT_TOKEN || ''
const join = (base, qs) => base + (base.includes('?') ? '&' : '?') + qs

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
  let targets = []
  for (let i = 0; i < 40; i++) {
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
  })
  let id = 0
  const pend = new Map()
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pend.has(m.id)) {
      pend.get(m.id)(m)
      pend.delete(m.id)
    }
  })
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id
      pend.set(i, res)
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    })
    if (r.result?.exceptionDetails) {
      console.log('EVAL ERR', JSON.stringify(r.result.exceptionDetails).slice(0, 300))
      return null
    }
    return r.result?.result?.value
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: TARGET })
  await sleep(4000)

  const scan = `(() => {
    const q = (s) => document.querySelectorAll(s).length
    // 页面上所有可见文本里，有没有出现编辑器的字眼
    const body = document.body.innerText || ''
    const hits = []
    for (const w of ['修改器', '编辑模式', '编辑面板', 'Ctrl', '重置全部', '换图片', '换视频']) {
      if (body.includes(w)) hits.push(w)
    }
    // 带 ed- / edp- / edsb- 前缀的元素（编辑器专属类名）
    const edNodes = [...document.querySelectorAll('*')].filter((el) =>
      [...el.classList].some((c) => /^(ed|edp|edsb)[-_]|^edp$|^edsb$/.test(c))
    )
    return {
      编辑器面板: q('.edp'),
      浮动字号条: q('.edsb'),
      可编辑文字块: q('.ed-text'),
      图片位操作条: q('.ed-media-bar'),
      视频位操作条: q('.ed-vbar') + q('.ed-slot'),
      编辑器类名元素数: edNodes.length,
      页面含编辑器字眼: hits,
      localStorage键: Object.keys(localStorage),
      当前地址: location.href.replace(location.origin, ''),
    }
  })()`

  const before = await ev(scan)
  console.log('===== 访客打开页面（无任何操作）=====')
  for (const [k, v] of Object.entries(before || {})) console.log(`  ${k}: ${JSON.stringify(v)}`)

  // 按下自己的秘密入口
  await send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'E', code: 'KeyE', windowsVirtualKeyCode: 69,
    modifiers: 2 | 8, // Ctrl + Shift
  })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'E', code: 'KeyE', windowsVirtualKeyCode: 69, modifiers: 0 })
  await sleep(1500)

  const after = await ev(`(() => ({
    面板出现: !!document.querySelector('.edp'),
    可编辑文字块: document.querySelectorAll('.ed-text').length,
    媒体操作条: document.querySelectorAll('.ed-media-bar').length + document.querySelectorAll('.ed-vbar').length,
  }))()`)
  console.log('\n===== 按下 Ctrl+Shift+E 之后 =====')
  for (const [k, v] of Object.entries(after || {})) console.log(`  ${k}: ${JSON.stringify(v)}`)

  // 旧的公开入口必须已经失效
  await send('Page.navigate', { url: join(TARGET, 'edit=1') })
  await sleep(4000)
  const oldWay = await ev(`(() => ({
    面板出现: !!document.querySelector('.edp'),
    可编辑文字块: document.querySelectorAll('.ed-text').length,
  }))()`)
  console.log('\n===== 旧网址 ?edit=1（应当失效）=====')
  for (const [k, v] of Object.entries(oldWay || {})) console.log(`  ${k}: ${JSON.stringify(v)}`)

  // 专属隐藏网址
  await send('Page.navigate', { url: join(TARGET, `${KEY}=${TOKEN}`) })
  await sleep(4000)
  const viaUrl = await ev(`(() => ({
    面板出现: !!document.querySelector('.edp'),
    可编辑文字块: document.querySelectorAll('.ed-text').length,
    地址栏是否已抹掉参数: location.search === '',
    当前地址: location.href.replace(location.origin, ''),
  }))()`)
  console.log(`\n===== 隐藏网址 ?${KEY}=${TOKEN} =====`)
  for (const [k, v] of Object.entries(viaUrl || {})) console.log(`  ${k}: ${JSON.stringify(v)}`)

  process.exit(0)
})()
