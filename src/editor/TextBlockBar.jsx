import { useState } from 'react'
import { useEditor } from './EditorContext.jsx'

const MIN = 8
const MAX = 600

/**
 * 浮动文字工具条
 * 鼠标停在任意可编辑文字上时出现：
 *  - 左侧把手：按住拖动整段文字的位置（按住 Shift 可锁定横/纵单向移动）
 *  - 中间：字号 −/+，每次 5%
 *  - 归位：只清位置，保留字号
 *  - 还原：字号和位置一起恢复默认
 */
export default function TextBlockBar() {
  const { active, hover, showHover, scheduleHide, cancelHide, getStyle, setStyle, clearStyle } =
    useEditor()
  const [dragXY, setDragXY] = useState({ x: 0, y: 0 })

  if (!active || !hover) return null

  const st = getStyle(hover.key)
  const size = hover.size
  const step = Math.max(1, Math.round(size * 0.05)) // 每次 ±5%，至少 1px
  const dx = dragXY.x || st?.dx || 0
  const dy = dragXY.y || st?.dy || 0

  const bump = (dir) => {
    const next = Math.min(MAX, Math.max(MIN, Math.round(size + dir * step)))
    if (next === size) return
    setStyle(hover.key, { fontSize: `${next}px` })
    showHover({ ...hover, size: next })
  }

  const resetAll = () => {
    clearStyle(hover.key)
    setDragXY({ x: 0, y: 0 })
    showHover(null)
  }

  const resetPos = () => {
    const el = hover.el
    if (el) {
      el.style.position = ''
      el.style.left = ''
      el.style.top = ''
    }
    setDragXY({ x: 0, y: 0 })
    setStyle(hover.key, { dx: 0, dy: 0 })
  }

  const startDrag = (e) => {
    e.preventDefault()
    cancelHide()
    const el = hover.el
    if (!el) return

    const sx = e.clientX
    const sy = e.clientY
    const bx = st?.dx || 0
    const by = st?.dy || 0
    let cur = { x: bx, y: by }
    let axis = null

    const move = (ev) => {
      cancelHide() // 拖动过程中别把工具条收走
      let x = bx + (ev.clientX - sx)
      let y = by + (ev.clientY - sy)
      if (ev.shiftKey) {
        // 按住 Shift = 锁定成单一方向，方便对齐
        if (!axis) axis = Math.abs(x - bx) >= Math.abs(y - by) ? 'x' : 'y'
        if (axis === 'x') y = by
        else x = bx
      } else {
        axis = null
      }
      el.style.position = 'relative'
      el.style.left = `${Math.round(x)}px`
      el.style.top = `${Math.round(y)}px`
      cur = { x: Math.round(x), y: Math.round(y) }
      setDragXY(cur)
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
      if (cur.x || cur.y) setStyle(hover.key, { dx: cur.x, dy: cur.y })
      scheduleHide()
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  const r = hover.rect
  const barW = 300
  const left = Math.max(10, Math.min(r.left, (window.innerWidth || 1440) - barW - 10))
  const below = r.top < 64
  const top = below ? r.top + r.height + 10 : r.top - 46

  return (
    <div
      className="edsb"
      style={{ top, left }}
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
      onMouseDown={(e) => e.preventDefault()}
    >
      <span
        className="edsb-grip"
        onMouseDown={startDrag}
        title="按住拖动位置（配合 Shift 可只走横/竖）"
      >
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>

      {(dx || dy) && (
        <span className="edsb-pos" title="当前偏移">
          {dx > 0 ? `→${dx}` : dx < 0 ? `←${-dx}` : '·'}
          {dy > 0 ? `↓${dy}` : dy < 0 ? `↑${-dy}` : ''}
        </span>
      )}

      <span className="edsb-tag">字号</span>
      <button type="button" className="edsb-btn" onClick={() => bump(-1)} title="缩小 5%">
        A−
      </button>
      <span className="edsb-num">{size}px</span>
      <button type="button" className="edsb-btn" onClick={() => bump(1)} title="放大 5%">
        A＋
      </button>

      {(dx || dy) && (
        <button type="button" className="edsb-reset" onClick={resetPos} title="把位置挪回原位（字号保留）">
          归位
        </button>
      )}
      <button type="button" className="edsb-reset" onClick={resetAll} title="字号和位置都恢复默认">
        还原
      </button>
    </div>
  )
}
