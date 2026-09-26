/**
 * 按 data-ed-key 精确核对每一条 baseStyles（编辑态下可直接定位）。
 */
import http from 'http'

const PORT = 9333
const TARGET = (process.argv[2] || 'http://127.0.0.1:4173/') + '?edit=1'

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

const KEYS = [
  'stat.0.unit', 'stat.1.unit', 'stat.2.unit', 'stat.0.cn',
  'contact.TEL.value', 'contact.MAIL.value', 'contact.DOUYIN.value',
  'contact.city', 'contact.based',
  'hero.name', 'hero.kicker',
  'hero.stat0.num', 'hero.stat1.num', 'hero.stat2.num',
  'about.title', 'about.en',
]

;(async () => {
  let targets = []
  for (let i = 0; i < 30; i++) {
    try { targets = await get('/json/list'); if (targets.length) break } catch {}
    await sleep(500)
  }
  const page = targets.find((t) => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const waiting = new Map()
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id) }
  })
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const evalJS = async (s) => {
    const r = await send('Runtime.evaluate', { expression: s, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails) return 'EXC: ' + r.result.exceptionDetails.text
    return r.result?.result?.value
  }

  await new Promise((r) => ws.addEventListener('open', r))
  await send('Page.enable'); await send('Runtime.enable')
  await send('Page.navigate', { url: TARGET })
  await sleep(4500)

  const res = await evalJS(`(() => {
    const KEYS = ${JSON.stringify(KEYS)}
    const out = {}
    for (const k of KEYS) {
      const els = [...document.querySelectorAll('[data-ed-key="' + k + '"], [data-sk="' + k + '"]')]
      out[k] = els.map(e => { const c = getComputedStyle(e)
        return { fs: c.fontSize, pos: c.position, left: c.left, top: c.top, t: e.textContent.slice(0, 10) } })
    }
    return JSON.stringify(out, null, 2)
  })()`)
  console.log(res)
  ws.close(); process.exit(0)
})()
