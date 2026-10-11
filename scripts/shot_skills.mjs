/** 技能云 + 优势卡片局部截图，核对换行后的视觉密度 */
import http from 'http'
import fs from 'fs'

const PORT = Number(process.env.CDP_PORT || 9333)
const BASE = process.argv[2] || 'http://127.0.0.1:4173/'
const OUT = process.argv[3] || 'C:/Windows/Temp/tl'

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

  // 技能云容器的选择器探测
  const info = await evalJS(`
    (() => {
      const cands = ['.skills', '.skill-cloud', '.skill-tags', '.tools', '.skill-wrap']
      const found = cands.filter(s => document.querySelector(s))
      // 找出包含「剪映」的最小块级容器
      let node = null
      const walk = (el) => {
        for (const c of el.children) {
          if (c.innerText && c.innerText.includes('剪映') && c.innerText.includes('星图合作')) return c
          const r = walk(c)
          if (r) return r
        }
        return null
      }
      node = walk(document.body)
      return JSON.stringify({
        foundSelectors: found,
        nodeClass: node ? node.className : null,
        nodeTag: node ? node.tagName : null,
        nodeH: node ? Math.round(node.getBoundingClientRect().height) : null,
        childCount: node ? node.children.length : null,
      })
    })()
  `)
  console.log('探测:', info)

  // 技能云容器就是 .skill-block（含标题 + 云）
  const rect = JSON.parse(
    await evalJS(`
      (() => {
        const n = document.querySelector('.skill-block')
        if (!n) return 'null'
        const r = n.getBoundingClientRect()
        return JSON.stringify({ x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height })
      })()
    `)
  )

  if (rect) {
    await evalJS(`window.scrollTo(0, ${Math.max(0, Math.round(rect.y - 300))})`)
    await sleep(1400)
    const img = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: {
        x: Math.max(0, rect.x - 12),
        y: Math.max(0, rect.y - 12),
        width: Math.min(1700, rect.w + 24),
        height: rect.h + 24,
        scale: 1,
      },
    })
    const buf = Buffer.from(img.result.data, 'base64')
    fs.writeFileSync(`${OUT}/skills.png`, buf)
    console.log(`skills.png ${Math.round(buf.length / 1024)}KB h=${Math.round(rect.h)}`)
  }

  ws.close()
  process.exit(0)
})()
