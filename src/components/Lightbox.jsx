import { useEffect } from 'react'
import { useEditor } from '../editor/EditorContext.jsx'
import { useMediaSrc } from '../editor/Editable.jsx'
import { mediaUrl } from '../data/site.js'

export default function Lightbox({ work, onClose }) {
  const { getText } = useEditor()
  const fbVideo = work.custom ? '' : mediaUrl(`preview/${work.slug}.mp4`)
  const fbPoster = work.custom ? mediaUrl('no-media.jpg') : mediaUrl(`poster/${work.slug}.jpg`)
  const videoSrc = useMediaSrc(`work.${work.slug}.video`, fbVideo)
  const posterSrc = useMediaSrc(`work.${work.slug}.poster`, fbPoster)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflowY = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflowY = ''
    }
  }, [onClose])

  if (!work) return null

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="关闭">
        ✕
      </button>

      <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
        {videoSrc ? (
          <video
            className="lb-video"
            src={videoSrc}
            poster={posterSrc}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div className="lb-empty">
            <img src={posterSrc} alt="" />
            <p>这个作品还没上传视频</p>
          </div>
        )}
        <div className="lb-side">
          <div className="cat">{getText(`work.${work.slug}.cat`, work.cat)}</div>
          <h3>{getText(`work.${work.slug}.title`, work.title)}</h3>
          <div className="en">{getText(`work.${work.slug}.titleEn`, work.titleEn)}</div>
          <p className="note">{getText(`work.${work.slug}.note`, work.note)}</p>
          <div className="no">{work.no}</div>
        </div>
      </div>

      <div className="lb-hint">ESC 关闭 · 点击空白处退出</div>
    </div>
  )
}
