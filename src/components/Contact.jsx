import { profile } from '../data/site.js'
import { useReveal } from '../hooks/useSite.js'
import { Editable } from '../editor/Editable.jsx'
import { useEditor } from '../editor/EditorContext.jsx'

function hrefFor(label, value) {
  const v = String(value).trim()
  if (label === 'MAIL') return `mailto:${v}`
  if (label === 'TEL') return `tel:${v.replace(/\s/g, '')}`
  if (/^https?:\/\//.test(v)) return v
  return `https://${v}`
}

export default function Contact() {
  const [ref, shown] = useReveal()
  const { getText } = useEditor()

  return (
    <section className="contact" id="contact">
      <div className="contact-glow" />
      <div className="contact-glow-2" />

      <div className="wrap contact-inner">
        <div ref={ref} className={`reveal${shown ? ' in' : ''}`}>
          <div className="contact-kicker">
            <Editable k="contact.kicker">04 — LET'S WORK TOGETHER</Editable>
          </div>
          <h2 className="contact-title">
            <Editable k="contact.title">聊聊？</Editable>
            <em>
              <Editable k="contact.titleEn">LET'S TALK</Editable>
            </em>
          </h2>
          <p className="contact-sub">
            <Editable k="contact.sub">
              {'如果你在找能把选题、拍摄、剪辑、运营串起来的人，\n或者只是想聊聊账号怎么做起来 —— 直接联系我。'}
            </Editable>
          </p>

          <div className="big-links">
            {profile.contact.map((c) => {
              const val = getText(`contact.${c.label}.value`, c.value)
              return (
                <a
                  className="big-link"
                  key={c.label}
                  href={hrefFor(c.label, val)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="lbl">{c.label}</span>
                  <span className="val">
                    <Editable k={`contact.${c.label}.value`}>{c.value}</Editable>
                  </span>
                  <span className="arw">↗</span>
                </a>
              )
            })}
            <div className="big-link" style={{ cursor: 'default' }}>
              <span className="lbl">BASED IN</span>
              <span className="val">
                <Editable k="hero.city2" sk="contact.city">
                  {profile.city}
                </Editable>{' '}
                · <Editable k="contact.based">可出差 / 可驻场</Editable>
              </span>
              <span className="arw">◎</span>
            </div>
          </div>
        </div>

        <div className="footer">
          <span>
            © 2026{' '}
            <b>
              <Editable k="hero.name" sk="foot.name">
                {profile.name}
              </Editable>
            </b>{' '}
            <Editable k="hero.enName" sk="foot.enName">
              {profile.enName}
            </Editable>{' '}
            —{' '}
            <Editable k="hero.role" sk="foot.role">
              {profile.role}
            </Editable>{' '}
            /{' '}
            <Editable k="hero.role2" sk="foot.role2">
              {profile.role2}
            </Editable>
          </span>
          <span className="ft-pink">BUILT WITH REACT + VITE</span>
        </div>
      </div>
    </section>
  )
}
