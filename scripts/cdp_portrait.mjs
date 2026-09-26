/** 核查照片位：图片是否真的加载成功（naturalWidth>0）、显示比例是否为 9:12 */
import http from 'http'
import fs from 'fs'
const PORT = 9333
const TARGET = process.argv[2] || 'http://127.0.0.1:4173/'
const OUT = process.argv[3] || 'C:/Windows/Temp/shot_portrait'
const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b))) }).on('error', rej)
})
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  let targets = []
  for (let i = 0; i < 30; i++) { try { targets = await get('/json/list'); if (targets.length) break } catch {} ; await sleep(500) }
  const page = targets.find(t => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0; const waiting = new Map(); const bad = []
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data)
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id) }
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) bad.push(m.params.response.status + ' ' + m.params.response.url)
  })
  const send = (method, params = {}) => new Promise(res => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const evalJS = async (s) => { const r = await send('Runtime.evaluate', { expression: s, awaitPromise: true, returnByValue: true }); return r.result?.result?.value }

  await new Promise(r => ws.addEventListener('open', r))
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1700, height: 1000, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: TARGET })
  await sleep(4000)
  await evalJS(`localStorage.clear()`)
  await send('Page.navigate', { url: TARGET })
  await sleep(5000)

  const res = await evalJS(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    document.getElementById('about').scrollIntoView({block:'start'})
    await sleep(1500)
    const out = {}
    const img = document.querySelector('.portrait-media img')
    if (!img) return JSON.stringify({ err: '照片位没找到 img' })
    out.src = img.getAttribute('src')
    out.natural = img.naturalWidth + 'x' + img.naturalHeight
    out.loadedOK = img.naturalWidth > 0 && img.complete
    const box = img.getBoundingClientRect()
    out.shown = Math.round(box.width) + 'x' + Math.round(box.height)
    out.ratio = (box.width / box.height).toFixed(4)
    out.objectFit = getComputedStyle(img).objectFit
    const holder = document.querySelector('.portrait-media').getBoundingClientRect()
    out.holder = Math.round(holder.width) + 'x' + Math.round(holder.height)
    out.holderRatio = (holder.width / holder.height).toFixed(4)
    return JSON.stringify(out, null, 2)
  })()`)
  console.log('=== 照片位核查 ===')
  console.log(res)
  await evalJS(`document.getElementById('about').scrollIntoView({block:'start'})`)
  await sleep(1200)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(`${OUT}/about_portrait.png`, Buffer.from(shot.result.data, 'base64'))
  console.log('\n截图：', `${OUT}/about_portrait.png`)
  console.log('4xx：', bad.length ? [...new Set(bad)].join('\n') : '无')
  ws.close(); process.exit(0)
})()
