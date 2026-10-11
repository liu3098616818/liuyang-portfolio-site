/**
 * 实测作品网格的真实行分组（按 y 坐标聚类），分别看 ALL 视图与 AIGC 分类视图。
 * 用法：node scripts/cdp_rows.mjs [url]
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
      console.log('EVAL ERR', JSON.stringify(r.result.exceptionDetails).slice(0, 400))
      return null
    }
    return r.result?.result?.value
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: TARGET })
  await sleep(3500)

  // 滚到作品区，等 reveal 进场
  await ev(`document.querySelector('#works')?.scrollIntoView({block:'start'})`)
  await sleep(2500)

  const ROWS = `(() => {
    const cards = [...document.querySelectorAll('.works-grid .work-card')]
    // 逐张滚一遍触发懒加载 + reveal
    for (const c of cards) { c.scrollIntoView({block:'center'}) }
    return new Promise(res => setTimeout(() => {
      const items = cards.map(c => {
        const r = c.getBoundingClientRect()
        return {
          no: c.querySelector('.work-no')?.textContent?.trim(),
          title: c.querySelector('.work-info h3')?.childNodes[0]?.textContent?.trim(),
          cat: c.querySelector('.work-info .cat')?.textContent?.trim(),
          vert: c.classList.contains('vertical'),
          x: Math.round(r.x), y: Math.round(r.y + window.scrollY),
          w: Math.round(r.width), h: Math.round(r.height),
        }
      })
      const rows = []
      for (const it of items) {
        let row = rows.find(r => Math.abs(r.y - it.y) < 12)
        if (!row) { row = { y: it.y, items: [] }; rows.push(row) }
        row.items.push(it)
      }
      rows.sort((a,b) => a.y - b.y)
      for (const r of rows) r.items.sort((a,b) => a.x - b.x)
      res({ rows: rows.map(r => ({ y: r.y, items: r.items.map(i => i.no + ' ' + i.title + (i.vert ? '(竖)' : '(横)') + ' ' + i.w + 'x' + i.h) })) })
    }, 1800))
  })()`

  const report = (label, data) => {
    console.log(`\n===== ${label} =====`)
    if (!data) return
    data.rows.forEach((r, i) => {
      console.log(`  第${String(i + 1).padStart(2)}行  ${r.items.join('   |   ')}`)
    })
  }

  report('ALL（全部）', await ev(ROWS))

  // 切到 AIGC 与数字人
  const clicked = await ev(`(() => {
    const b = [...document.querySelectorAll('.filter')].find(x => x.textContent.includes('AIGC'))
    if (!b) return false
    b.click()
    return true
  })()`)
  console.log('\n点击 AIGC 分类：', clicked)
  await sleep(2000)
  report('AIGC 与数字人', await ev(ROWS))

  process.exit(0)
})()
