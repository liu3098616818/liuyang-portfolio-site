/** 核查：GitHub Pages 上 ?edit=1 能否打开修改器，以及「复制改动文本」按钮在不在 */
import http from 'http'
const PORT = process.env.CDP_PORT ? +process.env.CDP_PORT : 9333
const TARGET = process.argv[2]
const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b))) }).on('error', rej)
})
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
;(async () => {
  let targets = []
  for (let i = 0; i < 30; i++) { try { targets = await get('/json/list'); if (targets.length) break } catch {} ; await sleep(500) }
  const page = targets.find(t => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0; const waiting = new Map()
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id) } })
  const send = (method, params = {}) => new Promise(res => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const evalJS = async (s) => { const r = await send('Runtime.evaluate', { expression: s, awaitPromise: true, returnByValue: true }); return r.result?.result?.value }
  await new Promise(r => ws.addEventListener('open', r))
  await send('Page.enable'); await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1700, height: 1000, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: TARGET })
  await sleep(6000)

  const r1 = await evalJS(`(() => {
    const t = document.body.innerText
    return JSON.stringify({
      面板出现: !!document.querySelector('.edp-panel, [class*="edp"]'),
      复制改动文本按钮: t.includes('复制改动文本'),
      说明同步页: t.includes('说明') && t.includes('同步'),
      样式统计: /样式/.test(t),
      可编辑元素数: document.querySelectorAll('[contenteditable]').length,
    })
  })()`)
  console.log('=== 修改器在 Pages 上的可用性 ===')
  console.log(r1)

  // 改一段文字，看是否只落在 localStorage
  const r2 = await evalJS(`(() => {
    const el = document.querySelector('[contenteditable]')
    if (!el) return 'no editable'
    el.focus(); el.textContent = '同步测试XYZ'
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    const raw = localStorage.getItem('ly_portfolio_overrides_v1')
    return JSON.stringify({
      写入localStorage: !!raw,
      含测试内容: raw ? raw.includes('同步测试XYZ') : false,
      键名: Object.keys(localStorage),
    })
  })()`)
  console.log('=== 改动落在哪 ===')
  console.log(r2)
  ws.close(); process.exit(0)
})()
