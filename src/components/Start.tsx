import { LANGS, useT, type Lang } from '../i18n'
import { programs } from '../data'

export default function Start({ onStart, onExample, setLang }: {
  onStart: () => void; onExample: () => void; setLang: (l: Lang) => void
}) {
  const t = useT()
  const points = [
    { title: 'ui.pointPrivacyTitle', body: 'ui.pointPrivacyBody' },
    { title: 'ui.pointPeopleTitle', body: 'ui.pointPeopleBody' },
    { title: 'ui.pointSourcesTitle', body: 'ui.pointSourcesBody' },
  ]
  return (
    <div className="start">
      <section className="hero">
        <div className="hero-copy">
          <h1 tabIndex={-1} className="view-heading">{t('ui.tagline')}</h1>
          <div className="lang-big" role="group" aria-label={t('ui.language')}>
            {LANGS.map((l) => (
              <button key={l} lang={l} aria-pressed={t.lang === l} onClick={() => setLang(l)}>
                {t(`lang.${l}`)}
              </button>
            ))}
          </div>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onStart}>{t('ui.startCta')}</button>
            <button className="btn btn-ghost" onClick={onExample}>{t('ui.example')}</button>
          </div>
          <p className="muted small">{t('ui.programsCovered', { n: programs.length })}. {t('ui.minutes')}</p>
        </div>
      </section>

      <ul className="points">
        {points.map(({ title, body }) => (
          <li key={title} className="point">
            <h2>{t(title)}</h2>
            <p>{t(body)}</p>
          </li>
        ))}
      </ul>

      <p className="disclaimer">{t('ui.notDetermination')}</p>
    </div>
  )
}
