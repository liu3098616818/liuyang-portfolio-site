import { useEffect, useRef } from 'react'
import { profile, stats, mediaUrl } from '../data/site.js'
import { Editable, EditSlotButton, useMediaSrc } from '../editor/Editable.jsx'

export default function Hero() {
  const vid = useRef(null)
  // 文件名带版本号：换背景视频时改这里的版本号，旧尺寸/旧内容的同名文件不会被
  // 浏览器或 CDN 缓存住（同名 URL 不变时，对方可能一直看到上一版）
  const heroVideo = useMediaSrc('hero.video', mediaUrl('hero-bg-v2.mp4'))

  useEffect(() => {
    // 某些浏览器需要显式 play 才能自动播放静音视频
    vid.current?.play().catch(() => {})
  }, [])

  return (
    <section className="hero" id="hero">
      <video
        ref={vid}
        className="hero-video"
        src={heroVideo}
        poster={mediaUrl('poster/drama-guzhuang.jpg')}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="hero-veil" />
      <div className="hero-veil-2" />
      <div className="hero-grid-lines" />

      <div className="wrap hero-body">
        <div className="hero-kicker">
          <span className="dot" />
          <p>
            <Editable k="hero.kicker">
              {`AVAILABLE FOR WORK — ${profile.city} / ${profile.birth}`}
            </Editable>
          </p>
        </div>

        <div className="title-stack">
          <h1 className="title-cn">
            <Editable k="hero.name">{profile.name}</Editable>
          </h1>
          <div className="title-en">
            <Editable k="hero.enName">{profile.enName}</Editable>
          </div>
        </div>

        <div className="hero-meta">
          <div className="role-tags">
            <div className="role-tag">
              <span className="cn">
                <Editable k="hero.role">{profile.role}</Editable>
              </span>
              <span className="en">
                <Editable k="hero.roleEn">{profile.roleEn}</Editable>
              </span>
            </div>
            <div className="role-tag">
              <span className="cn">
                <Editable k="hero.role2">{profile.role2}</Editable>
              </span>
              <span className="en">
                <Editable k="hero.roleEn2">{profile.roleEn2}</Editable>
              </span>
            </div>
          </div>

          <div className="hero-stats">
            {stats.slice(0, 3).map((s, i) => (
              <div className="hero-stat" key={s.en}>
                <b>
                  <Editable k={`hero.stat${i}.num`}>{s.num}</Editable>
                  <i>
                    <Editable k={`hero.stat${i}.unit`}>{s.unit}</Editable>
                  </i>
                </b>
                <span>
                  <Editable k={`hero.stat${i}.en`}>{s.en}</Editable>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 26, position: 'relative', zIndex: 6 }}>
          <EditSlotButton k="hero.video" accept="video/*" label="换首页背景视频" />
        </div>
      </div>

      <div className="hero-scroll">
        <span className="bar" />
        SCROLL DOWN
      </div>
      <div className="hero-corner">
        <div>
          BASED IN <b>{profile.city}</b>
        </div>
        <div>SINCE {profile.since}</div>
      </div>
    </section>
  )
}
