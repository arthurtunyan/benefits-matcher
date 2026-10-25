import { useT } from '../i18n'
import { ArrowLeft } from './Icons'

// Privacy and Terms of use: short, plain pages reached from the footer.
// The text lives in src/i18n/*.json under "legal" (privacy1..6, terms1..6).
const UPDATED = '2026-10-24'

export default function Legal({ page }: { page: 'privacy' | 'terms' }) {
  const t = useT()
  const count = 6
  return (
    <article className="legal">
      <h1 tabIndex={-1} className="view-heading page-title">{t(page === 'privacy' ? 'ui.privacyLink' : 'ui.termsLink')}</h1>
      <p className="muted small">{t('legal.updated', { date: t.date(UPDATED) })}</p>
      <div className="legal-body">
        {Array.from({ length: count }, (_, i) => <p key={i}>{t(`legal.${page}${i + 1}`)}</p>)}
      </div>
      <button type="button" className="btn btn-secondary" onClick={() => history.back()}>
        <ArrowLeft size={18} aria-hidden="true" /> {t('ui.back')}
      </button>
    </article>
  )
}
