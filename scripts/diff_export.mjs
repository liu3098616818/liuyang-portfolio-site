/**
 * 把导出的改动 JSON 与当前源码基线逐条比对，挑出真正的新增项。
 * 用法：node scripts/diff_export.mjs scripts/exported_xxx.json
 */
import fs from 'fs'
import { profile, stats, strengths, skills, works, baseStyles } from '../src/data/site.js'

const json = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'))
const norm = (s) => String(s).replace(/\s+/g, ' ').trim()
const same = (a, b) => norm(a) === norm(b)

const added = []
const sameList = []
const missing = []

console.log('=== 文字改动比对 ===')
for (const [k, v] of Object.entries(json.text || {})) {
  let cur = null
  const m = k.match(/^st\.(\d+)\.desc$/)
  const m2 = k.match(/^stat\.(\d+)\.(\w+)$/)
  const m3 = k.match(/^hero\.stat(\d+)\.(\w+)$/)
  const m4 = k.match(/^about\.intro\.(\d+)$/)
  const m5 = k.match(/^contact\.(\w+)\.value$/)

  if (k === 'about.intro.1') cur = profile.intro[1]
  else if (m4) cur = profile.intro[Number(m4[1])]
  else if (m) cur = strengths.find((s) => s.no === m[1])?.desc
  else if (k === 'skills.list') cur = skills.join('\n')
  else if (k === 'hero.enName') cur = profile.enName
  else if (k === 'hero.kicker') cur = `AVAILABLE FOR WORK — ${profile.city} / ${profile.birth}`
  else if (m3) cur = m3[2] === 'unit' ? stats[Number(m3[1])].unit : stats[Number(m3[1])].num
  else if (m2) cur = m2[2] === 'unit' ? stats[Number(m2[1])].unit : stats[Number(m2[1])][m2[2]]
  else continue

  if (cur === undefined || cur === null) { missing.push(k); continue }
  // 严格比对（换行有效）后再做宽松比对，便于识别「只差一个空格」这种
  const strict = String(cur) === String(v)
  if (strict) sameList.push(k)
  else if (same(cur, v)) added.push({ k, why: '仅空白差异', cur: JSON.stringify(cur), json: JSON.stringify(v) })
  else added.push({ k, why: '内容不同', cur: JSON.stringify(cur), json: JSON.stringify(v) })
}

console.log('完全一致：', sameList.length, '条')
sameList.forEach((k) => console.log('  ✓', k))
console.log('\n需要关注：', added.length, '条')
added.forEach((d) => {
  console.log(`  ! ${d.k}  [${d.why}]`)
  console.log(`      源码: ${d.cur}`)
  console.log(`      导出: ${d.json}`)
})
if (missing.length) console.log('\n无法自动定位：', missing.join(', '))

console.log('\n=== 样式基线比对 ===')
let sOk = 0
const sDiff = []
for (const [k, v] of Object.entries(json.style || {})) {
  const cur = baseStyles[k]
  if (!cur) { sDiff.push([k, '源码缺失', cur, v]); continue }
  const eq = JSON.stringify(cur) === JSON.stringify(v)
  if (eq) sOk++
  else sDiff.push([k, '值不同', cur, v])
}
console.log('完全一致：', sOk, '条')
console.log('差异：', sDiff.length, '条')
sDiff.forEach(([k, w, c, v]) => console.log(`  ! ${k} [${w}] 源码=${JSON.stringify(c)} 导出=${JSON.stringify(v)}`))
const extraKeys = Object.keys(baseStyles).filter((k) => !(k in (json.style || {})))
console.log('源码有、导出没有（即已被新的 PCs 覆盖之外的固化项）：', extraKeys.length ? extraKeys.join(', ') : '无')

console.log('\n=== 作品列表比对 ===')
const jw = json.works || []
console.log(`导出 ${jw.length} 条 / 源码 ${works.length} 条`)
if (jw.length) {
  const o = [...new Set(jw.map((w) => w.slug))].join(',')
  const c = [...new Set(works.map((w) => w.slug))].join(',')
  console.log('slug 顺序一致：', o === c)
  if (o !== c) { console.log('  导出:', o); console.log('  源码:', c) }
  let wd = 0
  jw.forEach((w) => {
    const cur = works.find((x) => x.slug === w.slug)
    if (!cur) return console.log('  ! 源码缺少', w.slug)
    for (const f of ['title', 'titleEn', 'cat', 'no', 'year', 'vertical']) {
      if (String(cur[f]) !== String(w[f])) { console.log(`  ! ${w.slug}.${f}: 源码=${cur[f]} 导出=${w[f]}`); wd++ }
    }
  })
  if (!wd) console.log('  ✓ 每条作品的字段完全一致')
}

console.log('\n=== 媒体（需用户提供原文件） ===')
;(json.media || []).forEach((m) => console.log(`  ${m.slot}  ←  ${m.fileName}  (${m.type})`))
