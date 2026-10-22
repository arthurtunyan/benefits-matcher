import { LogOut, Moon, Sun } from 'lucide-react'
import { LANGS, useT, type Lang } from '../i18n'
import type { View } from '../App'

export function Logo({ size = 36 }: { size?: number }) {
  // An open doorway with the sun rising behind it, and sunlight on the open door.
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="logo">
      <rect width="48" height="48" fill="var(--forest)" />
      <circle cx="33" cy="14.5" r="6" fill="var(--sun)" />
      <path d="M13 41V22a11 11 0 0 1 22 0v19" fill="none" stroke="var(--on-forest)" strokeWidth="3.5" />
      <path d="M24 41V26.5l8 3.5v11z" fill="var(--sun)" />
      <path d="M6 41h36" stroke="var(--on-forest)" strokeWidth="3" />
    </svg>
  )
}

// Quick exit: wipe the page, step back over this app's screens, and replace that entry so "Back" doesn't return here.
export function quickExit() {
  document.body.innerHTML = ''
  const leave = () => window.location.replace('https://www.google.com/search?q=weather')
  const depth = history.state?.depth ?? 0
  if (depth > 0) { addEventListener('popstate', leave, { once: true }); history.go(-depth) } else leave()
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
          {view !== 'start' && <>
            <div className="lang-switch" role="group" aria-label={t('ui.language')}>
              {LANGS.map((l) => (
                <button key={l} lang={l} aria-pressed={t.lang === l} onClick={() => setLang(l)}>
                  {l === 'hy' ? 'ՀԱՅ' : l.toUpperCase()}
                  <span className="sr-only"> {t(`lang.${l}`)}</span>
                </button>
              ))}
            </div>
            {/* Phones: a compact picker instead, so Quick exit always fits. CSS shows one or the other. */}
            <select className="lang-select" aria-label={t('ui.language')} value={t.lang} onChange={(e) => setLang(e.target.value as Lang)}>
              {LANGS.map((l) => <option key={l} value={l} lang={l}>{l === 'hy' ? 'ՀԱՅ' : l.toUpperCase()}</option>)}
            </select>
          </>}
          <button className="theme-btn" onClick={toggleDark} aria-pressed={dark} aria-label={t('ui.darkMode')}
            title={dark ? t('ui.lightMode') : t('ui.darkMode')}>
            {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
          {/* No aria-label: the visible word is the name (the hidden one is skipped by screen readers). */}
          <button className="exit" onClick={quickExit}>
            <LogOut size={18} aria-hidden="true" />
            <span className="exit-long">{t('ui.quickExit')}</span>
            <span className="exit-short">{t('ui.exitShort')}</span>
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
