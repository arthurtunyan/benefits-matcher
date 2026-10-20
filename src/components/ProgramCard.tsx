import { useId, useState } from 'react'
import { Check, ChevronDown, CircleHelp, ExternalLink, Phone, X } from 'lucide-react'
import { useT, type T } from '../i18n'
import { isChangeable, leaves, lookup, nearMiss, type CondResult, type Facts, type LeafResult, type ProgramResult } from '../engine'
import { help, tables } from '../data'

const MONEY = new Set(['monthlyIncome', 'annualIncome', 'calworksIncome', 'earnedIncome'])

// Where an "other help" suggestion links to.
const ALT_LINKS: Record<string, string | undefined> = {
  foodbank: help.find((h) => h.id === 'foodbank')?.url,
  '211': 'https://211la.org',
  hcc: help.find((h) => h.id === 'nlsla')?.url,
  clinics: help.find((h) => h.id === 'cchc-glendale')?.url,
  ssi: 'https://www.ssa.gov/ssi',
}

function fmt(fact: string, v: unknown, t: T): string {
  if (v === undefined) return '—'
  if (fact === 'status') return (Array.isArray(v) ? v : [v]).map((s) => t(`statusShort.${s}`)).join(` ${t('cond.or')} `)
  if (fact === 'electric' || fact === 'gas') return t(`utility.${v}`)
  if (MONEY.has(fact)) return t.money(Number(v))
  return String(v)
}
const fmtYours = (fact: string, v: unknown, t: T) =>
  fact === 'incomePctFPL' ? `${v}%` : fact === 'daysSinceDisaster' ? t('ui.daysCount', { n: String(v) }) : fmt(fact, v, t)

export function leafLabel(l: LeafResult, t: T, facts: Facts): string {
  const { fact } = l.leaf
  const exp = l.expected
  const key = typeof exp === 'boolean' ? `cond.${fact}.${exp}` : `cond.${fact}.${l.op === 'in' ? 'eq' : l.op}`
  let money = ''
  if (fact === 'incomePctFPL' && typeof exp === 'number') {
    const size = facts.householdSize
    const fpl = lookup(tables, 'fpl-annual', typeof size === 'number' ? size : undefined, String(facts.asOf))
    money = fpl ? t.money(Math.round((fpl * exp) / 100 / 12)) : '—'
  }
  return t(key, { v: fmt(fact, exp, t), money })
}

function Mark({ r }: { r: CondResult['result'] }) {
  const t = useT()
  if (r === 'pass') return <Check className="mark mark-pass" size={18} aria-label={t('ui.likelyShort')} />
  if (r === 'fail') return <X className="mark mark-fail" size={18} aria-label={t('ui.notShort')} />
  return <CircleHelp className="mark mark-unknown" size={18} aria-label={t('ui.possiblyShort')} />
}

function CondList({ c, facts }: { c: CondResult; facts: Facts }) {
  const t = useT()
  if (c.kind === 'leaf') {
    const showYours = c.actual !== undefined && typeof c.actual !== 'boolean' && c.leaf.fact !== 'asOf'
    return (
      <li className={`cond cond-${c.result}`}>
        <Mark r={c.result} />
        <span>
          {leafLabel(c, t, facts)}
          {showYours && <span className="muted"> · {t('ui.yours', { value: fmtYours(c.leaf.fact, c.actual, t) })}</span>}
          {c.reason && <span className="muted"> · {t(`ui.${c.reason}`)}</span>}
        </span>
      </li>
    )
  }
  if (c.kind === 'all') return <>{c.children.map((x, i) => <CondList key={i} c={x} facts={facts} />)}</>
  if (c.kind === 'any' && c.result === 'pass') {
    return <CondList c={c.children.find((x) => x.result === 'pass')!} facts={facts} />
  }
  return (
    <li className={`cond cond-${c.result}`}>
      <Mark r={c.result} />
      <span>
        {c.kind === 'not' ? t('cond.not', { x: '' }) : t('cond.anyOf')}
        <ul className="conds nested">{c.children.map((x, i) => <CondList key={i} c={x} facts={facts} />)}</ul>
      </span>
    </li>
  )
}

// How far over a limit, in dollars a month. Poverty-level limits are percentages, so convert those.
function overMonthly(l: LeafResult, facts: Facts): number {
  if (l.leaf.fact !== 'incomePctFPL') return l.over!
  const size = facts.householdSize
  const fpl = lookup(tables, 'fpl-annual', typeof size === 'number' ? size : undefined, String(facts.asOf)) ?? 0
  return Math.round((l.over! / 100) * fpl / 12)
}

// One-line description of the thing that would need to change.
function blockerText(c: CondResult, t: T, facts: Facts) {
  const ls = leaves(c).filter((l) => l.result !== 'pass')
  return ls
    .map((l) => l.leaf.fact === 'status' && l.reason === 'missing' ? t('ui.statusSkipped')
      : leafLabel(l, t, facts) + (l.reason ? ` (${t(`ui.${l.reason}`)})` : ''))
    .join(` ${t('cond.or')} `)
}

export default function ProgramCard({ r, facts, names }: { r: ProgramResult; facts: Facts; names?: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const { program: p, best, outcome } = r
  const miss = outcome === 'not' ? nearMiss(best.tree) : undefined
  const variant = best.rule.variant && t.has(`variants.${best.rule.variant}`) ? t(`variants.${best.rule.variant}`) : null
  // Dollar maximums are per household: shown on household cards, and once in the overview for per-person programs.
  const unit = p.estimate && 'table' in p.estimate ? tables[p.estimate.table]?.unit : undefined
  const est = r.estimate !== undefined && p.appliesTo === 'household' ? t(unit === 'year' ? 'ui.upToYear' : 'ui.upTo', { amount: t.money(r.estimate) })
    : p.estimate && 'text' in p.estimate && outcome !== 'not' ? t(`values.${p.estimate.text}`) : null
  const detailsId = useId()
  const single = outcome === 'not' && best.blockers.length === 1 ? best.blockers[0] : undefined

  return (
    <article className={`program program-${outcome}`}>
      <div className="program-head">
        <span className={`mark-box mark-box-${outcome}`} aria-hidden="true">
          {outcome === 'likely' && <Check size={18} strokeWidth={3} />}
          {outcome === 'possibly' && <span className="mark-q">?</span>}
        </span>
        <div className="program-title">
          <h4 lang="en">{p.name}</h4>
          {variant && outcome !== 'not' && <p className="variant">{variant}</p>}
          <p className="desc">{t(`programs.${p.id}`)}</p>
          {est && <p className="estimate">{est}</p>}
          {names && <p className="for muted small">{t('ui.planFor', { names })}</p>}
        </div>
      </div>

      {r.upgrades.map((u) => (
        <p key={u.rule.id} className="hint">
          <strong>{t('ui.couldGet', { variant: u.rule.variant ? t(`variants.${u.rule.variant}`) : p.name })}</strong>{' '}
          {blockerText(u.blockers[0], t, facts)}
        </p>
      ))}
      {outcome === 'possibly' && best.blockers.length > 0 && (
        <p className="hint hint-possibly">
          <strong>{t('ui.dependsOn')}:</strong> {best.blockers.map((b) => blockerText(b, t, facts)).join('; ')}
        </p>
      )}
      {miss && <p className="hint hint-near">{t('ui.nearMiss', { amount: t.money(overMonthly(miss, facts)) })}</p>}
      {single && !miss && isChangeable(single) && (
        <p className="hint"><strong>{t('ui.wouldChange')}</strong> {blockerText(single, t, facts)}</p>
      )}

      {best.notes.length > 0 && (
        <ul className="notes">{best.notes.map((n) => <li key={n}>{t(`notes.${n}`)}</li>)}</ul>
      )}

      {outcome === 'not' && p.alternatives && (
        <div className="alts">
          <p className="alts-title">{t('ui.alternatives')}</p>
          <ul>
            {p.alternatives.map((a) => (
              <li key={a}>
                {ALT_LINKS[a] ? <a href={ALT_LINKS[a]} target="_blank" rel="noopener noreferrer">{t(`alt.${a}`)}</a> : t(`alt.${a}`)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="program-actions">
        <button className="link-btn" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(!open)}>
          {open ? t('ui.hideWhy') : t('ui.why')} <ChevronDown size={16} className={open ? 'flip' : ''} aria-hidden="true" />
        </button>
        {outcome !== 'not' && (
          <a className="btn btn-small btn-primary" href={p.apply.url} target="_blank" rel="noopener noreferrer">
            {t('ui.apply')} <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
        {outcome !== 'not' && p.apply.phone && (
          <a className="btn btn-small btn-soft" href={`tel:${p.apply.phone.replace(/[^\d+]/g, '')}`}>
            <Phone size={14} aria-hidden="true" /> {p.apply.phone}
          </a>
        )}
      </div>

      {open && (
        <div className="details" id={detailsId}>
          <p>{t(`rules.${best.rule.explain}`)}</p>
          <p className="details-label">{t('ui.rulesChecked')}</p>
          <ul className="conds"><CondList c={best.tree} facts={facts} /></ul>
          <p className="source">
            <a href={best.rule.source} target="_blank" rel="noopener noreferrer" title={best.rule.id}>
              {t('ui.source')} <ExternalLink size={13} aria-hidden="true" />
            </a>
            <span>
              {t('ui.since', { date: t.date(best.rule.effective.from) })}
              {best.rule.effective.to && <> {t('ui.until', { date: t.date(best.rule.effective.to) })}</>}
            </span>
            <span>{t('ui.lastVerified', { date: t.date(best.rule.lastVerified) })}</span>
          </p>
        </div>
      )}
    </article>
  )
}
