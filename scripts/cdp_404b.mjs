/** 记录所有请求 URL + 状态，找出哪 15 个资源被 abort */
import http from 'http'
import fs from 'fs'

const PORT = 9333
const TARGET = process.argv[2] || 'https://liuyang-portfolio.app.workbuddy.host/'
const get = (p) =>
  new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
      let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res(JSON.parse(b)))
    }).on('error', rej)
  })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  let targets = []
  for (let i = 0; i < 30; i++) { try { targets = await get('/json/list'); if (targets.length) break } catch {} ; await sleep(500) }
  const page = targets.find((t) => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const waiting = new Map()
  const reqs = new Map()
  const bad = []
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id) }
    if (m.method === 'Network.requestWillBeSent') {
      reqs.set(m.params.requestId, m.params.request.url)
    }
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) {
      bad.push(m.params.response.status + ' ' + m.params.response.url)
    }
    if (m.method === 'Network.loadingFailed') {
      const u = reqs.get(m.params.requestId) || '(unknown)'
      bad.push('FAILED ' + m.params.errorText + '  ' + u)
    }
  })
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })

  await new Promise((r) => ws.addEventListener('open', r))
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
  await send('Page.navigate', { url: TARGET })
  await sleep(9000)

  // 移除 18536.xxx 那种 requestId 数字后缀的噪音
  const lines = [...new Set(bad)].filter((l) => !/^\s*$/.test(l))
  console.log('=== 有问题的请求 ===')
  console.log(lines.join('\n'))
  console.log('\n=== 200 的媒体请求数 ===')
  console.log([...reqs.values()].filter((u) => /\/media\//.test(u)).length)
  ws.close(); process.exit(0)
})()
