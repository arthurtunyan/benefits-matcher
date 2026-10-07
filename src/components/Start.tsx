import { ArrowRight, FileCheck, Lock, Sparkles, Users } from 'lucide-react'
import { LANGS, useT, type Lang } from '../i18n'
import { programs } from '../data'

function Hills() {
  // Decorative: the sun over the Verdugo hills.
  return (
    <svg className="hills" viewBox="0 0 800 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="glow">
          <stop offset="0.45" stopColor="var(--accent)" stopOpacity=".35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="610" cy="122" r="100" fill="url(#glow)" />
      <circle cx="610" cy="122" r="50" fill="var(--accent)" />
      <path d="M0 165 C 120 110, 230 140, 340 118 S 560 92, 800 150 V240 H0Z" fill="var(--hill-3)" />
      <path d="M0 192 C 150 150, 270 182, 410 160 S 650 142, 800 178 V240 H0Z" fill="var(--hill-2)" />
      <path d="M0 218 C 180 190, 330 214, 490 200 S 700 196, 800 210 V240 H0Z" fill="var(--hill-1)" />
    </svg>
  )
}

export default function Start({ onStart, onExample, setLang }: {
  onStart: () => void; onExample: () => void; setLang: (l: Lang) => void
}) {
  const t = useT()
  const points = [
    { icon: Lock, title: 'ui.pointPrivacyTitle', body: 'ui.pointPrivacyBody' },
    { icon: Users, title: 'ui.pointPeopleTitle', body: 'ui.pointPeopleBody' },
    { icon: FileCheck, title: 'ui.pointSourcesTitle', body: 'ui.pointSourcesBody' },
  ]
  return (
    <div className="start">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t('ui.appPlace')} · {t('ui.programsCovered', { n: programs.length })}</p>
          <h1 tabIndex={-1} className="view-heading">{t('ui.tagline')}</h1>
          <div className="lang-big" role="group" aria-label={t('ui.language')}>
            {LANGS.map((l) => (
              <button key={l} lang={l} aria-pressed={t.lang === l} onClick={() => setLang(l)}>
                {t(`lang.${l}`)}
              </button>
            ))}
          </div>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onStart}>
              {t('ui.startCta')} <ArrowRight size={20} aria-hidden="true" />
            </button>
            <button className="btn btn-ghost" onClick={onExample}>
              <Sparkles size={18} aria-hidden="true" /> {t('ui.example')}
            </button>
          </div>
          <p className="muted small">{t('ui.minutes')}</p>
        </div>
        <Hills />
      </section>

      <ul className="points">
        {points.map(({ icon: Icon, title, body }) => (
          <li key={title} className="point">
            <span className="point-icon"><Icon size={22} aria-hidden="true" /></span>
            <div>
              <h2>{t(title)}</h2>
              <p>{t(body)}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="disclaimer">{t('ui.notDetermination')}</p>
    </div>
  )
}
