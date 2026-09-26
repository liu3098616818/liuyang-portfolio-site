import { marqueeText } from '../data/site.js'

export default function Marquee({ dark = false, reverse = false }) {
  const items = [...marqueeText, ...marqueeText, ...marqueeText]
  return (
    <div className={`marquee${dark ? ' dark' : ''}`}>
      <div
        className="marquee-track"
        style={reverse ? { animationDirection: 'reverse' } : undefined}
      >
        {items.map((t, i) => (
          <span key={i}>{t === '✦' ? <em>✦</em> : t}</span>
        ))}
      </div>
      <div
        className="marquee-track"
        style={reverse ? { animationDirection: 'reverse' } : undefined}
        aria-hidden="true"
      >
        {items.map((t, i) => (
          <span key={i}>{t === '✦' ? <em>✦</em> : t}</span>
        ))}
      </div>
    </div>
  )
}
