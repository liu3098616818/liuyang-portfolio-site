/** 同时核查：照片位构图 + 首页背景视频是否真的在播 */
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
  await sleep(5000)
  await evalJS(`localStorage.clear()`)
  await send('Page.navigate', { url: TARGET })
  await sleep(7000)

  const res = await evalJS(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    const out = {}

    /* --- 首页背景视频 --- */
    const v = document.querySelector('.hero-video')
    out.heroVideo = v ? {
      src: v.getAttribute('src'),
      readyState: v.readyState,        // >=2 表示已有帧可播
      videoW: v.videoWidth,
      videoH: v.videoHeight,
      duration: Math.round(v.duration * 10) / 10,
      paused: v.paused,
      loop: v.loop, muted: v.muted, autoplay: v.autoplay,
      poster: v.getAttribute('poster'),
    } : 'NOT FOUND'
    // 让它跑一小会儿，确认真的在推进
    await sleep(1500)
    if (v) { out.heroVideo.currentTimeAfter = Math.round(v.currentTime * 100) / 100; out.heroVideo.playing = !v.paused && v.currentTime > 0 }

    /* --- 照片位 --- */
    document.getElementById('about').scrollIntoView({ block: 'start' })
    await sleep(1800)
    const img = document.querySelector('.portrait-media img')
    out.portrait = img ? {
      src: img.getAttribute('src'),
      loadedOK: img.naturalWidth > 0 && img.complete,
      natural: img.naturalWidth + 'x' + img.naturalHeight,
      ratio: (img.getBoundingClientRect().width / img.getBoundingClientRect().height).toFixed(4),
    } : 'NOT FOUND'

    /* --- 顺带确认改动的商品还在 --- */
    out.cards = document.querySelectorAll('.work-card').length
    out.hasSlot09 = document.body.innerText.includes('待加入视频模块')
    out.titleEn = document.body.innerText.includes("LET'S TALK")
    out.hasMita = document.body.innerText.includes('秘塔')
    return JSON.stringify(out, null, 2)
  })()`)
  console.log('=== 线上真机核验（无 ?edit=1，清空存储） ===')
  console.log(res)
  console.log('\n4xx：', bad.length ? [...new Set(bad)].join('\n') : '无')
  ws.close(); process.exit(0)
})()
