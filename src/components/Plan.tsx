import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react'
import { I18n, makeT, useT, type T } from '../i18n'
import type { Program, Screening } from '../engine'
import { help } from '../data'
import { Logo } from './Header'
import { personLabel } from '../App'

interface Item { program: Program; variants: Set<string | undefined>; names: string[]; possibly: boolean }

// Programs to apply for: everything "likely" or "possibly", merged across people.
function planItems(s: Screening, t: T): Item[] {
  const items = new Map<string, Item>()
  const add = (r: Screening['household'][number], name: string) => {
    if (r.outcome === 'not') return
    const it = items.get(r.program.id) ?? { program: r.program, variants: new Set(), names: [], possibly: true }
    it.names.push(name)
    it.variants.add(r.best.rule.variant)
    it.possibly &&= r.outcome === 'possibly'
    items.set(r.program.id, it)
  }
  s.people.forEach(({ person, results }, i) => results.forEach((r) => add(r, personLabel(person, i, t))))
  s.household.forEach((r) => add(r, t('ui.householdGroup')))
  return [...items.values()]
}

function PlanBody({ s, today }: { s: Screening; today: string }) {
  const t = useT()
  const items = planItems(s, t)
  const docs = [...new Set(items.flatMap((i) => i.program.documents))]
  const helpers = help.filter((h) => h.languages.includes(t.lang) && (h.phone || h.address)).slice(0, 6)
  return (
    <div className="plan-body">
      <h2 className="plan-title">{t('ui.planTitle')}</h2>
      <p className="muted">{t('ui.planIntro', { date: t.date(today) })}</p>
      <p className="small muted">{t('ui.asOf')}: {t.date(s.asOf)}</p>

      <h3>{t('ui.planPrograms')}</h3>
      {items.length === 0 ? <p>{t('ui.planNothing')}</p> : (
        <ol className="plan-list">
          {items.map(({ program: p, variants, names, possibly }) => {
            // Show the variant only when it is the same for everyone listed.
            const variant = variants.size === 1 ? [...variants][0] : undefined
            return (
            <li key={p.id}>
              <p className="plan-program">
                <strong lang="en">{p.name}</strong>
                {variant && t.has(`variants.${variant}`) && <> — {t(`variants.${variant}`)}</>}
                {possibly && <span className="badge badge-possibly">{t('ui.possiblyShort')}</span>}
              </p>
              <p className="small">{t(`programs.${p.id}`)}</p>
              <p className="small">{t('ui.planFor', { names: names.join(', ') })}</p>
              <p className="small">
                <strong>{t('ui.planWhere')}:</strong> {t(`where.${p.apply.where}`)} · <span className="url">{p.apply.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                {p.apply.phone && <> · {p.apply.phone}</>}
              </p>
            </li>
            )
          })}
        </ol>
      )}

      {docs.length > 0 && (
        <>
          <h3>{t('ui.planDocs')}</h3>
          <ul className="checklist">{docs.map((d) => <li key={d}>{t(`docs.${d}`)}</li>)}</ul>
        </>
      )}

      <h3>{t('ui.planHelp')}</h3>
      <ul className="plan-help">
        {helpers.map((h) => (
          <li key={h.id}>
            <strong lang="en">{h.name}</strong>
            <span className="small"> {[h.phone, h.address].filter(Boolean).join(' · ')}</span>
          </li>
        ))}
      </ul>

      <p className="disclaimer">{t('ui.disclaimer')}</p>
      <p className="small muted"><ShieldCheck size={14} aria-hidden="true" /> {t('ui.planPrivacy')}</p>
    </div>
  )
}

export default function Plan({ screening, today, onBack }: { screening: Screening; today: string; onBack: () => void }) {
  const t = useT()
  const both = t.lang !== 'en'
  return (
    <div className="plan">
      <div className="plan-toolbar no-print">
        <h1 tabIndex={-1} className="view-heading">{t('ui.stepPlan')}</h1>
        {both && <p className="muted">{t('ui.planBothLanguages')}</p>}
        <div className="row">
          <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /> {t('ui.back')}</button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} aria-hidden="true" /> {t('ui.print')}</button>
        </div>
      </div>
      <div className="paper">
        <div className="paper-head">
          <Logo size={32} />
          <strong>{t('ui.appName')}</strong> <span className="muted">· {t('ui.appPlace')}</span>
        </div>
        <div className={both ? 'plan-cols' : ''}>
          <div lang={t.lang}><PlanBody s={screening} today={today} /></div>
          {both && (
            <I18n.Provider value={makeT('en')}>
              <div lang="en"><PlanBody s={screening} today={today} /></div>
            </I18n.Provider>
          )}
        </div>
      </div>
    </div>
  )
}
