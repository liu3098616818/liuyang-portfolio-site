/**
 * 从组件 JSX 里抽出 Editorable 的默认文案 children，与导出 JSON 严格比对。
 * 用法：node scripts/diff_jsx.mjs scripts/exported_xxx.json
 */
import fs from 'fs'
import path from 'path'

const json = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'))
const dir = path.resolve('src/components')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsx'))

/* 抓 <Editable k="xxx">...</Editable> 的 children 段 */
const found = {}
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf-8')
  const re = /<Editable\s+k="([^"]+)"[^>]*>([\s\S]*?)<\/Editable>/g
  let m
  while ((m = re.exec(src))) {
    const [, k, body] = m
    const tpl = /\{\s*'([^']*)'\s*\}/.exec(body) // {'单行表达式'}
    const tplBt = /\{\s*`([^`]*)`\s*\}/.exec(body) // {`模板字符串`}
    if (tpl) found[k] = { v: tpl[1], raw: true, file: f }
    else if (tplBt) found[k] = { v: tplBt[1], raw: true, tpl: true, file: f }
    else {
      // 普通多行文本 children：JSX 会把纯空白换行折叠成一个空格，但源码里若有 \n 表达式才算换行
      const t = body.replace(/\s+/g, ' ').trim()
      if (t) found[k] = { v: t, raw: false, file: f }
    }
  }
}

/* JSX 源码里拿到的还是字面写法，需要还原成真实字符串：
   {'a\nb'} → 真换行；JSX 里的 &amp; 渲染后是 & */
const unescapeJs = (s) => {
  try { return JSON.parse('"' + s.replace(/\\(?!["\\/bfnrtu])/g, '\\\\').replace(/"/g, '\\"') + '"') }
  catch { return s.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\\\/g, '\\') }
}
const unescapeHtml = (s) =>
  String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')

const KEYS = ['strengths.desc', 'contact.sub', 'contact.titleEn', 'about.desc', 'about.en']
console.log('=== 组件内默认文案 vs 导出 JSON（严格逐字符） ===')
let diff = 0
for (const k of KEYS) {
  const cur = found[k]
  const want = json.text?.[k]
  if (!cur) { console.log(`? ${k}  源码里没找到`); continue }
  if (want === undefined) { console.log(`- ${k}  导出里没有这条`); continue }
  const curVal = unescapeHtml(unescapeJs(cur.v))
  if (curVal === want) {
    console.log(`✓ ${k}`)
  } else {
    diff++
    console.log(`! ${k}  (${cur.file})`)
    console.log(`    源码: ${JSON.stringify(curVal)}`)
    console.log(`    导出: ${JSON.stringify(want)}`)
    // 定位到具体哪个字符不同
    const a = curVal, b = want
    let i = 0
    while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++
    console.log(`    首个不同位置 ${i}: 源码 ${JSON.stringify(a.slice(Math.max(0, i - 6), i + 8))} / 导出 ${JSON.stringify(b.slice(Math.max(0, i - 6), i + 8))}`)
  }
}
console.log(`\n差异合计 ${diff} 条`)
