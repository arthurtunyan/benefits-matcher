import { ArrowLeft, Baby, CalendarClock, Home, Info, Printer, ShieldCheck, UserRound } from 'lucide-react'
import { useT } from '../i18n'
import type { Outcome, Person, ProgramResult, Screening, Status } from '../engine'
import { MAX_DATE, MIN_DATE, personLabel, todayISO } from '../App'
import { StatusSelect } from './HouseholdForm'
import ProgramCard from './ProgramCard'
import Help from './Help'
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

export default function Results({ screening: s, asOf, setAsOf, updatePerson, onBack, onPlan }: {
  screening: Screening; asOf: string; setAsOf: (d: string) => void
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

  return (
    <div className="results">
      <div className="results-top">
        <h1 tabIndex={-1} className="view-heading">{t('ui.stepResults')}</h1>
        <p className="privacy-chip"><ShieldCheck size={16} aria-hidden="true" /> {t('ui.privacyChip')}</p>
      </div>

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

      <p className="disclaimer">{t('ui.disclaimer')}</p>

      {people.length === 0 && <p>{t('ui.noPeople')}</p>}

      {people.map(({ person: p, results }, i) => {
        const child = p.age !== undefined && p.age < 18
        const name = personLabel(p, i, t)
        return (
          <section key={p.id} className="person-results card" aria-labelledby={`pr-${p.id}`}>
            <header className="person-results-head">
              <span className={`avatar ${child ? 'avatar-child' : ''}`} aria-hidden="true">
                {child ? <Baby size={22} /> : <UserRound size={22} />}
              </span>
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
            <span className="avatar avatar-home" aria-hidden="true"><Home size={22} /></span>
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
        <h2 className="card-title"><Info size={20} aria-hidden="true" /> {t('ui.goodToKnow')}</h2>
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
