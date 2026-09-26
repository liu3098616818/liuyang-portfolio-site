import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  loadOverrides,
  saveOverrides,
  clearOverrides,
  putFile,
  delFile,
  wipeFiles,
} from './storage'
import { works as defaultWorks, baseStyles } from '../data/site.js'

const Ctx = createContext(null)
export const useEditor = () => useContext(Ctx)

const pad = (n) => String(n).padStart(2, '0')

export function EditorProvider({ children }) {
  const [active, setActive] = useState(false)
  const [overrides, setOverrides] = useState(() => loadOverrides())
  const [tick, setTick] = useState(0) // 强制依赖媒体的组件刷新

  useEffect(() => {
    saveOverrides(overrides)
  }, [overrides])

  /* 进入方式：Ctrl + Shift + E，或网址加 ?edit=1 */
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault()
        setActive((a) => !a)
      }
      if (e.key === 'Escape' && active) setActive(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  useEffect(() => {
    try {
      if (new URLSearchParams(location.search).get('edit') === '1') setActive(true)
    } catch {}
  }, [])

  const touch = useCallback(() => setTick((t) => t + 1), [])

  /* ---------------- 文字 ---------------- */
  const getText = useCallback(
    (k, fb = '') => {
      const t = overrides.text
      return t && k in t ? t[k] : fb
    },
    [overrides]
  )

  const setText = useCallback((k, v) => {
    setOverrides((o) => ({ ...o, text: { ...(o.text || {}), [k]: v } }))
  }, [])

  const resetText = useCallback((k) => {
    setOverrides((o) => {
      const t = { ...(o.text || {}) }
      delete t[k]
      return { ...o, text: t }
    })
  }, [])

  const textCount = useMemo(() => Object.keys(overrides.text || {}).length, [overrides])

  /* ---------------- 字号等样式微调 ---------------- */
  // 网页上再调过就用网页的，否则用源码里的基线样式
  const getStyle = useCallback(
    (k) => overrides.style?.[k] || baseStyles[k] || null,
    [overrides]
  )

  const setStyle = useCallback((k, patch) => {
    setOverrides((o) => ({
      ...o,
      style: { ...(o.style || {}), [k]: { ...(o.style?.[k]), ...patch } },
    }))
  }, [])

  const clearStyle = useCallback((k) => {
    setOverrides((o) => {
      const s = { ...(o.style || {}) }
      delete s[k]
      return { ...o, style: s }
    })
  }, [])

  const clearAllStyles = useCallback(() => {
    setOverrides((o) => {
      const n = { ...o }
      delete n.style
      return n
    })
  }, [])

  const styleCount = useMemo(() => Object.keys(overrides.style || {}).length, [overrides])

  /* ---------------- 悬停中的可编辑块（用于浮动字号条） ---------------- */
  const [hover, setHover] = useState(null)
  const hoverTimer = useRef(null)

  const cancelHide = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
  }, [])

  const showHover = useCallback(
    (info) => {
      cancelHide()
      setHover(info)
    },
    [cancelHide]
  )

  const scheduleHide = useCallback(() => {
    cancelHide()
    hoverTimer.current = setTimeout(() => setHover(null), 280)
  }, [cancelHide])

  useEffect(() => {
    // 滚动时先收起，避免浮动条与文字错位
    const onScroll = () => setHover(null)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ---------------- 媒体 ---------------- */
  const setMedia = useCallback(
    async (k, file) => {
      const id = `${k}::${Date.now()}`
      await putFile(id, file)
      setOverrides((o) => ({
        ...o,
        media: { ...(o.media || {}), [k]: { id, name: file.name, type: file.type } },
      }))
      touch()
    },
    [touch]
  )

  const clearMedia = useCallback(
    async (k) => {
      const m = overrides.media?.[k]
      if (m) await delFile(m.id)
      setOverrides((o) => {
        const md = { ...(o.media || {}) }
        delete md[k]
        return { ...o, media: md }
      })
      touch()
    },
    [overrides, touch]
  )

  const mediaCount = useMemo(() => Object.keys(overrides.media || {}).length, [overrides])

  /* ---------------- 作品列表（增删改排序） ---------------- */
  const worksList = overrides.works || defaultWorks

  const setWorksList = useCallback((list) => {
    setOverrides((o) => ({
      ...o,
      works: list.map((w, i) => ({ ...w, no: pad(i + 1) })),
    }))
  }, [])

  const addWork = useCallback(
    (draft) => {
      const list = [...worksList]
      list.push({
        slug: `custom-${Date.now()}`,
        no: pad(list.length + 1),
        custom: true, // 标记为网页端新增，导出时提示需要提供媒体文件
        ...draft,
      })
      setWorksList(list)
      return list[list.length - 1]
    },
    [worksList, setWorksList]
  )

  const removeWork = useCallback(
    (slug) => {
      setWorksList(worksList.filter((w) => w.slug !== slug))
    },
    [worksList, setWorksList]
  )

  const moveWork = useCallback(
    (slug, dir) => {
      const i = worksList.findIndex((w) => w.slug === slug)
      const j = i + dir
      if (i < 0 || j < 0 || j >= worksList.length) return
      const list = [...worksList]
      ;[list[i], list[j]] = [list[j], list[i]]
      setWorksList(list)
    },
    [worksList, setWorksList]
  )

  /* ---------------- 导出 / 导入 / 重置 ---------------- */
  const buildPayload = useCallback(() => {
    return {
      _app: '刘杨作品集 · 网页修改器',
      _exportedAt: new Date().toISOString(),
      _notice:
        '文字改动、字号位置、作品结构可直接据此同步；上传的图片/视频本体不在此文件内，需另行提供原文件。',
      text: overrides.text || {},
      style: overrides.style || {},
      works: overrides.works || null,
      media: Object.entries(overrides.media || {}).map(([k, v]) => ({
        slot: k,
        fileName: v.name,
        type: v.type,
        hint: '此项为用户本地上传，需提供同名或对应原文件',
      })),
    }
  }, [overrides])

  const copyPayload = useCallback(async () => {
    const txt = JSON.stringify(buildPayload(), null, 2)
    try {
      await navigator.clipboard.writeText(txt)
      return { ok: true, txt }
    } catch {
      // 没有剪贴板权限时退回「选中文本框」的老办法
      try {
        const ta = document.createElement('textarea')
        ta.value = txt
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        return { ok, txt }
      } catch {
        return { ok: false, txt }
      }
    }
  }, [buildPayload])

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `portfolio-changes-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '')}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }, [buildPayload])

  const importData = useCallback(async (json) => {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      // 媒体本体无法随 JSON 迁移，保留本地已有的 Blob 索引
      setOverrides((o) => ({
        text: data.text || {},
        works: data.works || undefined,
        style: data.style || {},
        media: o.media || {},
      }))
      return true
    } catch {
      return false
    }
  }, [])

  const resetAll = useCallback(async () => {
    await wipeFiles()
    clearOverrides()
    setOverrides({})
    touch()
  }, [touch])

  const value = {
    active,
    setActive,
    overrides,
    tick,
    getText,
    setText,
    resetText,
    textCount,
    setMedia,
    clearMedia,
    mediaCount,
    getStyle,
      setStyle,
      clearStyle,
      clearAllStyles,
      styleCount,
      hover,
      showHover,
      scheduleHide,
      cancelHide,
    worksList,
    setWorksList,
    addWork,
    removeWork,
    moveWork,
    exportData,
    copyPayload,
    buildPayload,
    importData,
    resetAll,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
