import { useEffect, useRef, useState } from 'react'
import { works as defaultWorks, categories, mediaUrl } from '../data/site.js'
import { useReveal } from '../hooks/useSite.js'
import { Editable, EditableVideo, useMediaSrc } from '../editor/Editable.jsx'
import { useEditor } from '../editor/EditorContext.jsx'

export default function Works({ onOpen }) {
  const [cat, setCat] = useState('ALL')
  const [headRef, headIn] = useReveal()
  const [gridRef, gridIn] = useReveal()
  const { worksList } = useEditor()

  const all = worksList || defaultWorks
  const list = cat === 'ALL' ? all : all.filter((w) => w.cat === cat)
  const countOf = (c) => (c === 'ALL' ? all.length : all.filter((w) => w.cat === c).length)

  return (
    <section className="section works" id="works">
      <div className="wrap">
        <div ref={headRef} className={`section-head reveal${headIn ? ' in' : ''}`}>
          <div className="sec-no">02</div>
          <div className="sec-titles">
            <h2>
              <Editable k="works.title">精选项目</Editable>
            </h2>
            <span className="en">
              <Editable k="works.en">Selected Works — 2024 / 2026</Editable>
            </span>
            <p className="desc">
              <Editable k="works.desc">
                {all.length} 条代表片段，覆盖剧情、调色、剪辑、时尚宣传、数字人与 AI 制作、Vlog
                与营销转化。鼠标悬停即播放预览，点击可全屏观看完整版。
              </Editable>
            </p>
          </div>
          <div className="sec-line" />
        </div>

        <div className="filters">
          {categories.map((c) => (
            <button
              key={c}
              className={`filter${cat === c ? ' on' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
              <i>{String(countOf(c)).padStart(2, '0')}</i>
            </button>
          ))}
        </div>

        <div ref={gridRef} className={`works-grid reveal${gridIn ? ' in' : ''}`}>
          {list.map((w) => (
            <WorkCard key={w.slug} w={w} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  )
}

function WorkCard({ w, onOpen }) {
  const vid = useRef(null)
  const { active, overrides } = useEditor()

  // 网页端新增的作品没有现成的转码文件，回落到「待上传」占位图
  const fbVideo = w.custom ? '' : mediaUrl(`preview/${w.slug}.mp4`)
  const fbPoster = w.custom ? mediaUrl('no-media.jpg') : mediaUrl(`poster/${w.slug}.jpg`)
  const videoSrc = useMediaSrc(`work.${w.slug}.video`, fbVideo)
  const posterSrc = useMediaSrc(`work.${w.slug}.poster`, fbPoster)
  const hasVideo = !!(videoSrc && (overrides.media?.[`work.${w.slug}.video`] || !w.custom))

  useEffect(() => {
    // 素材变化后重置播放头，避免残留旧画面
    if (vid.current) vid.current.load()
  }, [videoSrc])

  const enter = () => {
    const v = vid.current
    if (!v) return
    v.currentTime = 0
    v.play().catch(() => {})
  }
  const leave = () => {
    const v = vid.current
    if (!v) return
    v.pause()
  }

  return (
    <article
      className={`work-card${w.vertical ? ' vertical' : ''}`}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onClick={() => {
        if (!active) onOpen(w) // 编辑模式下点卡片不弹灯箱，避免干扰
      }}
    >
      <div className="work-media">
        <span className="work-no">NO.{w.no}</span>
        <span className="work-ratio">{w.vertical ? '9:16' : '16:9'}</span>
        <img src={posterSrc} alt={w.title} loading="lazy" />
        {hasVideo && (
          <video ref={vid} src={videoSrc} muted loop playsInline preload="none" />
        )}
        <span className="work-play" />
        <EditableVideo k={`work.${w.slug}.video`} kPoster={`work.${w.slug}.poster`} />
      </div>
      <div className="work-info">
        <div className="cat">
          <Editable k={`work.${w.slug}.cat`}>{w.cat}</Editable> —{' '}
          <Editable k={`work.${w.slug}.year`}>{w.year}</Editable>
        </div>
        <h3>
          <Editable k={`work.${w.slug}.title`}>{w.title}</Editable>
          <em>
            <Editable k={`work.${w.slug}.titleEn`}>{w.titleEn}</Editable>
          </em>
        </h3>
        <p className="note">
          <Editable k={`work.${w.slug}.note`}>{w.note}</Editable>
        </p>
      </div>
    </article>
  )
}
