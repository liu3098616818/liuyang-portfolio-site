/** 验证编辑面板里「复制改动文本」按钮是否真能用 */
import http from 'http'

const PORT = 9333
const TARGET = process.argv[2] || 'http://127.0.0.1:4321/?edit=1'
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
const dialogs = []
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && waiting.has(m.id)) {
    waiting.get(m.id)(m)
    waiting.delete(m.id)
    return
  }
  if (m.method === 'Page.javascriptDialogOpening') {
    dialogs.push(m.params.message)
    sendRaw('Page.handleJavaScriptDialog', { accept: true })
  }
})
const sendRaw = (method, params = {}) => {
  const i = ++id
  ws.send(JSON.stringify({ id: i, method, params }))
}
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
// 尽量争取剪贴板权限，好把「自动复制」这条路径也验到
try {
  await send('Browser.grantPermissions', {
    origin: new URL(TARGET).origin,
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  })
} catch (e) {
  console.log('grantPermissions failed:', String(e).slice(0, 80))
}
await send('Page.navigate', { url: TARGET })
await sleep(6000)
await evalJS(`localStorage.removeItem('ly_portfolio_overrides_v1')`)
await send('Page.navigate', { url: TARGET })
await sleep(5500)

const out = await evalJS(`(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const o = {}
  // 切到「说明 / 同步」页签
  const tabs = [...document.querySelectorAll('.edp-tabs button')]
  o.tabs = tabs.map(t => t.textContent.trim())
  const helpTab = tabs.find(t => t.textContent.includes('说明'))
  if (helpTab) helpTab.click()
  await sleep(300)
  const btns = [...document.querySelectorAll('.edp-btns button')].map(b => b.textContent.trim())
  o.buttons = btns
  const copyBtn = [...document.querySelectorAll('.edp-btns button')]
    .find(b => b.textContent.includes('复制改动文本'))
  o.hasCopyBtn = !!copyBtn
  if (copyBtn) {
    copyBtn.click()
    await sleep(1200)
  }
  // 面板统计应该还是 0（干净状态），顺便确认没崩
  o.panelAlive = !!document.querySelector('.edp')
  const fb = document.querySelector('.edp-fallback-box')
  o.fallbackShown = !!fb
  o.fallbackPreview = fb ? fb.value.slice(0, 160) : null
  o.fallbackSelected = fb ? fb.selectionEnd > 0 : null
  return JSON.stringify(o, null, 2)
})()`)
console.log(out)
console.log('弹窗消息:', JSON.stringify(dialogs, null, 2))
ws.close()
process.exit(0)
