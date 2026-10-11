/**
 * 简历填充核验：读回渲染后的 DOM 文本，逐条比对简历口径。
 * 用法：node scripts/cdp_resume.mjs [url]
 * 前置：干净无头 chrome 已监听 9333
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

// 简历里必须出现在页面上的关键串（宽松匹配：只查核心片段）
const MUST = [
  ['标题·短视频编导', '短视频编导'],
  ['标题英文', 'SHORT VIDEO DIRECTOR'],
  ['hero 粉丝 113.5w', '113.5'],
  ['hero 单条最高播放 720', '720'],
  ['hero 单条最高获赞 27.9', '27.9'],
  ['简介·400+ 条', '400+'],
  ['简介·矩阵小号', '范爸育儿'],
  ['简介·小号播放 120 万', '120 万'],
  ['简介·小号获赞 4.4 万', '4.4 万'],
  ['经历·公司名', '北京星满川影业'],
  ['经历·4 大内容矩阵', '爆款书单推荐'],
  ['经历·私域 200-250', '200-250'],
  ['经历·转介绍 90 人', '90 人'],
  ['经历·合作机构', '中公'],
  ['经历·小麻雀', '小麻雀'],
  ['经历·80+ 条剪辑', '80+'],
  ['经历·32 场拍摄', '32 场'],
  ['经历·16 条外景', '16 条'],
  ['技能·剪映', '剪映'],
  ['技能·达芬奇调色', '达芬奇调色'],
  ['技能·选题矩阵搭建', '选题矩阵搭建'],
  ['技能·星图合作', '星图合作'],
  ['技能·数字人制作', '数字人制作'],
  ['优势 004 标签', '61w → 113.5w'],
  ['优势 004 转介绍', '转介绍 90 人/月'],
]

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
    console.log('NO PAGE — 无头 chrome 未就绪')
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
  await send('Page.navigate', { url: TARGET })
  await sleep(4500)
  // 访客态：清掉本地覆盖，看源码基线
  await evalJS('localStorage.clear()')
  await send('Page.navigate', { url: TARGET })
  await sleep(5000)

  // 触发全部 reveal 动画（否则隐藏元素文本仍在，但保险起见滚一遍）
  await evalJS(`
    (async () => {
      const h = document.body.scrollHeight
      for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise(r=>setTimeout(r,60)) }
      window.scrollTo(0,0)
      await new Promise(r=>setTimeout(r,400))
      return true
    })()
  `)

  const bodyText = await evalJS('document.body.innerText.replace(/\\s+/g," ")')

  let pass = 0
  const fails = []
  for (const [name, needle] of MUST) {
    if (bodyText.includes(needle)) pass++
    else fails.push(`${name} → 缺 "${needle}"`)
  }

  // 时间线要点条数
  const tlCounts = await evalJS(`
    JSON.stringify(Array.from(document.querySelectorAll('.timeline .tl-item')).map(it => ({
      no: it.querySelector('.no')?.innerText?.trim(),
      period: it.querySelector('.period')?.innerText?.trim(),
      title: it.querySelector('h4')?.innerText?.trim().replace(/\\s+/g,' '),
      points: it.querySelectorAll('ul li').length,
    })))
  `)

  // 布局体检：有没有横向溢出 / 元素被裁
  const layout = await evalJS(`
    JSON.stringify({
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
      aboutH: Math.round(document.getElementById('about').getBoundingClientRect().height),
      introCount: document.querySelectorAll('.about-text p').length,
      skillCount: document.querySelectorAll('.skill, .skills span, [class*="skill"] > *').length,
    })
  `)

  console.log('=== 简历内容核验 ===')
  console.log(`通过 ${pass}/${MUST.length}`)
  if (fails.length) {
    console.log('未命中：')
    fails.forEach((f) => console.log('  ✗ ' + f))
  }
  console.log('\n=== 时间线 ===')
  console.log(tlCounts)
  console.log('\n=== 布局 ===')
  console.log(layout)

  ws.close()
  process.exit(0)
})()
