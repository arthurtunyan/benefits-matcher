import { LANGS, useT, type Lang } from '../i18n'
import { ArrowRight, BookOpenCheck, Flame, Mail, MapPin, ShieldCheck, ShoppingBasket, Users, Zap } from 'lucide-react'
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
          <p className="eyebrow">{t('ui.eyebrow')}</p>
          {/* *Starred words* in the tagline get the hand-drawn underline. */}
          <h1 tabIndex={-1} className="view-heading">{t('ui.tagline').split('*').map((s, i) => (i % 2 ? <em key={i}>{s}</em> : s))}</h1>
          <div className="lang-big" role="group" aria-label={t('ui.language')}>
            {LANGS.map((l) => (
              <button key={l} lang={l} aria-pressed={t.lang === l} onClick={() => setLang(l)}>
                {t(`lang.${l}`)}
              </button>
            ))}
          </div>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onStart}>{t('ui.startCta')} <ArrowRight size={20} aria-hidden="true" /></button>
            <button className="btn btn-ghost" onClick={onExample}>{t('ui.example')}</button>
          </div>
          <p className="muted small">{t('ui.programsCovered', { n: programs.length })}. {t('ui.minutes')}</p>
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
        {points.map(({ title, body, Icon }, i) => (
          <li key={title} className={`point ${i ? 'block-forest' : ''}`}>
            <Icon className="point-icon" size={26} aria-hidden="true" />
            <h2>{t(title)}</h2>
            <p>{t(body)}</p>
          </li>
        ))}
      </ul>

      <p className="disclaimer">{t('ui.notDetermination')}</p>
    </div>
  )
}
