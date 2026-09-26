/** 模拟「别人拿到链接点开」的场景：检查访客是否看得到修改器 */
import http from 'http'

const PORT = 9333
const TARGET = process.argv[2] || 'https://liuyang-portfolio.app.workbuddy.host/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
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

const targets = await get('/json/list')
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const waiting = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && waiting.has(m.id)) {
    waiting.get(m.id)(m)
    waiting.delete(m.id)
  }
})
await new Promise((r) => ws.addEventListener('open', r))
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
  return r.result?.result?.value ?? JSON.stringify(r)
}

await send('Page.enable')
await send('Runtime.enable')
await send('Page.navigate', { url: TARGET })
await sleep(6000)

console.log(
  await evalJS(`(() => {
  const o = {}
  o.url = location.href
  // 修改器相关 UI 是否出现在 DOM 里
  o.panelVisible = !!document.querySelector('.edp')
  o.toolbarVisible = !!document.querySelector('.edsb')
  o.editableBoxes = document.querySelectorAll('.ed-text').length
  o.mediaBars = document.querySelectorAll('.ed-media-bar, .ed-vbar, .ed-slot').length
  // 页面上能不能看到「网页修改器」这几个字
  o.bodyHasEditorWord = document.body.innerText.includes('网页修改器')
  o.bodyHasSizeWord = document.body.innerText.includes('字号')
  // 访客能不能正常看/播 content
  o.videoCount = document.querySelectorAll('video').length
  o.cardCount = document.querySelectorAll('.work-card').length
  o.posterCount = document.querySelectorAll('.work-media img').length
  o.heroTitleText = (document.querySelector('.hero-title, h1') || {}).innerText?.slice(0, 30)
  // 试着按一下 Ctrl+Shift+E（模拟懂行的人）
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', ctrlKey: true, shiftKey: true, bubbles: true }))
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', ctrlKey: true, shiftKey: true, bubbles: true }))
  return JSON.stringify(o, null, 2)
})()`)
)
await sleep(600)
console.log(
  '按完 Ctrl+Shift+E 之后：\n' +
    (await evalJS(`JSON.stringify({ panel: !!document.querySelector('.edp') })`))
)
ws.close()
process.exit(0)
