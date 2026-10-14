import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react'
import { useT, type T } from '../i18n'
import { inLACounty, type Household, type Person, type Status, type Utility } from '../engine'
import { zips } from '../data'
import { newPerson, personLabel } from '../App'

export const STATUSES: Status[] = ['citizen', 'lpr5', 'lpr', 'humanitarian', 'otherLawful', 'undocumented']
const ELECTRIC: Utility[] = ['ladwp', 'sce', 'bwp', 'gwp', 'pwp', 'other', 'unknown']
const GAS: Utility[] = ['socalgas', 'other', 'unknown']
const BENEFITS = ['calfresh', 'calworks', 'ssi', 'wic'] as const
const FLAGS = ['pregnant', 'recentBirth', 'disabled', 'hasMediCal'] as const

const num = (s: string) => (s.trim() === '' || isNaN(Number(s)) ? undefined : Number(s))

export function StatusSelect({ value, onChange, id }: { value?: Status; onChange: (s?: Status) => void; id: string }) {
  const t = useT()
  return (
    <select id={id} value={value ?? ''} onChange={(e) => onChange((e.target.value || undefined) as Status | undefined)}>
      <option value="">{t('status.preferNot')}</option>
      {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
    </select>
  )
}

// A person shown as a round face with their first initial.
export function Face({ p, index, size = 'md' }: { p: Person; index: number; size?: 'sm' | 'md' }) {
  const t = useT()
  const letter = personLabel(p, index, t).trim().charAt(0).toUpperCase() || String(index + 1)
  return <span className={`face face-${size}`} aria-hidden="true">{letter}</span>
}

// A big answer button. Single-choice tiles are radios; multi-choice tiles are checkboxes.
function Tile({ selected, onClick, children, role = 'radio' }: {
  selected: boolean; onClick: () => void; children: ReactNode; role?: 'radio' | 'checkbox'
}) {
  return (
    <button type="button" role={role} aria-checked={selected} className="tile" onClick={onClick}>
      <span>{children}</span>
      <span className="tile-check" aria-hidden="true">{selected && <Check size={18} strokeWidth={3} />}</span>
    </button>
  )
}

// Marks "we don't have gas at home" (counts as 'other' for the rules).
const NO_GAS = '__none__'
// Short name for the sentence: "LADWP (Los Angeles Dept. of Water and Power)" reads as "LADWP".
const utilityName = (u: Utility, other: string | undefined, t: T) =>
  u === 'other' && other?.trim() ? other.trim() : t(`utility.${u}`).replace(/\s*\(.*\)$/, '')

// "Not sure" helper for the electric bill: guess from the ZIP, or ask which city.
// Opens below the answer tiles, so bring it into view on small screens.
function useScrollIntoView() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [])
  return ref
}

function ElectricHelper({ zip, pick }: { zip?: string; pick: (u: Utility) => void }) {
  const t = useT()
  const ref = useScrollIntoView()
  const [guess, setGuess] = useState<Utility | null>(null)
  const info = zip ? zips[zip] : undefined
  const fromZip = info?.electric as Utility | undefined
  const cities: [string, Utility | null][] = [
    ['cityLA', 'ladwp'], ['cityBurbank', 'bwp'], ['cityGlendale', 'gwp'], ['cityPasadena', 'pwp'],
    ['cityOther', 'sce'], ['cityDontKnow', null],
  ]
  return (
    <div className="helper" role="group" aria-labelledby="helper-title" ref={ref}>
      <p id="helper-title" className="helper-title">{t('ui.helpTitle')}</p>
      <p className="help">{t('ui.helpBill')}</p>
      {fromZip && info ? (
        <div className="guess">
          <p>{t('ui.guessFromZip', { city: info.city, name: t(`utility.${fromZip}`) })}</p>
          <button type="button" className="btn btn-primary btn-small" onClick={() => pick(fromZip)}>{t('ui.useThis')}</button>
        </div>
      ) : (
        <>
          <p className="helper-q">{t('ui.cityQ')}</p>
          <div className="tiles tiles-compact" role="radiogroup" aria-label={t('ui.cityQ')}>
            {cities.map(([key, u]) => (
              <Tile key={key} selected={guess === u && u !== null} onClick={() => (u ? setGuess(u) : pick('unknown'))}>{t(`ui.${key}`)}</Tile>
            ))}
          </div>
          {guess && (
            <div className="guess" role="status">
              <p>{t('ui.guess', { name: t(`utility.${guess}`) })}</p>
              <button type="button" className="btn btn-primary btn-small" onClick={() => pick(guess)}>{t('ui.useThis')}</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// "Not sure" helper for the gas bill: SoCalGas serves LA County except Long Beach and Signal Hill.
function GasHelper({ pick }: { pick: (u: Utility, other?: string) => void }) {
  const t = useT()
  const ref = useScrollIntoView()
  return (
    <div className="helper" role="group" aria-labelledby="helper-title" ref={ref}>
      <p id="helper-title" className="helper-title">{t('ui.helpTitle')}</p>
      <p className="help">{t('ui.helpBill')}</p>
      <p className="helper-q">{t('ui.longBeachQ')}</p>
      <div className="tiles tiles-compact" role="radiogroup" aria-label={t('ui.longBeachQ')}>
        <Tile selected={false} onClick={() => pick('other', 'Long Beach Utilities')}>{t('ui.yes')}</Tile>
        <Tile selected={false} onClick={() => pick('socalgas')}>{t('ui.no')}</Tile>
        <Tile selected={false} onClick={() => pick('other', NO_GAS)}>{t('ui.noGas')}</Tile>
      </div>
    </div>
  )
}

type StepId = 'zip' | 'electric' | 'gas' | 'income' | 'benefits' | 'people'
type Step = { id: StepId } | { id: 'person'; person: string }

export default function HouseholdForm({ household: h, setHousehold, onDone }: {
  household: Household; setHousehold: (h: Household) => void; onDone: () => void
}) {
  const t = useT()
  const set = (patch: Partial<Household>) => setHousehold({ ...h, ...patch })
  const steps: Step[] = [
    { id: 'zip' }, { id: 'electric' }, { id: 'gas' }, { id: 'income' }, { id: 'benefits' }, { id: 'people' },
    ...h.people.map((p) => ({ id: 'person' as const, person: p.id })),
  ]
  const [index, setIndex] = useState(0)
  const [helper, setHelper] = useState(false)
  const [editing, setEditing] = useState(h.people[0]?.id)
  const i = Math.min(index, steps.length - 1)
  const step = steps[i]
  const last = i === steps.length - 1
  const heading = useRef<HTMLHeadingElement>(null)
  const advance = useRef<number | undefined>(undefined)

  // Each new question starts at the top, and screen readers hear the new question.
  useEffect(() => {
    window.scrollTo(0, 0)
    setHelper(false)
    if (index > 0) heading.current?.focus({ preventScroll: true })
  }, [index])
  useEffect(() => () => window.clearTimeout(advance.current), [])

  const go = (n: number) => { window.clearTimeout(advance.current); setIndex(Math.max(0, Math.min(n, steps.length - 1))) }
  const next = () => (last ? onDone() : go(i + 1))
  // Tapping a single-choice answer moves on by itself, after a beat so the check mark shows.
  const nextSoon = () => { window.clearTimeout(advance.current); advance.current = window.setTimeout(() => go(i + 1), 280) }

  const zipInfo = h.zip ? zips[h.zip] : undefined
  const outside = inLACounty(h.zip) === false
  function setZip(zip: string) {
    const z = zip.replace(/\D/g, '').slice(0, 5)
    const info = zips[z]
    // Pre-fill utilities from the ZIP; the user can still change them.
    set({
      zip: z || undefined,
      ...(info?.electric ? { electric: info.electric as Utility } : {}),
      ...(z.length === 5 && inLACounty(z) ? { gas: z.startsWith('908') ? 'other' : 'socalgas' } : {}),
    })
  }
  const updatePerson = (p: Person) => set({ people: h.people.map((x) => (x.id === p.id ? p : x)) })

  // ---- The growing sentence: one clause per answered question before this one ----
  const stepName = (s: Step) => {
    if (s.id === 'person') {
      const n = h.people.findIndex((p) => p.id === s.person)
      return personLabel(h.people[n], n, t)
    }
    return t(`ui.step${s.id.charAt(0).toUpperCase()}${s.id.slice(1)}`)
  }
  function clause(id: StepId): string | null {
    switch (id) {
      case 'zip': return h.zip ? t('ui.sZip', { zip: zipInfo ? `${zipInfo.city}, ${h.zip}` : h.zip }) : null
      case 'electric': return h.electric === 'unknown' ? t('ui.sElectricUnsure') : t('ui.sElectric', { name: utilityName(h.electric, h.electricOther, t) })
      case 'gas': return h.gas === 'other' && h.gasOther === NO_GAS ? `${t('ui.noGas')}.` : h.gas === 'unknown' ? t('ui.sGasUnsure') : t('ui.sGas', { name: utilityName(h.gas, h.gasOther, t) })
      case 'income': return h.monthlyIncome !== undefined ? t('ui.sIncome', { amount: t.money(h.monthlyIncome) }) : null
      case 'benefits': {
        const got = BENEFITS.filter((b) => h.benefits[b]).map((b) => t(`benefits.${b}`))
        return got.length ? t('ui.sBenefits', { list: got.join(', ') }) : t('ui.sBenefitsNone')
      }
      case 'people': return h.people.length === 1 ? t('ui.sPeopleOne') : t('ui.sPeople', { n: h.people.length })
    }
  }
  // The sentence describes the home, so it steps aside once the questions are about one person.
  const story = step.id === 'person' ? [] : steps.slice(0, i).flatMap((s, n) => {
    if (s.id === 'person') return []
    const c = clause(s.id)
    return c ? [{ n, text: c }] : []
  })

  const personId = step.id === 'person' ? step.person : undefined
  const personIndex = personId ? h.people.findIndex((x) => x.id === personId) : -1

  // ---- The question on this screen ----
  let title: string
  let body: ReactNode

  if (step.id === 'zip') {
    title = t('ui.qZip')
    body = (
      <div className="field">
        <label htmlFor="zip" className="sr-only">{t('ui.zip')}</label>
        <input id="zip" className="input-zip input-big" inputMode="numeric" autoComplete="off" value={h.zip ?? ''}
          placeholder="91605" aria-describedby="zip-help zip-note" onChange={(e) => setZip(e.target.value)} />
        <p id="zip-note" aria-live="polite" className={outside ? 'note-warn' : 'note-ok'}>
          {outside ? t('ui.zipOutside') : zipInfo ? t('ui.zipArea', { city: zipInfo.city }) : ''}
        </p>
        <p className="help" id="zip-help">{t('ui.zipHelp')}</p>
      </div>
    )
  } else if (step.id === 'electric' || step.id === 'gas') {
    const kind = step.id
    const options = kind === 'electric' ? ELECTRIC : GAS
    const value = h[kind]
    const otherKey = kind === 'electric' ? 'electricOther' : 'gasOther'
    const choose = (u: Utility, other?: string) => {
      set({ [kind]: u, ...(other !== undefined ? { [otherKey]: other } : {}) })
      if (u === 'unknown') { setHelper(true); return }
      setHelper(false)
      if (u !== 'other' || other !== undefined) nextSoon()
    }
    title = t(kind === 'electric' ? 'ui.electric' : 'ui.gas')
    body = (
      <>
        <div className="tiles" role="radiogroup" aria-label={title}>
          {options.map((u) => (
            <Tile key={u} selected={value === u} onClick={() => choose(u)}>{t(`utility.${u}`)}</Tile>
          ))}
        </div>
        {value === 'other' && !helper && h[otherKey] !== NO_GAS && (
          <div className="field other-field">
            <label htmlFor={`${kind}-other`}>{t('ui.otherName')}</label>
            <input id={`${kind}-other`} autoComplete="off" placeholder={t('ui.otherPlaceholder')} value={h[otherKey] ?? ''}
              onChange={(e) => set({ [otherKey]: e.target.value })} />
          </div>
        )}
        {helper && value === 'unknown' && (kind === 'electric'
          ? <ElectricHelper zip={h.zip} pick={(u) => (u === 'unknown' ? (setHelper(false), nextSoon()) : choose(u))} />
          : <GasHelper pick={(u, other) => choose(u, other ?? (u === 'other' ? '' : undefined))} />)}
      </>
    )
  } else if (step.id === 'income') {
    title = t('ui.income')
    body = (
      <>
        <div className="field">
          <label htmlFor="income" className="sr-only">{t('ui.income')}</label>
          <div className="money-input">
            <span aria-hidden="true">$</span>
            <input id="income" className="input-big" inputMode="decimal" autoComplete="off" placeholder={t('ui.incomePlaceholder')}
              value={h.monthlyIncome ?? ''} aria-describedby="income-help"
              onChange={(e) => set({ monthlyIncome: num(e.target.value.replace(/[$,\s]/g, '')) })} />
          </div>
          <p className="help" id="income-help">{t('ui.incomeHelp')}</p>
        </div>
        <div className="tiles">
          <Tile role="checkbox" selected={!!h.hasEarnedIncome} onClick={() => set({ hasEarnedIncome: !h.hasEarnedIncome })}>{t('ui.earned')}</Tile>
        </div>
      </>
    )
  } else if (step.id === 'benefits') {
    title = t('ui.benefitsQ')
    body = (
      <div className="tiles" role="group" aria-label={title}>
        {BENEFITS.map((b) => (
          <Tile key={b} role="checkbox" selected={!!h.benefits[b]}
            onClick={() => set({ benefits: { ...h.benefits, [b]: !h.benefits[b] } })}>{t(`benefits.${b}`)}</Tile>
        ))}
      </div>
    )
  } else if (step.id === 'people') {
    title = t('ui.peopleTitle')
    const n = Math.max(0, h.people.findIndex((p) => p.id === editing))
    const p = h.people[n]
    const label = personLabel(p, n, t)
    body = (
      <>
        <p className="lead">{t('ui.peopleHelp')}</p>
        <div className="faces">
          {h.people.map((x, k) => (
            <button key={x.id} type="button" className="face-btn" aria-pressed={x.id === p.id} onClick={() => setEditing(x.id)}>
              <Face p={x} index={k} />
              <span className="face-name">{personLabel(x, k, t)}{x.age !== undefined && `, ${x.age}`}</span>
            </button>
          ))}
          <button type="button" className="face-btn" onClick={() => { const np = newPerson(); set({ people: [...h.people, np] }); setEditing(np.id) }}>
            <span className="face face-md face-add" aria-hidden="true"><Plus size={22} /></span>
            <span className="face-name">{t('ui.addPersonShort')}<span className="sr-only"> {t('ui.addPerson')}</span></span>
          </button>
        </div>
        <div className="person-editor" role="group" aria-label={t('ui.editingPerson', { name: label })}>
          <div className="person-editor-row">
            <div className="field">
              <label htmlFor={`p${p.id}-name`}>{t('ui.personName')}</label>
              <input id={`p${p.id}-name`} value={p.name} placeholder={t('ui.personNamePlaceholder')} autoComplete="off"
                onChange={(e) => updatePerson({ ...p, name: e.target.value })} />
            </div>
            <div className="field field-age">
              <label htmlFor={`p${p.id}-age`}>{t('ui.age')}</label>
              <input id={`p${p.id}-age`} type="number" inputMode="numeric" min={0} max={120} value={p.age ?? ''}
                aria-describedby="age-help" onChange={(e) => updatePerson({ ...p, age: num(e.target.value) })} />
            </div>
            {h.people.length > 1 && (
              <button type="button" className="icon-btn" aria-label={t('ui.removePerson', { name: label })}
                onClick={() => { set({ people: h.people.filter((x) => x.id !== p.id) }); setEditing(h.people[n === 0 ? 1 : n - 1].id) }}>
                <Trash2 size={18} aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="help" id="age-help">{t('ui.ageHelp')}</p>
        </div>
      </>
    )
  } else {
    const n = personIndex
    const p = h.people[n]
    const canBePregnant = p.age === undefined || (p.age >= 10 && p.age <= 55)
    const flags = FLAGS.filter((f) => canBePregnant || (f !== 'pregnant' && f !== 'recentBirth'))
    title = personLabel(p, n, t)
    body = (
      <>
        <p className="question-sub" id="status-q">{t('ui.status')}</p>
        <div className="tiles tiles-compact" role="radiogroup" aria-labelledby="status-q">
          <Tile selected={p.status === undefined} onClick={() => updatePerson({ ...p, status: undefined })}>{t('status.preferNot')}</Tile>
          {STATUSES.map((s) => (
            <Tile key={s} selected={p.status === s} onClick={() => updatePerson({ ...p, status: s })}>{t(`status.${s}`)}</Tile>
          ))}
        </div>
        <p className="help">{t('ui.statusHelp')}</p>
        <p className="question-sub" id="flags-q">{t('ui.aboutPerson')}</p>
        <div className="tiles tiles-compact" role="group" aria-labelledby="flags-q">
          {flags.map((f) => (
            <Tile key={f} role="checkbox" selected={!!p[f]} onClick={() => updatePerson({ ...p, [f]: !p[f] })}>{t(`flags.${f}`)}</Tile>
          ))}
        </div>
      </>
    )
  }

  // ---- The step checklist: a side panel on wide screens, a fold-out line on phones ----
  const list = (
    <ol className="steplist">
      {steps.map((s, n) => {
        const state = n < i ? 'done' : n === i ? 'current' : 'todo'
        return (
          <li key={n} className={`steplist-item steplist-${state} ${s.id === 'person' ? 'steplist-sub' : ''}`}>
            <button type="button" onClick={() => go(n)} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="steplist-mark" aria-hidden="true">{state === 'done' ? <Check size={14} strokeWidth={3} /> : s.id === 'person' ? '' : n + 1}</span>
              <span>{stepName(s)}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )

  return (
    <form className="household wizard" onSubmit={(e) => { e.preventDefault(); next() }}>
      <aside className="wizard-side" aria-label={t('ui.allSteps')}>{list}</aside>
      <details className="wizard-top" key={`top-${i}`}>
        <summary>
          <span>{t('ui.progress', { n: i + 1, total: steps.length })} · <strong>{stepName(step)}</strong></span>
          <span className="wizard-top-more">{t('ui.allSteps')}</span>
        </summary>
        {list}
      </details>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
      </div>

      <div className="wizard-main">
        {story.length > 0 && (
          <p className="story">
            {story.map(({ n, text }) => (
              <button key={n} type="button" className="story-part" onClick={() => go(n)}>
                {text}<span className="sr-only"> ({t('ui.editAnswer')})</span>
              </button>
            ))}
          </p>
        )}
        <h1 tabIndex={-1} ref={heading} className="view-heading question" key={`q-${i}`}>
          {personIndex >= 0 && <Face p={h.people[personIndex]} index={personIndex} />}
          {title}
        </h1>
        <div className="answer" key={`a-${i}`}>{body}</div>

        <div className="action-bar">
          {i > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => go(i - 1)}>
              <ArrowLeft size={18} aria-hidden="true" /> {t('ui.back')}
            </button>
          )}
          <button type="submit" className="btn btn-primary btn-lg">{last ? t('ui.seeResults') : t('ui.next')}</button>
        </div>
      </div>
    </form>
  )
}
