/**
 * 验证「本地覆盖层盖住源码」是否为看不到新作品的原因。
 * 步骤：
 *   1) 正常打开 → 记录作品数（应为 23）
 *   2) 注入一份旧的 overrides.works（模拟用户此前在修改器里改过作品）→ 记录作品数
 *   3) 清空 overrides → 再看作品数
 * 用法：node scripts/cdp_override_test.mjs [url]
 */
import http from 'http'

const PORT = Number(process.env.CDP_PORT || 9333)
const TARGET = process.argv[2] || 'https://liu3098616818.github.io/liuyang-portfolio-site/'
const LS_KEY = 'ly_portfolio_overrides_v1'

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

  const open = async (label) => {
    await send('Page.navigate', { url: TARGET })
    await sleep(5000)
    const n = await evalJS("document.querySelectorAll('.work-card').length")
    const first = await evalJS(
      "document.querySelector('.work-card .work-info')?.innerText?.trim().split('\\n')[0] || '(无)'"
    )
    const filters = await evalJS(
      "JSON.stringify(Array.from(document.querySelectorAll('.filter')).map(f=>f.innerText.trim().split(/\\d/)[0]))"
    )
    console.log(`${label.padEnd(22)} 卡片 ${String(n).padStart(2)} 张   首条「${first}」`)
    console.log(`${''.padEnd(22)} 分类: ${filters}`)
    return n
  }

  console.log('=== 1) 干净状态（无覆盖层）===')
  await send('Page.navigate', { url: TARGET })
  await sleep(3000)
  await evalJS(`localStorage.clear()`)
  await open('清空后')

  console.log('\n=== 2) 注入旧版 overrides.works（模拟用户之前改过作品）===')
  // 用几条旧作品冒充用户本地残留的列表
  await evalJS(`
    (() => {
      const old = [
        { slug: 'drama-guzhuang', no: '01', title: '9.23 古装剧情', titleEn: 'PERIOD DRAMA', cat: '剧情与舞蹈', vertical: false, year: '2025', note: '' },
        { slug: 'dance-dunhuang', no: '02', title: '敦煌舞', titleEn: 'DUNHUANG DANCE', cat: '剧情与舞蹈', vertical: false, year: '2025', note: '' },
        { slug: 'edit-01', no: '06', title: '剪辑 01', titleEn: 'EDIT REEL 01', cat: '剪辑与调色', vertical: false, year: '2025', note: '' },
        { slug: 'custom-1790234885639', no: '09', title: '追踪飞行', titleEn: 'TRACKING SHOT', cat: '剧情与舞蹈', vertical: false, year: '2026', note: '', custom: true },
      ]
      localStorage.setItem(${JSON.stringify(LS_KEY)}, JSON.stringify({ works: old }))
      return true
    })()
  `)
  await open('注入旧覆盖层后')

  console.log('\n=== 3) 再清掉覆盖层 ===')
  await evalJS(`localStorage.clear()`)
  await open('再次清空后')

  ws.close()
  process.exit(0)
})()
