/** 核验第 9 位作品卡片：封面是否真实加载、hover 是否触发预览视频 */
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
  await sleep(6000)

  const res = await evalJS(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    const out = {}
    const cards = [...document.querySelectorAll('.work-card')]
    const c9 = cards[8]
    if (!c9) return JSON.stringify({ err: '第 9 张卡未找到，共 ' + cards.length + ' 张' })

    /* 封面图 */
    const img = c9.querySelector('img')
    out.poster = img ? {
      src: img.getAttribute('src'),
      complete: img.complete,
      natural: img.naturalWidth + 'x' + img.naturalHeight,
      loadedOK: img.naturalWidth > 0,
    } : 'NO IMG'

    /* 预览视频 */
    const v = c9.querySelector('video')
    out.video = v ? {
      src: v.getAttribute('src'),
      preload: v.getAttribute('preload'),
      readyState: v.readyState,
    } : 'NO VIDEO'
    return JSON.stringify(out, null, 2)
  })()`)
  console.log('=== 第 9 位卡片核验（未 hover，清空存储） ===')
  console.log(res)

  /* 真机 hover，看视频是否被请求/播放 */
  const box = await evalJS(`(() => {
    const c = [...document.querySelectorAll('.work-card')][8]
    if (!c) return null
    c.scrollIntoView({ block: 'center' })
    const r = c.getBoundingClientRect()
    return JSON.stringify({ x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) })
  })()`)
  if (box) {
    const { x, y } = JSON.parse(box)
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' })
    await sleep(2500)
    const hov = await evalJS(`(() => {
      const v = [...document.querySelectorAll('.work-card')][8].querySelector('video')
      if (!v) return 'NO VIDEO'
      return JSON.stringify({
        src: v.getAttribute('src'),
        readyState: v.readyState,
        paused: v.paused,
        currentTime: Math.round(v.currentTime * 100) / 100,
        playing: !v.paused && v.currentTime > 0,
        visible: getComputedStyle(v).opacity + ' / ' + getComputedStyle(v).visibility,
      }, null, 2)
    })()`)
    console.log('=== hover 后 ===')
    console.log(hov)
  }
  console.log('\n4xx：', bad.length ? [...new Set(bad)].join('\n') : '无')
  ws.close(); process.exit(0)
})()
