import { LogOut, Moon, Sun } from 'lucide-react'
import { LANGS, useT, type Lang } from '../i18n'
import type { View } from '../App'

export function Logo({ size = 40 }: { size?: number }) {
  // A house inside a circle, with a door and three dots for the kinds of help (food, health, family).
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="logo">
      <circle cx="24" cy="24" r="22" fill="#fff" stroke="#2f4a27" strokeWidth="3" />
      <path d="M11.5 23.5 L24 12.5 L36.5 23.5 M15 21 V35.5 H33 V21" fill="none" stroke="#2f4a27" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="27" y="28.5" width="4.6" height="7" rx="0.8" fill="#fff" stroke="#2f4a27" strokeWidth="1.8" />
      <circle cx="18.6" cy="25.6" r="2" fill="#5bd08d" />
      <circle cx="23.2" cy="25.6" r="2" fill="#ff6fa3" />
      <circle cx="20.9" cy="30.4" r="2" fill="#ffd23f" />
    </svg>
  )
}

// Quick exit: wipe the page and replace history so "Back" doesn't return here.
export function quickExit() {
  document.body.innerHTML = ''
  window.location.replace('https://www.google.com/search?q=weather')
}

const STEPS: { view: View; key: string }[] = [
  { view: 'household', key: 'ui.stepHousehold' },
  { view: 'results', key: 'ui.stepResults' },
  { view: 'plan', key: 'ui.stepPlan' },
]

export default function Header({ view, setView, setLang, canSee, dark, toggleDark }: {
  view: View; setView: (v: View) => void; setLang: (l: Lang) => void; canSee: boolean
  dark: boolean; toggleDark: () => void
}) {
  const t = useT()
  return (
    <header className="topbar no-print">
      <div className="topbar-inner">
        <button className="brand" onClick={() => setView('start')}>
          <Logo />
          <span className="brand-text">
            <strong>{t('ui.appName')}</strong>
            <small>{t('ui.appPlace')}</small>
          </span>
        </button>
        <div className="topbar-actions">
          <div className="lang-switch" role="group" aria-label={t('ui.language')}>
            {LANGS.map((l) => (
              <button key={l} lang={l} aria-pressed={t.lang === l} onClick={() => setLang(l)}>
                {l === 'hy' ? 'ՀԱՅ' : l.toUpperCase()}
                <span className="sr-only"> {t(`lang.${l}`)}</span>
              </button>
            ))}
          </div>
          <button className="theme-btn" onClick={toggleDark} aria-pressed={dark} aria-label={t('ui.darkMode')}
            title={dark ? t('ui.lightMode') : t('ui.darkMode')}>
            {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
          <button className="exit" onClick={quickExit} aria-label={t('ui.quickExit')}>
            <LogOut size={18} aria-hidden="true" />
            <span>{t('ui.quickExit')}</span>
          </button>
        </div>
      </div>
      {view !== 'start' && (
        <nav className="steps" aria-label={t('ui.steps')}>
          {STEPS.map((s, i) => (
            <button
              key={s.view}
              className="step"
              aria-current={view === s.view ? 'step' : undefined}
              disabled={s.view !== 'household' && !canSee}
              onClick={() => setView(s.view)}
            >
              <span className="step-num">{i + 1}</span>
              {t(s.key)}
            </button>
          ))}
        </nav>
      )}
    </header>
  )
}
