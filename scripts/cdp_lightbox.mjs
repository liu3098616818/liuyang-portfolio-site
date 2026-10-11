/**
 * 灯箱播放核验：点开指定作品，确认播的是 full/（完整不截断）而不是 preview/（40s 截断版）。
 * 用法：node scripts/cdp_lightbox.mjs [url]
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
  for (let i = 0; i < 40; i++) {
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
  })
  let id = 0
  const pend = new Map()
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pend.has(m.id)) {
      pend.get(m.id)(m)
      pend.delete(m.id)
    }
  })
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id
      pend.set(i, res)
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    })
    if (r.result?.exceptionDetails) {
      console.log('EVAL ERR', JSON.stringify(r.result.exceptionDetails).slice(0, 300))
      return null
    }
    return r.result?.result?.value
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: TARGET })
  await sleep(3500)
  await ev(`document.querySelector('#works')?.scrollIntoView({block:'start'})`)
  await sleep(2500)

  // 期望时长（源片实测值，秒）
  const EXPECT = {
    京剧: 161.3, '口播剪辑 01': 80.4, '海南 VLOG': 54.6,
    雄安新区宣传: 57.6, '调色 02': 27.5, '追踪飞行': 10.0,
  }

  console.log('=== 悬停预览（应为 preview/，短、小） ===')
  const hover = await ev(`(() => {
    const c = [...document.querySelectorAll('.work-card')].find(x => x.querySelector('h3')?.textContent.includes('京剧'))
    if (!c) return null
    const v = c.querySelector('video')
    return { src: v?.getAttribute('src'), preload: v?.getAttribute('preload') }
  })()`)
  console.log(' ', JSON.stringify(hover))

  console.log('\n=== 灯箱播放（应为 full/，完整版） ===')
  let pass = 0
  for (const title of Object.keys(EXPECT)) {
    const opened = await ev(`(() => {
      const c = [...document.querySelectorAll('.work-card')].find(x => x.querySelector('h3')?.textContent.includes(${JSON.stringify(title)}))
      if (!c) return false
      c.scrollIntoView({block:'center'}); c.click(); return true
    })()`)
    if (!opened) {
      console.log(`  ${title} 未找到卡片`)
      continue
    }
    await sleep(1200)
    // 等 duration 可读
    const info = await ev(`(() => new Promise(res => {
      const v = document.querySelector('.lb-video')
      if (!v) return res(null)
      let n = 0
      const tick = () => {
        if (v.duration && isFinite(v.duration)) return res({src: v.getAttribute('src'), dur: +v.duration.toFixed(1), w: v.videoWidth, h: v.videoHeight})
        if (++n > 40) return res({src: v.getAttribute('src'), dur: null, w: v.videoWidth, h: v.videoHeight})
        setTimeout(tick, 250)
      }
      tick()
    }))()`)
    await ev(`document.querySelector('.lb-close')?.click()`)
    await sleep(600)
    if (!info) {
      console.log(`  ✗ ${title} 灯箱没起来`)
      continue
    }
    const isFull = /\/full\//.test(info.src || '')
    const exp = EXPECT[title]
    const ok = isFull && info.dur !== null && Math.abs(info.dur - exp) < 1.5
    if (ok) pass++
    console.log(
      `  ${ok ? '✓' : '✗'} ${title.padEnd(12)} ${isFull ? 'full/' : '⚠非full'} ` +
        `时长 ${info.dur}s（源片 ${exp}s）  ${info.w}x${info.h}  ${info.src?.split('/').pop()}`
    )
  }
  console.log(`\n灯箱完整版: ${pass}/${Object.keys(EXPECT).length}`)
  process.exit(0)
})()
