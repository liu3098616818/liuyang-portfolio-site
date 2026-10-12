import { useEffect, useState } from 'react'
import { useEditor } from './EditorContext.jsx'
import { makeURL } from './storage.js'

/* 取某个媒体位的真实 src：本地上传过的用 IndexedDB 里的 Blob，否则回落默认资源 */
export function useMediaSrc(k, fallback) {
  const { overrides, tick } = useEditor()
  const m = overrides.media?.[k]
  const [src, setSrc] = useState(fallback)

  useEffect(() => {
    let alive = true
    let url = null
    if (!m) {
      setSrc(fallback)
      return
    }
    makeURL(m.id)
      .then((u) => {
        if (!alive) return
        if (u) {
          url = u
          setSrc(u)
        }
      })
      .catch(() => setSrc(fallback))
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [m?.id, fallback, tick])

  return src
}

/** 选文件 */
function pickFile(accept, cb) {
  const i = document.createElement('input')
  i.type = 'file'
  i.accept = accept
  i.onchange = async () => {
    const f = i.files?.[0]
    if (f) await cb(f)
  }
  i.click()
}

/* 只清掉首尾空白（JSX 源码里的缩进），中间的换行是用户手动敲的，必须原样保留。
   注意：源码里凡是多行写法的 children 都要写成单行表达式，否则换行会被当成有意的换行显示出来 */
const trimEdges = (s) => String(s).replace(/^[\s ]+|[\s ]+$/g, '')

/* ---------------- 文字就地编辑 ---------------- */
/**
 * k  = 文字内容的键（同一句话在多处出现时共用，改一处全站同步）
 * sk = 字号/位置的键（默认等于 k；因为同一个词在 Hero 是 100px、在页脚只有 13px，
 *      同一句话出现多次时传不同的 sk，样式才能各管各的）
 */
export function Editable({
  k,
  sk,
  children,
  as: Tag = 'span',
  className = '',
  ...rest
}) {
  const { active, getText, setText, getStyle, showHover, scheduleHide } = useEditor()
  const fallback = typeof children === 'string' ? trimEdges(children) : ''
  const v = getText(k, fallback)
  const st = getStyle(sk || k)
  const styleKey = sk || k

  const merged = {
    ...(rest.style || {}),
    ...(st?.fontSize ? { fontSize: st.fontSize } : null),
    // 位移用 relative + left/top，对 inline 元素也生效（transform 不行）
    ...(st && (st.dx || st.dy)
      ? { position: 'relative', left: `${st.dx || 0}px`, top: `${st.dy || 0}px` }
      : null),
    // 只有用户真的按下过回车，v 里才会有 \n
    ...(v.includes('\n') ? { whiteSpace: 'pre-wrap' } : null),
  }

  /* 悬停时把当前实际渲染出来的字号报给浮动工具条 */
  const emitHover = (el) => {
    if (!el) return
    const r = el.getBoundingClientRect()
    showHover({
      key: styleKey,
      el,
      size: Math.round(parseFloat(getComputedStyle(el).fontSize) || 16),
      rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    })
  }

  /* 保存前轻量清洗：
     contentEditable 的 innerText 末尾常常自带 \n，不处理的话每改一次就多一个空行 */
  const tidy = (s) =>
    String(s)
      .replace(/ /g, ' ')
      .replace(/[ \t]+$/gm, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[\s ]+$/, '')

  if (!active) {
    // 观众模式：字号、换行、位移照样生效
    return (
      <Tag className={className} {...rest} style={merged}>
        {v}
      </Tag>
    )
  }

  // 编辑态：非受控，输入过程中不写回 state，失焦才保存
  return (
    <Tag
      className={`${className} ed-text`.trim()}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-ed-key={k}
      {...rest}
      style={merged}
      onMouseEnter={(e) => emitHover(e.currentTarget)}
      onMouseLeave={scheduleHide}
      onBlur={(e) => {
        // 失焦才写回 state
        const nv = tidy(e.currentTarget.innerText)
        if (nv !== v) setText(k, nv)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          // 回车 / Shift+回车 = 换行（直接插 \n，配合 pre-wrap 立即可见）
          e.preventDefault()
          const sel = window.getSelection()
          if (!sel || !sel.rangeCount) return
          const range = sel.getRangeAt(0)
          range.deleteContents()
          const tn = document.createTextNode('\n')
          range.insertNode(tn)
          range.setStartAfter(tn)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
        } else if (e.key === 'Escape') {
          // 正在编辑文字时：Esc = 保存这一段并失焦，不退出编辑模式
          // （stopPropagation 会挡掉 window 上那个「Esc 退出编辑」的监听）
          e.preventDefault()
          e.stopPropagation()
          e.currentTarget.blur()
        }
      }}
      key={`${k}::${v}`}
    >
      {v}
    </Tag>
  )
}

/* ---------------- 图片位 ---------------- */
export function EditableImage({ k, src, alt = '', className = '' }) {
  const { active, overrides, setMedia, clearMedia } = useEditor()
  const real = useMediaSrc(k, src)
  const custom = !!overrides.media?.[k]

  return (
    // 访客态用一个中性类名 —— 不能让人在 DOM 里看到 ed-media 这种编辑器痕迹
    // （布局完全一样：.media-slot 与 .ed-media 的定位样式一致）
    <div className={active ? 'ed-media on' : 'media-slot'}>
      <img className={className} src={real} alt={alt} />
      {active && (
        <div className="ed-media-bar">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              pickFile('image/*', (f) => setMedia(k, f))
            }}
          >
            换图片
          </button>
          {custom && (
            <button
              type="button"
              className="ghost"
              onClick={(e) => {
                e.stopPropagation()
                clearMedia(k)
              }}
            >
              还原
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------------- 视频位（替换按钮 + 可选封面替换） ---------------- */
export function EditableVideo({ k, kPoster, slotLabel = '视频', compact = false }) {
  const { active, overrides, setMedia, clearMedia } = useEditor()
  const hasVideo = !!overrides.media?.[k]
  const hasPoster = !!overrides.media?.[kPoster]

  if (!active) return null

  return (
    <div className={`ed-vbar${compact ? ' compact' : ''}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => pickFile('video/*', (f) => setMedia(k, f))}
      >
        {hasVideo ? `已换${slotLabel}` : `换${slotLabel}`}
      </button>
      {kPoster && (
        <button
          type="button"
          onClick={() => pickFile('image/*', (f) => setMedia(kPoster, f))}
        >
          {hasPoster ? '已换封面' : '换封面'}
        </button>
      )}
      {(hasVideo || hasPoster) && (
        <button
          type="button"
          className="ghost"
          onClick={async () => {
            if (hasVideo) await clearMedia(k)
            if (hasPoster) await clearMedia(kPoster)
          }}
        >
          还原
        </button>
      )}
    </div>
  )
}

/** 给任意资源位挂一个替换按钮（用于 Hero 背景视频这类没有固定容器的场景） */
export function EditSlotButton({ k, accept = '*/*', label, children }) {
  const { active, overrides, setMedia, clearMedia } = useEditor()
  const [busy, setBusy] = useState(false)
  if (!active) return null
  const has = !!overrides.media?.[k]
  return (
    <div className="ed-slot">
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          pickFile(accept, async (f) => {
            setBusy(true)
            await setMedia(k, f)
            setBusy(false)
          })
        }
      >
        {busy ? '处理中…' : has ? `${label} ✓` : label}
      </button>
      {has && (
        <button type="button" className="ghost" onClick={() => clearMedia(k)}>
          还原
        </button>
      )}
      {children}
    </div>
  )
}

/** 列表类文字（多条，用换行分隔）——用于时间线要点、标签 */
export function EditableList({ k, sk, items, className = '', itemClassName = '' }) {
  const { active, getText, setText, getStyle, showHover, scheduleHide } = useEditor()
  const fallback = items.join('\n')
  const v = getText(k, fallback)
  const list = String(v).split('\n')
  const st = getStyle(sk || k)
  const styleKey = sk || k

  const emitHover = (el) => {
    if (!el) return
    const r = el.getBoundingClientRect()
    showHover({
      key: styleKey,
      size: Math.round(parseFloat(getComputedStyle(el).fontSize) || 16),
      rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    })
  }

  if (!active) {
    return (
      <>
        {list.map((t, i) => (
          <span key={i} className={itemClassName} style={st || undefined}>
            {t}
          </span>
        ))}
      </>
    )
  }

  return (
    <textarea
      className={`ed-list ${className}`.trim()}
      defaultValue={v}
      rows={Math.min(list.length + 1, 12)}
      spellCheck={false}
      style={st || undefined}
      onMouseEnter={(e) => emitHover(e.currentTarget)}
      onMouseLeave={scheduleHide}
      onBlur={(e) => {
        const nv = e.target.value
        if (nv !== v) setText(k, nv)
      }}
    />
  )
}
