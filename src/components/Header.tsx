import { LogOut } from 'lucide-react'
import { LANGS, useT, type Lang } from '../i18n'
import type { View } from '../App'

export function Logo({ size = 36 }: { size?: number }) {
  // An open doorway with the sun rising behind it.
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="logo">
      <rect width="48" height="48" rx="13" fill="var(--brand)" />
      <circle cx="31" cy="17" r="6.5" fill="var(--accent)" />
      <path d="M14 39V21a10 10 0 0 1 20 0v18" fill="none" stroke="var(--brand-ink)" strokeWidth="4" strokeLinecap="round" />
      <path d="M24 39V25l7 3v11" fill="var(--brand-ink)" opacity=".9" />
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

export default function Header({ view, setView, setLang, canSee }: {
  view: View; setView: (v: View) => void; setLang: (l: Lang) => void; canSee: boolean
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
