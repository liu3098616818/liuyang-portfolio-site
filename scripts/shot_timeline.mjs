/** 时间线全区域截图，肉眼核对 5 条要点的排版观感 */
import http from 'http'
import fs from 'fs'

const PORT = Number(process.env.CDP_PORT || 9333)
const BASE = process.argv[2] || 'http://127.0.0.1:4173/'
const OUT = process.argv[3] || 'C:/Windows/Temp/shots2'

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
  await send('Page.navigate', { url: BASE })
  await sleep(4000)
  await evalJS('localStorage.clear()')
  await send('Page.navigate', { url: BASE })
  await sleep(5000)

  await evalJS(
    '(async () => { const h = document.body.scrollHeight; for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)) } window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 300)) })()'
  )
  await sleep(600)
  await evalJS("document.querySelector('.timeline').scrollIntoView({block:'start'})")
  await sleep(1500)

  const img = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  })
  const buf = Buffer.from(img.result.data, 'base64')
  fs.writeFileSync(`${OUT}/timeline.png`, buf)
  console.log(`timeline.png ${Math.round(buf.length / 1024)}KB`)
  ws.close()
  process.exit(0)
})()
