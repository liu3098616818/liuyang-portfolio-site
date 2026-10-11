/**
 * 作品区重建核验：卡片数、分类筛选、封面是否真实加载、有无 404。
 * 用法：node scripts/cdp_works.mjs [url]
 */
import http from 'http'

const PORT = Number(process.env.CDP_PORT || 9333)
const TARGET = process.argv[2] || 'http://127.0.0.1:4173/'

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
  const bad = []
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
  await send('Network.enable')
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.method === 'Network.responseReceived') {
      const s = m.params.response.status
      if (s >= 400) bad.push(`${s} ${m.params.response.url}`)
    }
  })

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1700,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url: TARGET })
  await sleep(4500)
  await evalJS('localStorage.clear()')
  await send('Page.navigate', { url: TARGET })
  await sleep(5000)

  const total = await evalJS("document.querySelectorAll('.work-card').length")
  const filters = await evalJS(
    "JSON.stringify(Array.from(document.querySelectorAll('.filter')).map(f => f.innerText.trim()))"
  )

  console.log(`作品卡片总数: ${total}（应为 23）`)
  console.log(`分类筛选器: ${filters}`)

  // 逐个分类点一遍，核对数量
  const cats = JSON.parse(filters)
  console.log('\n=== 分类筛选核对 ===')
  for (const c of cats) {
    const label = c.split('\n')[0].trim()
    await evalJS(`
      (() => {
        const fs = Array.from(document.querySelectorAll('.filter'))
        const t = fs.find(f => f.innerText.trim().split('\\n')[0].trim() === ${JSON.stringify(label)})
        if (t) t.click()
        return !!t
      })()
    `)
    await sleep(700)
    const n = await evalJS("document.querySelectorAll('.work-card').length")
    console.log(`  ${label.padEnd(16)} → ${n} 张`)
  }

  // 回到 ALL，滚动加载全部封面
  await evalJS(`
    (() => {
      const fs = Array.from(document.querySelectorAll('.filter'))
      const t = fs.find(f => f.innerText.trim().startsWith('ALL'))
      if (t) t.click()
      return !!t
    })()
  `)
  await sleep(900)
  // 封面是 loading="lazy"，整页快速滚一遍不可靠：必须逐张 scrollIntoView 触发，
  // 且滚完**不能回顶部**（回到顶部会让还没进视口的图继续挂着）
  const cardCount = await evalJS("document.querySelectorAll('.work-card').length")
  await evalJS(`
    (async () => {
      const cards = Array.from(document.querySelectorAll('.work-card'))
      for (const c of cards) {
        c.scrollIntoView({ block: 'center' })
        await new Promise(r => setTimeout(r, 320))
      }
      await new Promise(r => setTimeout(r, 1200))
      return true
    })()
  `)
  await sleep(1200)
  console.log(`\n(已逐个滚动 ${cardCount} 张卡片触发懒加载)`)

  const covers = await evalJS(`
    JSON.stringify(Array.from(document.querySelectorAll('.work-card')).map(c => {
      const img = c.querySelector('img')
      return {
        no: c.querySelector('.work-no')?.innerText?.trim(),
        title: c.querySelector('.work-info')?.innerText?.trim().split('\\n')[0],
        w: img ? img.naturalWidth : -1,
        h: img ? img.naturalHeight : -1,
        src: img ? (img.currentSrc || img.src).split('/').pop() : null,
      }
    }))
  `)

  const list = JSON.parse(covers)
  console.log('\n=== 封面加载 ===')
  let ok = 0
  for (const c of list) {
    const good = c.w > 0
    if (good) ok++
    console.log(`  ${good ? '✓' : '✗'} ${String(c.no).padEnd(8)} ${String(c.title).padEnd(14)} ${c.w}x${c.h}  ${c.src}`)
  }
  console.log(`\n封面正常: ${ok}/${list.length}`)
  console.log(`4xx: ${bad.length ? bad.join('\n  ') : '无'}`)

  ws.close()
  process.exit(0)
})()
