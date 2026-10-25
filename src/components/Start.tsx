import { LANGS, useT, type Lang } from '../i18n'
import { Flame, Mail, MapPin, ShoppingBasket, Zap } from './Icons'
import { programs } from '../data'
import House from './House'

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
          {/* First, so people who read Spanish or Armenian can switch before reading on. */}
          <div className="lang-big" role="group" aria-label={t('ui.language')}>
            {LANGS.map((l) => (
              <button key={l} lang={l} aria-pressed={t.lang === l} onClick={() => setLang(l)}>
                {t(`lang.${l}`)}
              </button>
            ))}
          </div>
          <h1 tabIndex={-1} className="view-heading hero-title">{t('ui.heroTitle')}</h1>
          {/* The text marks a word with *stars*; we show it plainly. */}
          <p className="hero-lead">{t('ui.heroLead', { n: programs.length }).replaceAll('*', '')}</p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onStart}>{t('ui.startCta')}</button>
            <button className="btn btn-secondary btn-lg" onClick={onExample}>{t('ui.example')}</button>
          </div>
          <p className="trust">{['trustFree', 'trustPrivate', 'trustTime', 'trustNoSignup'].map((k) => `${t(`ui.${k}`)}${t.lang === 'hy' ? '։' : '.'}`).join(' ')}</p>
        </div>
        <div className="hero-house">
          <House decorative parts={[
            { id: 'zip', x: 7.5, y: 57, icon: <MapPin size={20} />, label: '', done: false },
            { id: 'electric', x: 91.5, y: 22, icon: <Zap size={20} />, label: '', done: false },
            { id: 'gas', x: 26.75, y: 80, icon: <Flame size={20} />, label: '', done: false },
            { id: 'income', x: 85.5, y: 75, icon: <Mail size={20} />, label: '', done: false },
            { id: 'benefits', x: 62, y: 82, icon: <ShoppingBasket size={20} />, label: '', done: false },
          ]} windows={[{ id: 'a', letter: '', label: '' }, { id: 'b', letter: '', label: '' }, { id: 'c', letter: '', label: '' }]} />
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
