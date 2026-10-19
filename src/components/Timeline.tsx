import { Fragment } from 'react'
import { ExternalLink, History } from 'lucide-react'
import { useT } from '../i18n'
import type { Change, ProgramResult, Screening } from '../engine'
import { MAX_DATE, MIN_DATE, personLabel, todayISO } from '../App'

// One result as a badge: "Likely · Restricted Medi-Cal (…)". No result counts as not eligible.
function Snap({ r }: { r?: ProgramResult }) {
  const t = useT()
  const o = r?.outcome ?? 'not'
  const v = r?.best.rule.variant
  return <span className={`badge badge-${o}`}>{t(`ui.${o}Short`)}{o !== 'not' && v && t.has(`variants.${v}`) ? ` · ${t(`variants.${v}`)}` : ''}</span>
}

// The "policy time machine": every day a rule change reaches someone in this family, with the rule behind it.
export default function Timeline({ changes, people, asOf, setAsOf }: {
  changes: Change[]; people: Screening['people']; asOf: string; setAsOf: (d: string) => void
}) {
  const t = useT()
  const today = todayISO()
  const [lo, hi] = [today, asOf].sort()
  const between = (d: string) => asOf !== today && d > lo && d <= hi
  const dates = [...new Set(changes.map((c) => c.date))]
  const nowAt = dates.findIndex((d) => d > today) // "today" goes before the first planned change
  const name = (id?: string) => {
    const i = people.findIndex((x) => x.person.id === id)
    return i < 0 ? t('ui.householdGroup') : personLabel(people[i].person, i, t)
  }
  const now = <li className="tm-now">{t('ui.today')} · {t.date(today)}</li>
  const see = (d: string) => { setAsOf(d); document.getElementById('asof')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

  return (
    <section className="card timeline" aria-labelledby="tm-title">
      <h2 id="tm-title" className="card-title"><History size={20} aria-hidden="true" /> {t('ui.tmTitle')}</h2>
      <p className="help">{t('ui.tmIntro', { from: t.date(MIN_DATE), to: t.date(MAX_DATE) })}</p>
      {asOf !== today && (
        <p className="note-info" role="status">{t('ui.tmBetween', { date: t.date(asOf), n: changes.filter((c) => between(c.date)).length })}</p>
      )}
      {dates.length === 0 ? <p>{t('ui.tmNone')}</p> : (
        <ol className="tm">
          {dates.map((d, i) => (
            <Fragment key={d}>
              {i === nowAt && now}
              <li className={`tm-day${d > today ? ' tm-future' : ''}${between(d) ? ' tm-between' : ''}`}>
                <p className="tm-date">
                  <time dateTime={d}>{t.date(d)}</time>
                  {d > today && <span className="tm-planned">{t('ui.tmPlanned')}</span>}
                </p>
                <ul className="tm-changes">
                  {changes.filter((c) => c.date === d).map((c) => {
                    const same = c.before?.outcome === c.after?.outcome && c.before?.best.rule.variant === c.after?.best.rule.variant
                    // Gaining or changing: explain the new rule. Losing: explain the rule that applied before.
                    const rule = (c.after && c.after.outcome !== 'not' ? c.after : c.before ?? c.after)!.best.rule
                    return (
                      <li key={`${c.personId}-${c.program.id}`}>
                        <p><strong>{name(c.personId)}</strong> · <span lang="en">{c.program.name}</span></p>
                        <p className="tm-move">
                          {same ? <><Snap r={c.after} /> <span className="muted small">{t('ui.tmNewRule')}</span></>
                            : <><Snap r={c.before} /> <span aria-label={t('ui.tmTo')}>→</span> <Snap r={c.after} /></>}
                        </p>
                        <details className="tm-why">
                          <summary>{t('ui.why')}</summary>
                          <p>{t(`rules.${rule.explain}`)}</p>
                          <p className="source">
                            <a href={rule.source} target="_blank" rel="noopener noreferrer">
                              {t('ui.source')} <ExternalLink size={13} aria-hidden="true" />
                            </a>
                            <span>
                              {t('ui.since', { date: t.date(rule.effective.from) })}
                              {rule.effective.to && <> {t('ui.until', { date: t.date(rule.effective.to) })}</>}
                            </span>
                          </p>
                        </details>
                      </li>
                    )
                  })}
                </ul>
                <button className="chip-btn" aria-pressed={asOf === d} onClick={() => see(d)}>{t('ui.tmSee')}</button>
              </li>
            </Fragment>
          ))}
          {nowAt === -1 && now}
        </ol>
      )}
    </section>
  )
}
