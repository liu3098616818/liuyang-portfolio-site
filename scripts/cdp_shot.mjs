/** 截图：页首 + 关于我 + 精选项目 + 优势 + 联系，用于肉眼核对固化效果 */
import http from 'http'
import fs from 'fs'

const PORT = 9333
const BASE = process.argv[2] || 'http://127.0.0.1:4173/'
const OUT = process.argv[3] || 'C:/Windows/Temp/shots'

const get = (p) =>
  new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
      let b = ''
      r.on('data', (c) => (b += c))
      r.on('end', () => res(JSON.parse(b)))
    }).on('error', rej)
  })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  let targets = []
  for (let i = 0; i < 30; i++) {
    try { targets = await get('/json/list'); if (targets.length) break } catch {}
    await sleep(500)
  }
  const page = targets.find((t) => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const waiting = new Map()
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id) }
  })
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const evalJS = async (s) => {
    const r = await send('Runtime.evaluate', { expression: s, awaitPromise: true, returnByValue: true })
    return r.result?.result?.value
  }

  await new Promise((r) => ws.addEventListener('open', r))
  await send('Page.enable'); await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1700, height: 1000, deviceScaleFactor: 1, mobile: false,
  })
  await send('Page.navigate', { url: BASE })
  await sleep(4000)
  await evalJS(`localStorage.clear()`)
  await send('Page.navigate', { url: BASE })
  await sleep(5000)

  const shots = [
    ['hero', 'hero'],
    ['about', 'about'],
    ['works', 'works'],
    ['strengths', 'strengths'],
    ['contact', 'contact'],
  ]
  for (const [idName, file] of shots) {
    await evalJS(`document.getElementById('${idName}').scrollIntoView({block:'start'})`)
    await sleep(1200)
    const img = await send('Page.captureScreenshot', { format: 'png' })
    const buf = Buffer.from(img.result.data, 'base64')
    fs.writeFileSync(`${OUT}/${file}.png`, buf)
    console.log(`${file}.png  ${Math.round(buf.length / 1024)}KB`)
  }
  console.log('OUT:', OUT)
  ws.close(); process.exit(0)
})()
