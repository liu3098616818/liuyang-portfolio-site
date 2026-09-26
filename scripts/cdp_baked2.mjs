/**
 * 精确复核：用结构选择器（而非文本模糊匹配）确认 baseStyles 的固化位移/字号，
 * 并抓出 404 的具体 URL。
 */
import http from 'http'

const PORT = 9333
const TARGET = process.argv[2] || 'http://127.0.0.1:4173/'

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
  for (let i = 0; i < 30; i++) {
    try {
      targets = await get('/json/list')
      if (targets.length) break
    } catch {}
    await sleep(500)
  }
  const page = targets.find((t) => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const waiting = new Map()
  const failed = []
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && waiting.has(m.id)) {
      waiting.get(m.id)(m)
      waiting.delete(m.id)
    }
    if (m.method === 'Network.responseReceived') {
      const s = m.params.response.status
      if (s >= 400) failed.push(`${s} ${m.params.response.url}`)
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
    if (r.result?.exceptionDetails) return 'EXC: ' + r.result.exceptionDetails.text
    return r.result?.result?.value
  }

  await new Promise((r) => ws.addEventListener('open', r))
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Network.enable')

  await send('Page.navigate', { url: TARGET })
  await sleep(4000)

  const res = await evalJS(`(() => {
    const out = {}
    const cs = el => el ? getComputedStyle(el) : null
    const info = el => { const c = cs(el); return c ? { fs: c.fontSize, pos: c.position, left: c.left, top: c.top } : null }

    // Hero
    const h1 = document.querySelector('.title-cn > *')
    out['hero.name'] = info(h1)
    out['hero.kicker'] = info(document.querySelector('.hero-kicker p > *'))
    const units = [...document.querySelectorAll('.hero-stat b i > *')]
    out.statUnits = units.map(info)
    const nums = [...document.querySelectorAll('.hero-stat b')]
    out.statNums = nums.map(info)

    // About 小标题下的 cn 标签（stat.0.cn 之类其实不在 About，这里列全部 stat cn）
    const heroStatLabels = [...document.querySelectorAll('.hero-stat > span > *')]
    out.statLabels = heroStatLabels.map(e => ({ t: e.textContent, fs: cs(e).fontSize }))

    // 联系方式字号
    const vals = [...document.querySelectorAll('.big-link .val')]
    out.bigLinks = vals.map(e => ({ t: e.textContent.trim().slice(0, 14), fs: cs(e).fontSize }))

    return JSON.stringify(out, null, 2)
  })()`)
  console.log('=== 精确复核 ===')
  console.log(res)
  console.log('=== 404 / 错误响应 ===')
  console.log(failed.length ? [...new Set(failed)].join('\n') : '无')

  ws.close()
  process.exit(0)
})()
