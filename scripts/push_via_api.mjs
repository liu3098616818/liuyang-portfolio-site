/**
 * 通过 GitHub Git Data API 推送提交（不走 git 协议）。
 * 用途：本机代理对 github.com 的 CONNECT 隧道返回 502，git push 不可用，
 *       但 api.github.com 可通 —— 于是用 REST API 组装 commit 并更新 ref。
 * 用法：GH_TOKEN=xxx node scripts/push_via_api.mjs [提交说明]
 */
import fs from 'fs'

const OWNER = 'liu3098616818'
const REPO = 'liuyang-portfolio-site'
const BRANCH = 'main'
const API = 'https://api.github.com'

// token 与文件列表都从外部传入：沙箱里 execSync 调 cmd 会 EBUSY
const TOKEN = process.env.GH_TOKEN
const FILES = (process.env.FILES || '').split('\n').map((s) => s.trim()).filter(Boolean)
if (!TOKEN) {
  console.error('❌ 缺少 GH_TOKEN（外部执行 `gh auth token` 后传入）')
  process.exit(1)
}
const MESSAGE = process.argv[2] || 'update via API'

const api = async (path, method = 'GET', body = null) => {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'portfolio-push',
  }
  if (body) headers['Content-Type'] = 'application/json'
  const r = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  if (!r.ok) {
    throw new Error(`${method} ${path} → ${r.status}\n${text.slice(0, 600)}`)
  }
  return text ? JSON.parse(text) : null
}

;(async () => {
  // 文件列表由外部传入（git diff --name-only origin/main HEAD 的结果）
  const files = FILES

  console.log(`待提交 ${files.length} 个文件:`)
  files.forEach((f) => console.log('  ' + f))

  // 1) 当前 ref
  const ref = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`)
  const baseSha = ref.object.sha
  console.log(`\n当前 HEAD: ${baseSha.slice(0, 8)}`)

  // 2) 该 commit 的 tree
  const commit = await api(`/repos/${OWNER}/${REPO}/git/commits/${baseSha}`)
  const baseTree = commit.tree.sha

  // 3) 为每个文件建 blob；已删除的文件用 sha:null 表示从 tree 里移除
  const tree = []
  const missing = []
  for (const f of files) {
    if (!fs.existsSync(f)) {
      // 删除：tree 条目带 sha:null 即把该路径摘掉
      tree.push({ path: f, mode: '100644', type: 'blob', sha: null })
      missing.push(f)
      console.log(`  del  ${f}`)
      continue
    }
    const buf = fs.readFileSync(f)
    // 二进制（图片/视频）必须用 base64，否则会被当文本破坏
    const isBin = /\.(jpg|jpeg|png|mp4|mov|webm|gif|webp|ico|woff2?|ttf)$/i.test(f)
    const blob = await api(`/repos/${OWNER}/${REPO}/git/blobs`, 'POST', {
      content: buf.toString(isBin ? 'base64' : 'utf-8'),
      encoding: isBin ? 'base64' : 'utf-8',
    })
    tree.push({ path: f, mode: '100644', type: 'blob', sha: blob.sha })
    console.log(`  blob ${f} → ${blob.sha.slice(0, 8)}${isBin ? ' [bin]' : ''}`)
  }

  // 4) 建 tree
  const newTree = await api(`/repos/${OWNER}/${REPO}/git/trees`, 'POST', {
    base_tree: baseTree,
    tree,
  })

  // 5) 建 commit
  const newCommit = await api(`/repos/${OWNER}/${REPO}/git/commits`, 'POST', {
    message: MESSAGE,
    tree: newTree.sha,
    parents: [baseSha],
  })
  console.log(`\n新 commit: ${newCommit.sha.slice(0, 8)}`)

  // 6) 更新 ref
  await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, 'PATCH', {
    sha: newCommit.sha,
  })

  console.log(`\n✅ 已推送到 ${OWNER}/${REPO}@${BRANCH}`)
  console.log('   GitHub Actions 会自动构建部署，约 40 秒后生效')
})().catch((e) => {
  console.error('❌ 失败:', e.message)
  process.exit(1)
})
