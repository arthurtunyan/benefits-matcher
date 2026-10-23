import { LANGS, useT, type Lang } from '../i18n'
import { ArrowRight, BookOpenCheck, CircleCheck, Flame, Mail, MapPin, ShieldCheck, ShoppingBasket, Users, Zap } from 'lucide-react'
import { programs } from '../data'
import House from './House'

export default function Start({ onStart, onExample, setLang }: {
  onStart: () => void; onExample: () => void; setLang: (l: Lang) => void
}) {
  const t = useT()
  const points = [
    { title: 'ui.pointPrivacyTitle', body: 'ui.pointPrivacyBody', Icon: ShieldCheck },
    { title: 'ui.pointPeopleTitle', body: 'ui.pointPeopleBody', Icon: Users },
    { title: 'ui.pointSourcesTitle', body: 'ui.pointSourcesBody', Icon: BookOpenCheck },
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
          <p className="eyebrow"><MapPin size={16} aria-hidden="true" /> {t('ui.eyebrow')}</p>
          <h1 tabIndex={-1} className="view-heading hero-title">{t('ui.heroTitle')}</h1>
          {/* *Starred words* get a soft highlight. */}
          <p className="hero-lead">{t('ui.heroLead', { n: programs.length }).split('*').map((s, i) => (i % 2 ? <em key={i}>{s}</em> : s))}</p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onStart}>{t('ui.startCta')} <ArrowRight size={20} aria-hidden="true" /></button>
            <button className="btn btn-secondary btn-lg" onClick={onExample}>{t('ui.example')}</button>
          </div>
          <ul className="trust">
            {['trustFree', 'trustPrivate', 'trustTime', 'trustNoSignup'].map((k) => (
              <li key={k}><CircleCheck size={18} aria-hidden="true" /> {t(`ui.${k}`)}</li>
            ))}
          </ul>
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
        {points.map(({ title, body, Icon }) => (
          <li key={title} className="point">
            <Icon className="point-icon" size={22} aria-hidden="true" />
            <h2>{t(title)}</h2>
            <p>{t(body)}</p>
          </li>
        ))}
      </ul>

      <p className="disclaimer">{t('ui.notDetermination')}</p>
    </div>
  )
}
