/** 核验本轮同步：首页背景换敦煌舞、第 9 位作品加追踪飞行、st.003.desc 换行 */
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
  await sleep(9000)

  const res = await evalJS(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    const out = {}

    /* 1. 首页背景视频 */
    const v = document.querySelector('.hero-video')
    out.hero = v ? {
      src: v.getAttribute('src'),
      poster: v.getAttribute('poster'),
      readyState: v.readyState,
      w: v.videoWidth, h: v.videoHeight,
      duration: Math.round(v.duration * 10) / 10,
      paused: v.paused,
    } : 'NOT FOUND'
    await sleep(1500)
    if (v) { out.hero.playing = !v.paused && v.currentTime > 0; out.hero.t = Math.round(v.currentTime * 100) / 100 }

    /* 2. 第 9 位作品 */
    const cards = [...document.querySelectorAll('.work-card')]
    out.cardCount = cards.length
    const c9 = cards[8]
    if (c9) {
      out.card09 = {
        text: c9.innerText.replace(/\\s+/g, ' ').slice(0, 60),
        hasTrackingShot: c9.innerText.includes('追踪飞行'),
        hasTRACKING: c9.innerText.includes('TRACKING SHOT'),
        videoSrc: (c9.querySelector('video') || {}).getAttribute
          ? c9.querySelector('video').getAttribute('src') : null,
      }
    }
    out.oldPlaceholderGone = !document.body.innerText.includes('待加入视频模块')

    /* 3. st.003.desc 换行位置 */
    const leaf = [...document.querySelectorAll('*')].reverse()
      .find(e => e.children.length === 0 && e.textContent.includes('缩短选题与制作周期'))
    out.st003 = leaf ? {
      text: leaf.innerText,
      newlineBeforeShorten: /处理，\\n缩短/.test(leaf.innerText),
      whiteSpace: getComputedStyle(leaf).whiteSpace,
    } : 'NOT FOUND'

    return JSON.stringify(out, null, 2)
  })()`)
  console.log('=== 本轮同步核验 ===')
  console.log(res)
  console.log('\n4xx：', bad.length ? [...new Set(bad)].join('\n') : '无')
  ws.close(); process.exit(0)
})()
