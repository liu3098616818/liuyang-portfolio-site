/** 截图第 9 张作品卡（滚动到可视区） */
import http from 'http'; import fs from 'fs'
const PORT = process.env.CDP_PORT ? +process.env.CDP_PORT : 9333
const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b))) }).on('error', rej)
})
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
;(async () => {
  let t = []
  for (let i = 0; i < 30; i++) { try { t = await get('/json/list'); if (t.length) break } catch {} ; await sleep(500) }
  const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl)
  let id = 0; const w = new Map()
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && w.has(m.id)) { w.get(m.id)(m); w.delete(m.id) } })
  const send = (m, p = {}) => new Promise(r => { const i = ++id; w.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })) })
  const ev = async (s) => (await send('Runtime.evaluate', { expression: s, awaitPromise: true, returnByValue: true })).result?.result?.value
  await new Promise(r => ws.addEventListener('open', r))
  await send('Page.enable'); await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1700, height: 1100, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: process.argv[2] })
  await sleep(7000)
  await ev(`document.querySelectorAll('.work-card')[6].scrollIntoView({block:'start'})`)
  await sleep(4000)
  const r = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(process.argv[3], Buffer.from(r.result.data, 'base64'))
  console.log('saved ' + process.argv[3])
  ws.close(); process.exit(0)
})()
