/** 检查统计卡的 unit / cn 是否被 baseStyles 覆盖（编辑态下定位 data-ed-key） */
import http from 'http'
const PORT = 9333
const TARGET = (process.argv[2] || 'http://127.0.0.1:4173/') + '?edit=1'
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
  await send('Page.navigate', { url: TARGET }); await sleep(5000)
  const res = await evalJS(`(() => {
    const out = {}
    for (const k of ['stat.0.unit','stat.1.unit','stat.2.unit','stat.0.cn','stat.1.cn','stat.2.cn','stat.3.cn','stat.3.unit']) {
      const els = [...document.querySelectorAll('[data-ed-key="'+k+'"]')]
      out[k] = els.map(e => ({ fs: getComputedStyle(e).fontSize, inline: e.getAttribute('style'), t: e.textContent }))
    }
    out.inlineStyleAttr = [...document.querySelectorAll('[data-ed-key^="stat."]')].map(e => e.getAttribute('data-ed-key') + ' :: ' + e.getAttribute('style'))
    return JSON.stringify(out, null, 2)
  })()`)
  console.log(res); ws.close(); process.exit(0)
})()
