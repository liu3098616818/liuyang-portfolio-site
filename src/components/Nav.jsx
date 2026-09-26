import { navItems, profile } from '../data/site.js'
import { scrollToId } from '../hooks/useSite.js'

export default function Nav({ active }) {
  return (
    <nav className={`nav${active !== 'hero' ? ' solid' : ''}`}>
      <div className="wrap nav-inner">
        <a className="logo" onClick={() => scrollToId('hero')}>
          LY<b>.</b>
          <span>{profile.enName}</span>
        </a>

        <div className="nav-links">
          {navItems.map((n) => (
            <a
              key={n.id}
              className={`nav-link${active === n.id ? ' active' : ''}`}
              onClick={() => scrollToId(n.id)}
            >
              <i>{n.no}</i>
              {n.cn}
            </a>
          ))}
        </div>

        <a className="nav-cta" onClick={() => scrollToId('contact')}>
          <span>联系我 / HIRE ME</span>
        </a>
      </div>
    </nav>
  )
}
