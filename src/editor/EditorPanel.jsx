import { useEffect, useRef, useState } from 'react'
import { useEditor } from './EditorContext.jsx'

const CATS = [
  '剧情与舞蹈',
  '剪辑与调色',
  '宣传与时尚',
  '数字人与智能制作',
  '数字人口播剪辑',
  'VLOG',
  '营销作品',
]

export default function EditorPanel() {
  const ed = useEditor()
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState('works') // works | help
  const [adding, setAdding] = useState(false)
  const fileRef = useRef(null)
  const fbRef = useRef(null)
  const [fallbackText, setFallbackText] = useState('')

  // 兜底框一出现就自动全选，用户直接 Ctrl + C
  useEffect(() => {
    if (!fallbackText) return
    const t = setTimeout(() => {
      fbRef.current?.focus()
      fbRef.current?.select()
    }, 30)
    return () => clearTimeout(t)
  }, [fallbackText])

  const draftInit = {
    title: '',
    titleEn: '',
    cat: CATS[0],
    vertical: true,
    year: String(new Date().getFullYear()),
    note: '',
  }
  const [draft, setDraft] = useState(draftInit)

  if (!ed.active) return null

  const doImport = async (f) => {
    const txt = await f.text()
    const ok = await ed.importData(txt)
    alert(ok ? '导入成功' : '文件格式不正确，导入失败')
  }

  const submitAdd = (e) => {
    e.preventDefault()
    if (!draft.title.trim()) return alert('请填写作品标题')
    ed.addWork(draft)
    setDraft(draftInit)
    setAdding(false)
  }

  return (
    <div className={`edp${open ? '' : ' folded'}`}>
      <header className="edp-head">
        <div className="edp-title">
          <b>网页修改器</b>
          <span>EDITOR</span>
        </div>
        <div className="edp-actions">
          <button type="button" onClick={() => setOpen((o) => !o)} title="折叠/展开">
            {open ? '—' : '＋'}
          </button>
          <button type="button" className="close" onClick={() => ed.setActive(false)} title="退出编辑（Esc）">
            ✕
          </button>
        </div>
      </header>

      {open && (
        <>
          <nav className="edp-tabs">
            <button className={tab === 'works' ? 'on' : ''} onClick={() => setTab('works')}>
              视频作品 {ed.worksList.length}
            </button>
            <button className={tab === 'help' ? 'on' : ''} onClick={() => setTab('help')}>
              说明 / 同步
            </button>
          </nav>

          {tab === 'works' && (
            <div className="edp-body">
              <div className="edp-row">
                <span className="edp-stat">
                  文字改动 <b>{ed.textCount}</b>
                </span>
                <span className="edp-stat">
                  样式 <b>{ed.styleCount}</b>
                </span>
                <span className="edp-stat">
                  已换媒体 <b>{ed.mediaCount}</b>
                </span>
              </div>

              <button className="edp-primary" onClick={() => setAdding((a) => !a)}>
                {adding ? '取消新增' : '＋ 增加视频模块'}
              </button>

              {adding && (
                <form className="edp-form" onSubmit={submitAdd}>
                  <label>
                    标题
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="例：城市宣传片"
                    />
                  </label>
                  <label>
                    英文标题
                    <input
                      value={draft.titleEn}
                      onChange={(e) => setDraft({ ...draft, titleEn: e.target.value })}
                      placeholder="CITY FILM"
                    />
                  </label>
                  <label>
                    分类
                    <select value={draft.cat} onChange={(e) => setDraft({ ...draft, cat: e.target.value })}>
                      {CATS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="inline">
                    版式
                    <select
                      value={draft.vertical ? 'v' : 'h'}
                      onChange={(e) => setDraft({ ...draft, vertical: e.target.value === 'v' })}
                    >
                      <option value="v">竖屏 9:16</option>
                      <option value="h">横屏 16:9</option>
                    </select>
                  </label>
                  <label className="inline">
                    年份
                    <input
                      value={draft.year}
                      onChange={(e) => setDraft({ ...draft, year: e.target.value })}
                      style={{ width: 80 }}
                    />
                  </label>
                  <label>
                    说明
                    <input
                      value={draft.note}
                      onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                      placeholder="例：城市宣传 · 编导 + 剪辑"
                    />
                  </label>
                  <button type="submit" className="edp-primary">
                    添加
                  </button>
                  <p className="edp-tip">
                    添加后，卡片会出现在页面里。视频和封面用卡片上的「换视频 / 换封面」按钮上传即可。
                  </p>
                </form>
              )}

              <ul className="edp-list">
                {ed.worksList.map((w, i) => (
                  <li key={w.slug}>
                    <span className="no">{w.no}</span>
                    <span className="t">
                      {w.title}
                      <em>{w.vertical ? '9:16' : '16:9'}</em>
                    </span>
                    <span className="ops">
                      <button disabled={i === 0} onClick={() => ed.moveWork(w.slug, -1)} title="上移">
                        ↑
                      </button>
                      <button
                        disabled={i === ed.worksList.length - 1}
                        onClick={() => ed.moveWork(w.slug, 1)}
                        title="下移"
                      >
                        ↓
                      </button>
                      <button className="danger" onClick={() => ed.removeWork(w.slug)} title="删除">
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'help' && (
            <div className="edp-body help">
              <p>
                <b>直接改：</b>页面上带虚线边框的文字可直接点进去改，改完点空白处或按 Enter 保存。
              </p>
              <p>
                <b>换图片 / 视频：</b>把鼠标移到对应位置，会出现「换图片 / 换视频」按钮。
              </p>
              <p>
                <b>排序：</b>用本面板列表里的 ↑ ↓ 调整顺序，编号会自动重排。
              </p>
              <p>
                <b>写文字：</b>点进文字里直接改。<b>回车 = 换行</b>（Shift+回车也一样）；
                <b>Esc = 保存这一段并收起光标</b>，点页面空白处同样会保存。
                退出整个编辑模式按 Ctrl + Shift + E 或点面板右上角 ✕。
              </p>
              <p>
                <b>调字号 / 挪位置：</b>鼠标停在任意可改文字上，上方浮出工具条。中间
                A− / A＋ 每次 5%；最左边的六点把手按住拖动就能挪位置，按住 Shift 再拖
                可锁定成横着或竖着走。
              </p>
              <p>
                <b>恢复：</b>工具条上「归位」只把位置挪回原位（字号保留），「还原」把字号和
                位置一起恢复默认。
              </p>
              <p>
                <b>发给助理同步：</b>改完点下面第一颗按钮，改动会<b>复制到剪贴板</b>，
                直接粘到对话框里发给我就行，不用去找下载的 JSON 文件。换了图片/视频的话，
                把原文件一起发我。
              </p>
              <div className="edp-btns">
                <button
                  className="edp-primary"
                  onClick={async () => {
                    const r = await ed.copyPayload()
                    if (r.ok) {
                      setFallbackText('')
                      alert('改动已复制，粘到对话框里发给助理即可')
                    } else {
                      // 浏览器不给剪贴板权限时，直接把内容摊开给人手动复制
                      setFallbackText(r.txt)
                    }
                  }}
                >
                  复制改动文本（发给我用）
                </button>
                {fallbackText && (
                  <div className="edp-fallback">
                    <p className="edp-tip">
                      浏览器不让自动复制。内容已全选，按 Ctrl + C 复制后粘贴给我即可：
                    </p>
                    <textarea
                      ref={fbRef}
                      className="edp-fallback-box"
                      readOnly
                      rows={10}
                      value={fallbackText}
                      onFocus={(e) => e.target.select()}
                    />
                    <button onClick={() => setFallbackText('')}>收起</button>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (ed.styleCount === 0) return alert('还没有调整过字号或位置')
                    if (confirm(`确定清空全部 ${ed.styleCount} 处字号 / 位置调整？`))
                      ed.clearAllStyles()
                  }}
                >
                  清空全部样式调整（{ed.styleCount}）
                </button>
                <button onClick={ed.exportData}>导出 JSON 文件（备用）</button>
                <button onClick={() => fileRef.current?.click()}>从 JSON 文件导入</button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
                />
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm('确定清空全部本地改动？此操作不可撤销。')) ed.resetAll()
                  }}
                >
                  重置全部
                </button>
              </div>
              <p className="edp-tip">
                改动只存在这台电脑的这个浏览器里。换设备、清缓存或换浏览器都会丢失，所以确认满意后
                请点「复制改动文本」发给我同步。
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
