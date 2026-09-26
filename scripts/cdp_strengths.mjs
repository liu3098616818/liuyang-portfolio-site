/** 核验 strengths.desc 在访客态下的换行与空格是否按源码渲染 */
import http from 'http'
const PORT = process.env.CDP_PORT ? +process.env.CDP_PORT : 9333
const TARGET = process.argv[2] || 'https://liuyang-portfolio.app.workbuddy.host/'
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
  await sleep(4000)
  await evalJS(`localStorage.clear()`)
  await send('Page.navigate', { url: TARGET })
  await sleep(6000)

  const res = await evalJS(`(() => {
    const out = {}
    const el = [...document.querySelectorAll('*')].reverse().find(e => e.children.length === 0 && e.textContent.includes('四件事撑起了'))
    if (!el) return JSON.stringify({ err: 'strengths.desc 元素未找到' })
    out.text = el.innerText
    out.hasRealNewline = el.innerText.includes('\\n')
    out.secondLineStartsWithSpace = /\\n\\s/.test(el.innerText)
    out.whiteSpace = getComputedStyle(el).whiteSpace
    out.renderedLines = el.getClientRects().length
    return JSON.stringify(out, null, 2)
  })()`)
  console.log('=== strengths.desc 访客态渲染核验 ===')
  console.log(res)
  ws.close(); process.exit(0)
})()
