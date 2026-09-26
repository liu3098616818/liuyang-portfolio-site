import { useEffect, useRef, useState } from 'react'

/** 滚动进入视口时触发一次「揭示」动画 */
export function useReveal(options) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.unobserve(el)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px', ...options }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return [ref, shown]
}

/** 顶部滚动进度 0-1 */
export function useScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setP(h > 0 ? window.scrollY / h : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return p
}

/** 当前所处章节（用于导航高亮） */
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.34
      let cur = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= y) cur = id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ids])
  return active
}

/** 平滑滚动到锚点 */
export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  window.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
}
