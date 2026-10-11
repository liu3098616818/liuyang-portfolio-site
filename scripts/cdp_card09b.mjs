/** 滚动到第9张卡后再核验封面加载情况 */
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
  await evalJS(`document.querySelectorAll('.work-card')[8].scrollIntoView({block:'center'})`)
  await sleep(3500)
  const r = await evalJS(`JSON.stringify((() => {
    const c = document.querySelectorAll('.work-card')[8]
    const img = c.querySelector('img')
    const v = c.querySelector('video')
    const r = c.getBoundingClientRect()
    return {
      卡片位置: Math.round(r.top)+'px, 宽'+Math.round(r.width),
      封面src: img && img.getAttribute('src'),
      封面已加载: img && img.complete && img.naturalWidth > 0,
      封面尺寸: img ? img.naturalWidth+'x'+img.naturalHeight : null,
      卡片可见区域高: Math.round(r.height),
      视频src: v && v.getAttribute('src'),
    }
  })(), null, 2)`)
  console.log(r)
  ws.close(); process.exit(0)
})()
