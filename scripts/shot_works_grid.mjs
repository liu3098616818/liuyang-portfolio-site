/** 作品区网格截图：等进场动画完成后截取整片卡片区 */
import http from 'http'
import fs from 'fs'

const PORT = Number(process.env.CDP_PORT || 9333)
const BASE = process.argv[2] || 'http://127.0.0.1:4173/'
const OUT = process.argv[3] || 'C:/Windows/Temp/w2'

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
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url: BASE })
  await sleep(4500)
  await evalJS('localStorage.clear()')
  await send('Page.navigate', { url: BASE })
  await sleep(5000)

  // 逐张滚动，触发懒加载 + reveal 进场
  await evalJS(`
    (async () => {
      const cards = Array.from(document.querySelectorAll('.work-card'))
      for (const c of cards) {
        c.scrollIntoView({ block: 'center' })
        await new Promise(r => setTimeout(r, 300))
      }
      return true
    })()
  `)
  await sleep(1500)

  // 回到作品区顶部，分屏截取（每屏 6 张卡片的高度）
  const gridTop = JSON.parse(
    await evalJS(`
      (() => {
        const g = document.querySelector('.works-grid')
        const r = g.getBoundingClientRect()
        return JSON.stringify({ y: r.y + window.scrollY, h: r.height })
      })()
    `)
  )

  const shots = []
  const SH = gridTop.h
  const NH = 1250
  let idx = 0
  for (let y = gridTop.y - 60; y < gridTop.y + SH; y += NH) {
    idx++
    await evalJS(`window.scrollTo(0, ${Math.round(y)})`)
    await sleep(1100)
    const img = await send('Page.captureScreenshot', { format: 'png' })
    const buf = Buffer.from(img.result.data, 'base64')
    fs.writeFileSync(`${OUT}/grid-${idx}.png`, buf)
    shots.push(`grid-${idx}.png ${Math.round(buf.length / 1024)}KB`)
  }
  console.log(shots.join('\n'))
  ws.close()
  process.exit(0)
})()
