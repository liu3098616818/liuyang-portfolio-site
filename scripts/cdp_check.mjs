/**
 * 通过 CDP 驱动无头浏览器，真机模拟修改器操作并读回结果。
 * 用法：
 *   1) 先起浏览器：chrome --headless=new --no-sandbox --remote-debugging-port=9333
 *   2) node scripts/cdp_check.mjs [url]
 * 不传 url 时默认打线上站点。
 */
import http from 'http'

const PORT = 9333
const TARGET = process.argv[2] || 'https://liuyang-portfolio.app.workbuddy.host/?edit=1'
const CLEAN = process.argv[3] || TARGET.split('?')[0]

const get = (path) =>
  new Promise((res, rej) => {
    http
      .get({ host: '127.0.0.1', port: PORT, path }, (r) => {
        let b = ''
        r.on('data', (c) => (b += c))
        r.on('end', () => res(JSON.parse(b)))
      })
      .on('error', rej)
  })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  let targets = []
  for (let i = 0; i < 20; i++) {
    try {
      targets = await get('/json/list')
      if (targets.length) break
    } catch {}
    await sleep(500)
  }
  const page = targets.find((t) => t.type === 'page')
  if (!page) {
    console.log('NO PAGE TARGET — 先启动带 --remote-debugging-port=9333 的 chrome')
    process.exit(1)
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl)
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

  const evalJS = async (script) => {
    const r = await send('Runtime.evaluate', {
      expression: script,
      awaitPromise: true,
      returnByValue: true,
    })
    return r.result?.result?.value ?? JSON.stringify(r)
  }

  await new Promise((r) => ws.addEventListener('open', r))
  await send('Page.enable')
  await send('Runtime.enable')

  await send('Page.navigate', { url: TARGET })
  await sleep(5000)
  // 清掉上一轮测试残留，重载后再跑，保证每次都从干净状态开始
  await evalJS(`localStorage.removeItem('ly_portfolio_overrides_v1')`)
  await send('Page.navigate', { url: TARGET })
  await sleep(5000)

  /* ---------------- Phase 1：编辑模式下的操作 ---------------- */
  const phase1 = await evalJS(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    const key = 'ly_portfolio_overrides_v1'
    const out = {}
    out.panel = !!document.querySelector('.edp')
    out.stats = [...document.querySelectorAll('.edp-stat')].map(e => e.textContent.trim())

    const mk = (t, x, y) => new MouseEvent(t, { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y })

    /* --- 拖动 hero.name --- */
    const t1 = document.querySelector('[data-ed-key="hero.name"]')
    t1.dispatchEvent(mk('mouseover', 0, 0))
    await sleep(300)
    const bar = document.querySelector('.edsb')
    out.barText = bar ? bar.textContent : null
    const grip = document.querySelector('.edsb-grip')
    out.hasGrip = !!grip
    const before = t1.getBoundingClientRect()
    if (grip) {
      grip.dispatchEvent(mk('mousedown', before.left, before.top))
      document.dispatchEvent(mk('mousemove', before.left + 80, before.top + 40))
      await sleep(120)
      document.dispatchEvent(mk('mousemove', before.left + 120, before.top + 60))
      await sleep(120)
      document.dispatchEvent(mk('mouseup', before.left + 120, before.top + 60))
      await sleep(300)
    }
    const after = t1.getBoundingClientRect()
    out.movedBy = { x: Math.round(after.left - before.left), y: Math.round(after.top - before.top) }
    out.draggedStyle = t1.getAttribute('style')
    out.barAfterDrag = document.querySelector('.edsb') ? document.querySelector('.edsb').textContent : null

    /* --- 换行：在 about.leadB 里按一次回车 --- */
    const t2 = document.querySelector('[data-ed-key="about.leadB"]')
    out.target2 = !!t2
    const h0 = t2.getBoundingClientRect().height
    t2.dispatchEvent(mk('mouseover', 0, 0))
    await sleep(200)
    t2.focus()
    // 把光标放在第 6 个字后面，这样换行后才看得出是两行
    const tn = t2.firstChild
    const rg = document.createRange()
    rg.setStart(tn, 6)
    rg.collapse(true)
    const sel = getSelection()
    sel.removeAllRanges()
    sel.addRange(rg)
    t2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    await sleep(200)
    out.innerAfterEnter = JSON.stringify(t2.innerText)
    // headless 下主动 blur() 不派发事件，React 的 onBlur 监听的是 focusout
    t2.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await sleep(400)
    const st = JSON.parse(localStorage.getItem(key) || '{}')
    out.savedText = st.text && st.text['about.leadB'] ? st.text['about.leadB'] : null
    out.savedHasBreak = out.savedText ? out.savedText.indexOf('\\n') > -1 : false
    const t2n = document.querySelector('[data-ed-key="about.leadB"]')
    out.lineRects = t2n ? t2n.getClientRects().length : null
    out.whiteSpace = t2n ? getComputedStyle(t2n).whiteSpace : null
    out.heightNow = t2n ? Math.round(t2n.getBoundingClientRect().height) : null
    out.panelStillOpen = !!document.querySelector('.edp')
    out.styleMap = st.style
    return JSON.stringify(out, null, 2)
  })()`)
  console.log('=== Phase 1 编辑模式 ===')
  console.log(phase1)

  /* ---------------- Phase 2：访客模式复核持久化 ---------------- */
  await send('Page.navigate', { url: CLEAN })
  await sleep(5000)

  const phase2 = await evalJS(`(async () => {
    const out = {}
    out.panel = !!document.querySelector('.edp')
    out.bar = !!document.querySelector('.edsb')
    const t1 = document.querySelector('.hero-name, [class*="hero-name"]')
    // hero.name 在非编辑态没有 data-ed-key，按文本内容找
    const el1 = [...document.querySelectorAll('*')].find(
      e => e.children.length === 0 && e.textContent.trim() === '刘杨'
    )
    if (el1) {
      const cs = getComputedStyle(el1)
      out.nameInline = el1.getAttribute('style')
      out.nameComputed = { position: cs.position, left: cs.left, top: cs.top }
    }
    const el2 = [...document.querySelectorAll('*')].find(
      e => e.children.length === 0 && e.textContent.includes('从选题到复盘')
    )
    if (el2) {
      out.leadWhiteSpace = getComputedStyle(el2).whiteSpace
      out.leadRects = el2.getClientRects().length
      out.leadText = JSON.stringify(el2.textContent)
    }
    return JSON.stringify(out, null, 2)
  })()`)
  console.log('=== Phase 2 访客模式 ===')
  console.log(phase2)

  ws.close()
  process.exit(0)
})()
