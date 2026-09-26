/**
 * 校验「改动已固化进源码」：访客模式（无 ?edit=1）+ 清空 localStorage，
 * 全部改动必须原样出现在默认渲染结果里。
 * 用法：
 *   1) node scripts/serve_dev.mjs（或 vite preview）起本地服务
 *   2) chrome --headless=new --remote-debugging-port=9333
 *   3) node scripts/cdp_baked.mjs [url]
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
  if (!page) {
    console.log('NO PAGE TARGET')
    process.exit(1)
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const waiting = new Map()
  const errors = []
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && waiting.has(m.id)) {
      waiting.get(m.id)(m)
      waiting.delete(m.id)
    }
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push(JSON.stringify(m.params.exceptionDetails?.text || m.params))
    }
    if (m.method === 'Log.entryAdded' && m.params.entry?.level === 'error') {
      errors.push(m.params.entry.text)
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
    if (r.result?.exceptionDetails) return 'EXC: ' + JSON.stringify(r.result.exceptionDetails.text)
    return r.result?.result?.value
  }

  await new Promise((r) => ws.addEventListener('open', r))
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')

  // 第一次进：清干净残留数据
  await send('Page.navigate', { url: TARGET })
  await sleep(3500)
  await evalJS(`localStorage.clear()`)
  await send('Page.navigate', { url: TARGET })
  await sleep(4500)

  const res = await evalJS(`(async () => {
    const out = {}
    const leafByText = (s) => [...document.querySelectorAll('*')].find(
      e => e.children.length === 0 && e.textContent.includes(s)
    )

    /* ---- 1. 换行是否生效（访客态） ---- */
    const checkBreak = (snippet, label) => {
      const el = leafByText(snippet)
      if (!el) return (out[label] = 'NOT FOUND')
      out[label] = {
        whiteSpace: getComputedStyle(el).whiteSpace,
        lines: el.getClientRects().length,
        hasLF: el.textContent.indexOf('\\n') > -1,
      }
    }
    checkBreak('运营期账号粉丝从 61w', 'intro1')
    checkBreak('导入或等于', 'dummy')            // 占位，必然 NOT FOUND，忽略
    checkBreak('拍摄执行、剪辑成片', 'st001')
    checkBreak('缩短选题与制作周期', 'st003')
    checkBreak('运营期账号粉丝 61w', 'st004')
    checkBreak('如果你在找能把选题', 'contactSub')

    /* ---- 2. 大小写 ---- */
    const en = leafByText("LET'S TALK")
    out.titleEn = en ? en.textContent.trim() : 'NOT FOUND'
    const kick = leafByText('AVAILABLE FOR WORK')
    out.kicker = kick ? kick.textContent.trim() : 'NOT FOUND'
    const abEn = leafByText('ABOUT — DIRECTOR')
    out.aboutEn = abEn ? abEn.textContent.trim() : 'NOT FOUND'

    /* ---- 3. 作品数量与第 9 位新模块 ---- */
    out.cards = document.querySelectorAll('.work-card, .wc, [class*="card"]').length
    out.nos = [...document.querySelectorAll('*')]
      .filter(e => e.children.length === 0 && /^NO\\.\\d\\d$/.test(e.textContent.trim()))
      .map(e => e.textContent.trim())
    out.hasSlot09 = !!leafByText('待加入视频模块')
    out.hasTitleEn123 = !!leafByText('123')

    /* ---- 4. 技能列表不含「秘塔」 ---- */
    out.hasMita = !!leafByText('秘塔')
    out.hasShoot = !!leafByText('摄影基础')

    /* ---- 5. 字号基线 ---- */
    const fsOf = (s) => { const e = leafByText(s); return e ? getComputedStyle(e).fontSize : null }
    out.fs = {
      statUnit0: (() => { const e = leafByText('+'); return e ? getComputedStyle(e).fontSize : null })(),
      followersCn: fsOf('账号粉丝'),
      tel: fsOf('199 3376 9731'),
      mail: fsOf('3098616818@qq.com'),
      based: fsOf('可出差'),
    }

    /* ---- 6. 位移基线 ---- */
    const nameEl = leafByText('刘杨')
    if (nameEl) {
      const cs = getComputedStyle(nameEl)
      out.heroName = { position: cs.position, left: cs.left, top: cs.top }
    }
    const stat0 = leafByText('480')
    if (stat0) {
      const cs = getComputedStyle(stat0)
      out.stat0Num = { position: cs.position, left: cs.left, top: cs.top }
    }

    /* ---- 7. 无水印：媒体数量 ---- */
    out.videoTags = document.querySelectorAll('video').length
    out.imgTags = document.querySelectorAll('img').length
    return JSON.stringify(out, null, 2)
  })()`)

  console.log('=== 固化校验（访客态 + 空 localStorage） ===')
  console.log(res)
  console.log('=== JS 报错 ===')
  console.log(errors.length ? errors.join('\n') : '无')

  ws.close()
  process.exit(0)
})()
