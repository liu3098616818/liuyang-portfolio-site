import { profile, stats, timeline } from '../data/site.js'
import { useReveal } from '../hooks/useSite.js'
import { Editable, EditableImage } from '../editor/Editable.jsx'
import { useEditor } from '../editor/EditorContext.jsx'

/** 联系方式改动后，链接跟着一起更新 */
function hrefFor(label, value) {
  const v = String(value).trim()
  if (label === 'MAIL') return `mailto:${v}`
  if (label === 'TEL') return `tel:${v.replace(/\s/g, '')}`
  if (/^https?:\/\//.test(v)) return v
  return `https://${v}`
}

export default function About() {
  const [headRef, headIn] = useReveal()
  const [gridRef, gridIn] = useReveal()
  const [tlRef, tlIn] = useReveal()
  const { getText } = useEditor()

  return (
    <section className="section about" id="about">
      <div className="wrap">
        <div ref={headRef} className={`section-head reveal${headIn ? ' in' : ''}`}>
          <div className="sec-no">01</div>
          <div className="sec-titles">
            <h2>
              <Editable k="about.title">关于我</Editable>
            </h2>
            <span className="en">
              <Editable k="about.en">ABOUT — DIRECTOR &amp; NEW MEDIA</Editable>
            </span>
            <p className="desc">
              <Editable k="about.desc">
                {'编导出身的新媒体运营，做过实习拍剪，也扛过百万粉账号的内容盘子。\n下面是我做过的事、跑出来的数，以及能联系到我的方式。'}
              </Editable>
            </p>
          </div>
          <div className="sec-line" />
        </div>

        <div ref={gridRef} className={`about-grid reveal${gridIn ? ' in' : ''}`}>
          {/* 左：个人照片位（可直接替换为自己的照片） */}
          <div className="portrait">
            <div className="portrait-frame">
              <span className="portrait-no">01</span>
              <div className="portrait-media">
                <EditableImage k="portrait" src="/media/portrait.jpg" alt="个人照片" />
                <span className="portrait-tag">PORTRAIT</span>
              </div>
            </div>
            <div className="portrait-caption">
              <span>
                <Editable k="hero.name" sk="about.cap.name">
                  {profile.name}
                </Editable>{' '}
                /{' '}
                <Editable k="hero.enName" sk="about.cap.enName">
                  {profile.enName}
                </Editable>
              </span>
              <span>
                <b>
                  <Editable k="hero.city2" sk="about.cap.city">
                    {profile.city}
                  </Editable>
                </b>{' '}
                · <Editable k="profile.birth">{profile.birth}</Editable>
              </span>
            </div>
          </div>

          {/* 右：介绍 + 联系方式 + 数据 */}
          <div>
            <h3 className="about-lead">
              <Editable k="about.leadA">我做短视频，</Editable>
              <em>
                <Editable k="about.leadB">从选题到复盘一个人跑得通全流程</Editable>
              </em>
              。
            </h3>

            <div className="about-text">
              {profile.intro.map((t, i) => (
                <p key={i}>
                  <Editable k={`about.intro.${i}`}>{t}</Editable>
                </p>
              ))}
            </div>

            <div className="contact-rows">
              {profile.contact.map((c) => {
                const val = getText(`contact.${c.label}.value`, c.value)
                return (
                  <a
                    className="contact-row"
                    key={c.label}
                    href={hrefFor(c.label, val)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="lbl">{c.label}</span>
                    <span className="val">
                      <Editable k={`contact.${c.label}.value`}>{c.value}</Editable>
                    </span>
                    <span className="go">OPEN ↗</span>
                  </a>
                )
              })}
            </div>

            <div className="stats-grid">
              {stats.map((s, i) => (
                <div className="stat-cell" key={s.en}>
                  <b>
                    <Editable k={`stat.${i}.num`}>{s.num}</Editable>
                    <i>
                      <Editable k={`stat.${i}.unit`}>{s.unit}</Editable>
                    </i>
                  </b>
                  <span className="cn">
                    <Editable k={`stat.${i}.cn`}>{s.cn}</Editable>
                  </span>
                  <span className="en">
                    <Editable k={`stat.${i}.en`}>{s.en}</Editable>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 经历时间线 */}
        <div ref={tlRef} className={`timeline reveal${tlIn ? ' in' : ''}`}>
          {timeline.map((t) => (
            <div className="tl-item" key={t.no}>
              <div className="tl-left">
                <div className="period">
                  <Editable k={`tl.${t.no}.period`}>{t.period}</Editable>
                </div>
                <div className="no">{t.no}</div>
              </div>
              <div className="tl-right">
                <h4>
                  <Editable k={`tl.${t.no}.title`}>{t.title}</Editable>
                  <span>
                    <Editable k={`tl.${t.no}.titleEn`}>{t.titleEn}</Editable>
                  </span>
                </h4>
                <div className="org">
                  <Editable k={`tl.${t.no}.org`}>{t.org}</Editable>
                </div>
                <ul>
                  {t.points.map((p, i) => (
                    <li key={i}>
                      <Editable k={`tl.${t.no}.p${i}`}>{p}</Editable>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
