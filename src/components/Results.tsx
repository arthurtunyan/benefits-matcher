import type { ReactNode } from 'react'
import { ArrowLeft, CalendarClock, ChevronDown, Info, Printer, ShieldCheck } from 'lucide-react'
import { useT } from '../i18n'
import { deadlineDays, leaves, type Change, type Outcome, type Person, type ProgramResult, type Screening, type Status } from '../engine'
import { MAX_DATE, MIN_DATE, personLabel, todayISO } from '../App'
import { Face, StatusSelect } from './HouseholdForm'
import ProgramCard from './ProgramCard'
import Help from './Help'
import Timeline from './Timeline'
import { help, tables } from '../data'

const GROUPS: Outcome[] = ['likely', 'possibly', 'not']

function Group({ outcome, items, facts }: { outcome: Outcome; items: ProgramResult[]; facts: Screening['facts'] }) {
  const t = useT()
  if (items.length === 0) return null
  const list = items.map((r) => <ProgramCard key={r.program.id} r={r} facts={facts} />)
  if (outcome === 'not') {
    return (
      <details className="group group-not">
        <summary>
          <span className={`dot dot-${outcome}`} aria-hidden="true" />
          {t('ui.not')} <span className="count">{items.length}</span>
        </summary>
        <p className="help">{t('ui.notHelp')}</p>
        <div className="program-list">{list}</div>
      </details>
    )
  }
  return (
    <section className={`group group-${outcome}`}>
      <h3 className="group-title">
        <span className={`dot dot-${outcome}`} aria-hidden="true" />
        {t(`ui.${outcome}`)} <span className="count">{items.length}</span>
      </h3>
      <p className="help">{t(`ui.${outcome}Help`)}</p>
      <div className="program-list">{list}</div>
    </section>
  )
}

function Groups({ results, facts }: { results: ProgramResult[]; facts: Screening['facts'] }) {
  return <>{GROUPS.map((o) => <Group key={o} outcome={o} items={results.filter((r) => r.outcome === o)} facts={facts} />)}</>
}

const count = (rs: ProgramResult[], o: Outcome) => rs.filter((r) => r.outcome === o).length

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

// Disaster deadlines, nearest first. A program is listed while it's open, or when the deadline is the only thing that closed it.
export function Deadlines({ results, facts }: { results: ProgramResult[]; facts: Screening['facts'] }) {
  const t = useT()
  const since = typeof facts.daysSinceDisaster === 'number' ? facts.daysSinceDisaster : undefined
  const items = results.flatMap((r) => {
    const n = deadlineDays(r.best.rule.conditions)[0]
    const onlyDeadline = r.best.blockers.length === 1 && leaves(r.best.blockers[0]).every((l) => l.leaf.fact === 'daysSinceDisaster')
    return n !== undefined && (r.outcome !== 'not' || onlyDeadline) ? [{ r, n }] : []
  }).sort((a, b) => a.n - b.n)
  if (items.length === 0) return null
  return (
    <>
      <h3 className="deadlines-title">{t('ui.deadlinesTitle')}</h3>
      <ol className="deadlines">
        {items.map(({ r, n }) => {
          const left = since === undefined ? undefined : n - since
          return (
            <li key={r.program.id} className={left !== undefined && left < 0 ? 'deadline-passed' : ''}>
              <strong lang="en">{r.program.name}</strong>{' '}
              {since === undefined ? t('ui.deadlineWithin', { n: String(n) }) : t('ui.deadlineBy', { date: t.date(addDays(String(facts.asOf), left!)) })}
              {left !== undefined && (
                <span className="deadline-left">{left < 0 ? t('ui.deadlinePassed') : left === 0 ? t('ui.lastDay') : t('ui.daysLeft', { n: String(left) })}</span>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}

// A titled card for a group of household programs (tax credits, disaster help).
function Extra({ id, title, intro, results, facts, children }: {
  id: string; title: string; intro: string; results: ProgramResult[]; facts: Screening['facts']; children?: ReactNode
}) {
  const t = useT()
  if (results.length === 0) return null
  return (
    <section className={`person-results card extra-${id}`} aria-labelledby={`pr-${id}`}>
      <header className="person-results-head">
        <div className="person-results-name">
          <h2 id={`pr-${id}`}>{title}</h2>
          <p className="summary">{t('ui.summary', { likely: count(results, 'likely'), possibly: count(results, 'possibly') })}</p>
        </div>
      </header>
      <p className="help">{intro}</p>
      {children}
      <Groups results={results} facts={facts} />
    </section>
  )
}

// The whole family in one place: each program counted once at the best outcome anyone has,
// dollar maximums once per household (CalFresh and CFAP share one allotment), and whether skipped answers matter.
function overview(s: Screening) {
  const all = [...s.people.flatMap((x) => x.results), ...s.household].filter((r) => r.outcome !== 'not')
  const best = new Map<string, Outcome>()
  all.forEach((r) => best.get(r.program.id) !== 'likely' && best.set(r.program.id, r.outcome))
  const money = new Map<string, { names: string[]; amount: number; yearly: boolean }>()
  all.forEach((r) => {
    if (r.estimate === undefined || !r.program.estimate || !('table' in r.program.estimate)) return
    const table = r.program.estimate.table
    const m = money.get(table) ?? { names: [], amount: r.estimate, yearly: tables[table]?.unit === 'year' }
    if (!m.names.includes(r.program.name)) m.names.push(r.program.name)
    money.set(r.program.estimate.table, m)
  })
  return {
    likely: [...best.values()].filter((o) => o === 'likely').length,
    possibly: [...best.values()].filter((o) => o === 'possibly').length,
    money: [...money.values()].filter((m) => !m.yearly),
    taxMoney: [...money.values()].filter((m) => m.yearly),
    skipped: all.some((r) => r.outcome === 'possibly' && leaves(r.best.tree).some((l) => l.reason === 'missing')),
  }
}

export default function Results({ screening: s, changes, asOf, setAsOf, updatePerson, onBack, onPlan }: {
  screening: Screening; changes: Change[]; asOf: string; setAsOf: (d: string) => void
  updatePerson: (p: Person) => void; onBack: () => void; onPlan: () => void
}) {
  const t = useT()
  const today = todayISO()
  const presets = [
    { label: t('ui.today'), date: today },
    { label: t('ui.dec2025'), date: '2025-12-15' },
    { label: t('ui.jul2027'), date: '2027-07-15' },
  ]
  const people = s.people
  const anyKid = people.some(({ person: p }) => p.age !== undefined && p.age >= 4 && p.age <= 18)
  const anyNonCitizen = people.some(({ person: p }) => p.status !== 'citizen')
  const anySeniorOrDisabled = people.some(({ person: p }) => p.disabled || (p.age ?? 0) >= 65)
  const unknownUtility = s.facts.electric === 'unknown' || s.facts.gas === 'unknown'
  const publicCharge = help.find((h) => h.id === 'public-charge')!
  const o = overview(s)
  const home = s.household.filter((r) => r.program.category !== 'tax' && r.program.category !== 'disaster')
  const tax = s.household.filter((r) => r.program.category === 'tax')
  const disasterHelp = s.household.filter((r) => r.program.category === 'disaster')

  const jump = (id: string) => {
    const el = document.getElementById(`person-${id}`) as HTMLDetailsElement | null
    if (!el) return
    el.open = true
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="results">
      <div className="results-top">
        <h1 tabIndex={-1} className="view-heading">{t('ui.stepResults')}</h1>
        <p className="privacy-chip"><ShieldCheck size={16} aria-hidden="true" /> {t('ui.privacyChip')}</p>
        {asOf !== today && <p className="note-warn" role="status">{t('ui.notToday', { date: t.date(asOf) })}</p>}
      </div>

      {people.length === 0 && <p>{t('ui.noPeople')}</p>}

      {people.length > 0 && (
        <section className="card overview" aria-labelledby="overview-title">
          <h2 id="overview-title" className="card-title">{t('ui.overview')}</h2>
          <p className="sr-only">{t('ui.overviewCount', { likely: o.likely, possibly: o.possibly })}</p>
          <div className="stats" aria-hidden="true">
            <p className="stat"><b>{o.likely}</b>{t('ui.likely')}</p>
            {o.possibly > 0 && <p className="stat stat-possibly"><b>{o.possibly}</b>{t('ui.possibly')}</p>}
          </div>
          <ul className="who">
            {people.map(({ person: p, results }, i) => (
              <li key={p.id}>
                <a href={`#person-${p.id}`} onClick={(e) => { e.preventDefault(); jump(p.id) }}>
                  <Face p={p} index={i} />
                  <span className="who-name">{personLabel(p, i, t)}</span>
                  <span className="who-sum">{t('ui.summary', { likely: count(results, 'likely'), possibly: count(results, 'possibly') })}</span>
                </a>
              </li>
            ))}
          </ul>
          {o.money.length > 0 && (
            <>
              <ul className="overview-money">
                {o.money.map((m) => <li key={m.names.join()}><strong lang="en">{m.names.join(' / ')}</strong>: {t('ui.upTo', { amount: t.money(m.amount) })}</li>)}
              </ul>
              <p className="help">{t('ui.sharedMoneyHelp', { n: people.length })}</p>
            </>
          )}
          {o.taxMoney.length > 0 && (
            <>
              <ul className="overview-money">
                {o.taxMoney.map((m) => <li key={m.names.join()}><strong lang="en">{m.names.join(' / ')}</strong>: {t('ui.upToYear', { amount: t.money(m.amount) })}</li>)}
              </ul>
              <p className="help">{t('ui.taxMoneyHelp')}</p>
            </>
          )}
          {o.skipped && (
            <>
              <p className="hint hint-possibly">{t('ui.skippedNote')}</p>
              <div className="row"><button className="btn btn-soft" onClick={onBack}>{t('ui.answerSkipped')}</button></div>
            </>
          )}
        </section>
      )}

      <p className="disclaimer">{t('ui.disclaimer')}</p>

      {/* Disaster help goes first: its deadlines are days away. */}
      <Extra id="disaster" title={t('ui.disasterTitle')} intro={t('ui.disasterIntro')} results={disasterHelp} facts={s.facts}>
        <Deadlines results={disasterHelp} facts={s.facts} />
        <h3 className="deadlines-title">{t('ui.nowSteps')}</h3>
        <ul className="now-steps">
          {['stepPhotos', 'stepInsurance', 'stepAddress', 'stepEbt'].map((k) => <li key={k}>{t(`ui.${k}`)}</li>)}
        </ul>
      </Extra>

      {people.map(({ person: p, results }, i) => {
        const name = personLabel(p, i, t)
        // Big families: everyone after the first starts folded; the list in the overview opens them.
        return (
          <details key={p.id} id={`person-${p.id}`} className="person-results person-fold card" open={people.length <= 3 || i === 0}>
            <summary className="person-results-head">
              <Face p={p} index={i} />
              <div className="person-results-name">
                <h2 id={`pr-${p.id}`}>{name}{p.age !== undefined && <span className="age"> · {p.age}</span>}</h2>
                <p className="summary">{t('ui.summary', { likely: count(results, 'likely'), possibly: count(results, 'possibly') })}</p>
              </div>
              <ChevronDown className="fold-icon" size={22} aria-hidden="true" />
            </summary>
            <div className="quick-status">
              <label htmlFor={`qs-${p.id}`}>{t('ui.status')}</label>
              <StatusSelect id={`qs-${p.id}`} value={p.status} onChange={(status?: Status) => updatePerson({ ...p, status })} />
            </div>
            {results.length === 0 ? <p className="muted">{t('ui.noResults')}</p> : <Groups results={results} facts={{ ...s.facts, age: p.age }} />}
          </details>
        )
      })}

      {home.length > 0 && (
        <section className="person-results card" aria-labelledby="pr-household">
          <header className="person-results-head">
            <div className="person-results-name">
              <h2 id="pr-household">{t('ui.householdGroup')}</h2>
              <p className="summary">{t('ui.summary', { likely: count(home, 'likely'), possibly: count(home, 'possibly') })}</p>
            </div>
          </header>
          {unknownUtility && <p className="note-info"><Info size={16} aria-hidden="true" /> {t('ui.utilityUnknown')}</p>}
          <Groups results={home} facts={s.facts} />
        </section>
      )}

      <Extra id="tax" title={t('ui.taxTitle')} intro={t('ui.taxIntro')} results={tax} facts={s.facts} />

      <section className="asof card" aria-labelledby="asof-label">
        <div className="asof-row">
          <CalendarClock size={22} aria-hidden="true" className="asof-icon" />
          <label id="asof-label" htmlFor="asof">{t('ui.asOf')}</label>
          <input id="asof" type="date" min={MIN_DATE} max={MAX_DATE} value={asOf}
            onChange={(e) => { const d = e.target.value; if (d >= MIN_DATE && d <= MAX_DATE) setAsOf(d) }} />
        </div>
        <div className="asof-presets" role="group" aria-label={t('ui.asOf')}>
          {presets.map((p) => (
            <button key={p.label} className="chip-btn" aria-pressed={asOf === p.date} onClick={() => setAsOf(p.date)}>{p.label}</button>
          ))}
        </div>
        <p className="help">{t('ui.asOfHelp')} {t('ui.dateRange', { from: t.date(MIN_DATE), to: t.date(MAX_DATE) })}</p>
      </section>

      {people.length > 0 && <Timeline changes={changes} people={people} asOf={asOf} setAsOf={setAsOf} />}

      <section className="card good-to-know">
        <h2 className="card-title">{t('ui.goodToKnow')}</h2>
        <ul>
          {anyKid && <li>{t('ui.schoolMeals')}</li>}
          {anyNonCitizen && (
            <li>
              {t('ui.publicCharge')}{' '}
              <a href={publicCharge.url} target="_blank" rel="noopener noreferrer">{t('ui.publicChargeLink')}</a>
            </li>
          )}
          {anySeniorOrDisabled && <li>{t('ui.ssiInfo')}</li>}
          <li>{t('ui.clinicsInfo')}</li>
        </ul>
      </section>

      <Help />

      <div className="action-bar">
        <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /> {t('ui.edit')}</button>
        <button className="btn btn-primary btn-lg" onClick={onPlan}><Printer size={20} aria-hidden="true" /> {t('ui.makePlan')}</button>
      </div>
    </div>
  )
}
