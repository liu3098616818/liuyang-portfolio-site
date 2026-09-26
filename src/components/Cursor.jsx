import { useEffect, useRef, useState } from 'react'

export default function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const [big, setBig] = useState(false)

  useEffect(() => {
    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx
    let ry = my
    let raf

    const move = (e) => {
      mx = e.clientX
      my = e.clientY
      dot.current.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`
      const t = e.target
      const hoverable =
        t.closest('a, button, .work-card, .filter, .strength-card, .contact-row, .big-link')
      setBig(!!hoverable)
    }

    const loop = () => {
      rx += (mx - rx) * 0.16
      ry += (my - ry) * 0.16
      if (ring.current)
        ring.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', move)
    loop()
    return () => {
      window.removeEventListener('mousemove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={ring} className={`cursor-ring${big ? ' big' : ''}`} />
      <div ref={dot} className={`cursor${big ? ' big' : ''}`} />
    </>
  )
}
