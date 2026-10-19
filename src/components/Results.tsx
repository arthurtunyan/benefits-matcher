import { ArrowLeft, CalendarClock, Info, Printer, ShieldCheck } from 'lucide-react'
import { useT } from '../i18n'
import { leaves, type Change, type Outcome, type Person, type ProgramResult, type Screening, type Status } from '../engine'
import { MAX_DATE, MIN_DATE, personLabel, todayISO } from '../App'
import { Face, StatusSelect, initial } from './HouseholdForm'
import House from './House'
import ProgramCard from './ProgramCard'
import Help from './Help'
import Timeline from './Timeline'
import { help } from '../data'

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
      <h4 className="group-title">
        <span className={`dot dot-${outcome}`} aria-hidden="true" />
        {t(`ui.${outcome}`)} <span className="count">{items.length}</span>
      </h4>
      <p className="help">{t(`ui.${outcome}Help`)}</p>
      <div className="program-list">{list}</div>
    </section>
  )
}

function Groups({ results, facts }: { results: ProgramResult[]; facts: Screening['facts'] }) {
  return <>{GROUPS.map((o) => <Group key={o} outcome={o} items={results.filter((r) => r.outcome === o)} facts={facts} />)}</>
}

const count = (rs: ProgramResult[], o: Outcome) => rs.filter((r) => r.outcome === o).length

// The whole family in one place: each program counted once at the best outcome anyone has,
// dollar maximums once per household (CalFresh and CFAP share one allotment), and whether skipped answers matter.
function overview(s: Screening) {
  const all = [...s.people.flatMap((x) => x.results), ...s.household].filter((r) => r.outcome !== 'not')
  const best = new Map<string, Outcome>()
  all.forEach((r) => best.get(r.program.id) !== 'likely' && best.set(r.program.id, r.outcome))
  const money = new Map<string, { names: string[]; amount: number }>()
  all.forEach((r) => {
    if (r.estimate === undefined || !r.program.estimate || !('table' in r.program.estimate)) return
    const m = money.get(r.program.estimate.table) ?? { names: [], amount: r.estimate }
    if (!m.names.includes(r.program.name)) m.names.push(r.program.name)
    money.set(r.program.estimate.table, m)
  })
  return {
    likely: [...best.values()].filter((o) => o === 'likely').length,
    possibly: [...best.values()].filter((o) => o === 'possibly').length,
    money: [...money.values()],
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

  return (
    <div className="results">
      <div className="results-top">
        <h1 tabIndex={-1} className="view-heading">{t('ui.stepResults')}</h1>
        <p className="privacy-chip"><ShieldCheck size={16} aria-hidden="true" /> {t('ui.privacyChip')}</p>
      </div>

      {people.length > 0 && (
        <div className="results-house">
          <House windows={people.map(({ person: p, results }, i) => {
            const name = personLabel(p, i, t)
            const summary = t('ui.summary', { likely: count(results, 'likely'), possibly: count(results, 'possibly') })
            return {
              id: p.id, letter: initial(p, i, t), caption: name, badge: String(count(results, 'likely')), done: true,
              label: `${name}: ${summary}`,
              onClick: () => document.getElementById(`pr-${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
            }
          })} />
        </div>
      )}

      {people.length > 0 && (
        <section className="card overview" aria-labelledby="overview-title">
          <h2 id="overview-title" className="card-title">{t('ui.overview')}</h2>
          <p className="overview-count">{t('ui.overviewCount', { likely: o.likely, possibly: o.possibly })}</p>
          {o.money.length > 0 && (
            <>
              <ul className="overview-money">
                {o.money.map((m) => <li key={m.names.join()}><strong lang="en">{m.names.join(' / ')}</strong>: {t('ui.upTo', { amount: t.money(m.amount) })}</li>)}
              </ul>
              <p className="help">{t('ui.sharedMoneyHelp', { n: people.length })}</p>
            </>
          )}
          {o.skipped && <p className="hint hint-possibly">{t('ui.skippedNote')}</p>}
          <div className="row">
            <button className="btn btn-primary" onClick={onPlan}><Printer size={18} aria-hidden="true" /> {t('ui.makePlan')}</button>
            {o.skipped && <button className="btn btn-soft" onClick={onBack}>{t('ui.answerSkipped')}</button>}
          </div>
        </section>
      )}

      <section className="asof card" aria-labelledby="asof-label">
        <div className="asof-row">
          <CalendarClock size={22} aria-hidden="true" className="asof-icon" />
          <label id="asof-label" htmlFor="asof">{t('ui.asOf')}</label>
          <input id="asof" type="date" min={MIN_DATE} max={MAX_DATE} value={asOf}
            onChange={(e) => e.target.value && setAsOf(e.target.value)} />
        </div>
        <div className="asof-presets" role="group" aria-label={t('ui.asOf')}>
          {presets.map((p) => (
            <button key={p.label} className="chip-btn" aria-pressed={asOf === p.date} onClick={() => setAsOf(p.date)}>{p.label}</button>
          ))}
        </div>
        <p className="help">{t('ui.asOfHelp')} {t('ui.dateRange', { from: t.date(MIN_DATE), to: t.date(MAX_DATE) })}</p>
        {asOf !== today && <p className="note-warn" role="status">{t('ui.notToday', { date: t.date(asOf) })}</p>}
      </section>

      {people.length > 0 && <Timeline changes={changes} people={people} asOf={asOf} setAsOf={setAsOf} />}

      <p className="disclaimer">{t('ui.disclaimer')}</p>

      {people.length === 0 && <p>{t('ui.noPeople')}</p>}

      {people.map(({ person: p, results }, i) => {
        const name = personLabel(p, i, t)
        return (
          <section key={p.id} className="person-results card" aria-labelledby={`pr-${p.id}`}>
            <header className="person-results-head">
              <Face p={p} index={i} />
              <div className="person-results-name">
                <h2 id={`pr-${p.id}`}>{name}{p.age !== undefined && <span className="age"> · {p.age}</span>}</h2>
                <p className="summary" aria-live="polite">
                  {t('ui.summary', { likely: count(results, 'likely'), possibly: count(results, 'possibly') })}
                </p>
              </div>
              <div className="quick-status">
                <label htmlFor={`qs-${p.id}`} className="sr-only">{t('ui.status')}</label>
                <StatusSelect id={`qs-${p.id}`} value={p.status} onChange={(status?: Status) => updatePerson({ ...p, status })} />
              </div>
            </header>
            {results.length === 0 ? <p className="muted">{t('ui.noResults')}</p> : <Groups results={results} facts={{ ...s.facts, age: p.age }} />}
          </section>
        )
      })}

      {s.household.length > 0 && (
        <section className="person-results card" aria-labelledby="pr-household">
          <header className="person-results-head">
            <div className="person-results-name">
              <h2 id="pr-household">{t('ui.householdGroup')}</h2>
              <p className="summary">{t('ui.summary', { likely: count(s.household, 'likely'), possibly: count(s.household, 'possibly') })}</p>
            </div>
          </header>
          {unknownUtility && <p className="note-info"><Info size={16} aria-hidden="true" /> {t('ui.utilityUnknown')}</p>}
          <Groups results={s.household} facts={s.facts} />
        </section>
      )}

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
