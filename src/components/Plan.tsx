import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react'
import { I18n, makeT, useT, type T } from '../i18n'
import type { Screening } from '../engine'
import { applyGroups, Deadlines, type ApplyGroup } from './Results'
import { help } from '../data'
import { Logo } from './Header'
import { areaOf } from './Help'

// Documents to bring, once each. "Proof of income" comes in two wordings (DPSS and utility discounts);
// the first already covers award letters, so the second is dropped when both appear.
function docsFor(groups: ApplyGroup[]) {
  const ids = [...new Set(groups.flatMap((g) => g.programs.flatMap(({ r }) => r.program.documents)))]
  return ids.includes('income') ? ids.filter((d) => d !== 'incomeOrBenefitLetter') : ids
}

// One numbered line per place to apply: one BenefitsCal line for Medi-Cal, CalFresh and CalWORKs, then WIC, and so on.
function Item({ g, n }: { g: ApplyGroup; n: number }) {
  const t = useT()
  const contacts = [...new Map(g.programs.map(({ r }) => [r.program.apply.url, r.program.apply])).values()]
  return (
    <div className="plan-item">
      <span className="plan-num">{n}</span>
      <div>
        <p className="plan-program">
          {g.programs.map(({ r, possibly }, i) => (
            <span key={r.program.id}>
              {i > 0 && ' · '}<strong lang="en">{r.program.name}</strong>
              {possibly && <> <span className="badge badge-possibly">{t('ui.possiblyShort')}</span></>}
            </span>
          ))}
        </p>
        <p className="small">
          {t('ui.planFor', { names: g.names.join(', ') })} · <strong>{t('ui.planWhere')}:</strong> {t(`where.${g.where}`)}
          {contacts.map((a) => (
            <span key={a.url}> · <span className="url">{new URL(a.url).hostname.replace(/^www\./, '')}</span>
              {a.phone && <> · <span className="nowrap">{a.phone}</span></>}</span>
          ))}
        </p>
      </div>
    </div>
  )
}

export default function Plan({ screening: s, today, zip, onBack }: { screening: Screening; today: string; zip?: string; onBack: () => void }) {
  const t = useT()
  const en = useMemo(() => makeT('en'), [])
  // The family's language, with English beside it so staff can read it too.
  const cols: T[] = t.lang === 'en' ? [t] : [t, en]
  const groups = cols.map((tt) => applyGroups(s, tt))
  const [has, setHas] = useState<Set<string>>(() => new Set()) // kept in memory only, shared by both columns
  const toggle = (d: string) => setHas((prev) => { const n = new Set(prev); if (n.has(d)) n.delete(d); else n.add(d); return n })

  const disaster = s.household.filter((r) => r.program.category === 'disaster')
  const docs = docsFor(groups[0])
  // Offices for the family's area first, then countywide ones, in the family's language (same list in both columns).
  const area = areaOf(zip)
  const helpers = help
    .filter((h) => (h.area === area || h.area === 'countywide') && h.languages.includes(t.lang) && (h.phone || h.address))
    .sort((a, b) => Number(b.area === area) - Number(a.area === area))
    .slice(0, 5)

  // Each row holds one section in every column, so both languages start each section on the same line (also in print).
  const rows: [string, (tt: T, c: number) => ReactNode][] = [['head', (tt) => <>
    <h2 className="plan-title">{tt('ui.planTitle')}</h2>
    <p className="small muted">{tt('ui.planIntro', { date: tt.date(today) })} {tt('ui.asOf')}: {tt.date(s.asOf).replace(/\.?$/, '.')}</p>
  </>]]
  if (disaster.length > 0) rows.push(['deadlines', () => <Deadlines results={disaster} facts={s.facts} />])
  rows.push(['programs', (tt) => <h3>{tt('ui.planPrograms')}</h3>])
  if (groups[0].length === 0) rows.push(['none', (tt) => <p>{tt('ui.planNothing')}</p>])
  groups[0].forEach((g, i) => rows.push([`item-${g.where}`, (_, c) => <Item g={groups[c][i]} n={i + 1} />]))
  if (docs.length > 0) rows.push(['docs', (tt, c) => <>
    <h3>{tt('ui.planDocs')}</h3>
    <ul className="checklist">
      {docs.map((d) => (
        <li key={d}>
          <label>
            <input type="checkbox" id={`doc-${c}-${d}`} checked={has.has(d)} onChange={() => toggle(d)} />
            <span>{tt(`docs.${d}`)}</span>
          </label>
        </li>
      ))}
    </ul>
    <p className="small muted">{tt('ui.goBag')}</p>
  </>])
  rows.push(['help', (tt) => <>
    <h3>{tt('ui.planHelp')}</h3>
    <ul className="plan-help">
      {helpers.map((h) => (
        <li key={h.id}>
          <strong lang="en">{h.name}</strong>
          {h.phone && <span className="nowrap"> · {h.phone}</span>}
          {h.address && <span> · {h.address}</span>}
        </li>
      ))}
    </ul>
  </>], ['end', (tt) => <>
    <p className="disclaimer">{tt('ui.disclaimer')}</p>
    <p className="small muted"><ShieldCheck size={14} aria-hidden="true" /> {tt('ui.planPrivacy')}</p>
  </>])

  return (
    <div className="plan">
      <div className="plan-toolbar no-print">
        <h1 tabIndex={-1} className="view-heading">{t('ui.stepPlan')}</h1>
        {cols.length > 1 && <p className="muted">{t('ui.planBothLanguages')}</p>}
        <div className="row">
          <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /> {t('ui.back')}</button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} aria-hidden="true" /> {t('ui.print')}</button>
        </div>
      </div>
      <div className={`paper ${cols.length > 1 ? 'paper-both' : ''}`}>
        <div className="paper-head">
          <Logo size={32} />
          <strong>{t('ui.appName')}</strong> <span className="muted">· {t('ui.appPlace')}</span>
        </div>
        {rows.map(([key, render]) => (
          <div key={key} className={`plan-row row-${key.split('-')[0]}`}>
            {cols.map((tt, c) => (
              <I18n.Provider key={tt.lang} value={tt}>
                <div lang={tt.lang} className="plan-cell">{render(tt, c)}</div>
              </I18n.Provider>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
