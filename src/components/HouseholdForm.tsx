import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Flame, Mail, MapPin, ShoppingBasket, Siren, Zap } from 'lucide-react'
import { useT, type T } from '../i18n'
import { inLACounty, type Household, type Person, type Status, type Utility } from '../engine'
import { zips } from '../data'
import { newPerson, personLabel, todayISO } from '../App'
import House, { type HousePart, type HouseWindow } from './House'

export const STATUSES: Status[] = ['citizen', 'lpr5', 'lpr', 'humanitarian', 'otherLawful', 'undocumented']
const ELECTRIC: Utility[] = ['ladwp', 'sce', 'bwp', 'gwp', 'pwp', 'other', 'unknown']
const GAS: Utility[] = ['socalgas', 'other', 'unknown']
const BENEFITS = ['calfresh', 'calworks', 'ssi', 'wic'] as const
const LOSSES = { home: 'ui.lossHome', food: 'ui.lossFood', work: 'ui.lossWork' } as const
const FLAGS = ['pregnant', 'recentBirth', 'disabled', 'hasMediCal'] as const

// Blank, not a number, or negative = not answered.
const num = (s: string) => (s.trim() === '' || !(Number(s) >= 0) ? undefined : Number(s))

export function StatusSelect({ value, onChange, id }: { value?: Status; onChange: (s?: Status) => void; id: string }) {
  const t = useT()
  return (
    <select id={id} value={value ?? ''} onChange={(e) => onChange((e.target.value || undefined) as Status | undefined)}>
      <option value="">{t('status.preferNot')}</option>
      {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
    </select>
  )
}

// First letter of a person's name (or "You" / "Person 2") for their window.
export const initial = (p: Person, index: number, t: T) =>
  personLabel(p, index, t).trim().charAt(0).toUpperCase() || String(index + 1)

// A person shown as a round face with their first initial.
export function Face({ p, index }: { p: Person; index: number }) {
  const t = useT()
  return <span className="face" aria-hidden="true">{initial(p, index, t)}</span>
}

// A big answer button. Single-choice tiles are pressed buttons (tapping one can move on, so no arrow-key
// radio group); multi-choice tiles are checkboxes.
function Tile({ selected, onClick, children, role }: {
  selected: boolean; onClick: () => void; children: ReactNode; role?: 'checkbox'
}) {
  const state = role ? { role, 'aria-checked': selected } : { 'aria-pressed': selected }
  return (
    <button type="button" {...state} className="tile" onClick={onClick}>
      <span>{children}</span>
      <span className="tile-check" aria-hidden="true">{selected && <Check size={16} strokeWidth={3.5} />}</span>
    </button>
  )
}

// Marks "we don't have gas at home" (counts as 'other' for the rules).
const NO_GAS = '__none__'
// Short name: "LADWP (Los Angeles Dept. of Water and Power)" shows as "LADWP".
const shortUtility = (u: Utility, other: string | undefined, t: T) =>
  u === 'other' && other?.trim() && other !== NO_GAS ? other.trim() : t(`utility.${u}`).replace(/\s*\(.*\)$/, '')

// Opens below the answer tiles, so bring it into view on small screens.
function useScrollIntoView() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [])
  return ref
}

// "Not sure" helper for the electric bill: guess from the ZIP, or ask which city.
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
      <p id="helper-title" className="helper-title">{t('ui.helperTitle')}</p>
      <p className="help">{t('ui.helpBill')}</p>
      {fromZip && info ? (
        <div className="guess">
          <p>{t('ui.guessFromZip', { city: info.city, name: t(`utility.${fromZip}`) })}</p>
          <button type="button" className="btn btn-primary btn-small" onClick={() => pick(fromZip)}>{t('ui.useThis')}</button>
        </div>
      ) : (
        <>
          <p className="helper-q">{t('ui.cityQ')}</p>
          <div className="tiles tiles-compact" role="group" aria-label={t('ui.cityQ')}>
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
      <p id="helper-title" className="helper-title">{t('ui.helperTitle')}</p>
      <p className="help">{t('ui.helpBill')}</p>
      <p className="helper-q">{t('ui.longBeachQ')}</p>
      <div className="tiles tiles-compact" role="group" aria-label={t('ui.longBeachQ')}>
        <Tile selected={false} onClick={() => pick('other', 'Long Beach Utilities')}>{t('ui.yes')}</Tile>
        <Tile selected={false} onClick={() => pick('socalgas')}>{t('ui.no')}</Tile>
        <Tile selected={false} onClick={() => pick('other', NO_GAS)}>{t('ui.noGas')}</Tile>
      </div>
    </div>
  )
}

// Parts of the house, in the order "Next" walks through them. People are "p:<id>".
type Part = 'zip' | 'electric' | 'gas' | 'income' | 'benefits' | 'disaster' | `p:${string}`

export default function HouseholdForm({ household: h, setHousehold, onDone }: {
  household: Household; setHousehold: (h: Household) => void; onDone: () => void
}) {
  const t = useT()
  const set = (patch: Partial<Household>) => setHousehold({ ...h, ...patch })
  const order: Part[] = ['zip', 'electric', 'gas', 'income', 'benefits', 'disaster', ...h.people.map((p) => `p:${p.id}` as Part)]
  const [part, setPart] = useState<Part>('zip')
  const [left, setLeft] = useState<Set<Part>>(() => new Set()) // parts the user has moved past
  const [helper, setHelper] = useState(false)
  const current: Part = order.includes(part) ? part : 'zip'
  const at = order.indexOf(current)
  const last = at === order.length - 1
  const heading = useRef<HTMLHeadingElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const moved = useRef(false)
  const advance = useRef<number | undefined>(undefined)

  // A new part: screen readers hear the question; on phones the question scrolls into view.
  useEffect(() => {
    setHelper(false)
    if (!moved.current) return
    heading.current?.focus({ preventScroll: true })
    // Phones: bring the question into view. Wide screens: everything fits, so go back to the top.
    if (window.innerWidth < 900) panel.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [current])
  useEffect(() => () => window.clearTimeout(advance.current), [])

  const go = (p: Part) => {
    window.clearTimeout(advance.current)
    moved.current = true
    setLeft((s) => new Set(s).add(current))
    setPart(p)
  }
  const next = () => (last ? onDone() : go(order[at + 1]))
  // Tapping a single-choice answer moves on by itself, after a beat so the check mark shows.
  const nextSoon = () => { window.clearTimeout(advance.current); advance.current = window.setTimeout(next, 280) }

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
  // Removing the person on screen moves to the person before them (or the first one).
  const removePerson = (id: string) => {
    const n = h.people.findIndex((x) => x.id === id)
    const rest = h.people.filter((x) => x.id !== id)
    set({ people: rest })
    if (current === `p:${id}`) setPart(`p:${rest[Math.max(0, n - 1)].id}`)
  }
  const addPerson = () => { const np = newPerson(); set({ people: [...h.people, np] }); go(`p:${np.id}`) }

  // ---- What the house shows ----
  const gotBenefits = BENEFITS.filter((b) => h.benefits[b])
  const answered: Record<string, boolean> = {
    zip: !!h.zip, electric: h.electric !== 'unknown', gas: h.gas !== 'unknown',
    income: h.monthlyIncome !== undefined, benefits: gotBenefits.length > 0, disaster: h.disaster !== undefined,
  }
  // Done = answered. Only the benefits basket counts once passed, since "none of these" is an answer.
  const done = (p: Part) => (p.startsWith('p:') ? h.people.find((x) => `p:${x.id}` === p)?.age !== undefined : answered[p])
    || (p === 'benefits' && left.has(p) && p !== current)
  const spot = (id: Part, x: number, y: number, icon: ReactNode, label: string, value?: string): HousePart =>
    ({ id, x, y, icon, label, value, done: done(id), active: current === id, onClick: () => go(id) })
  const parts: HousePart[] = [
    spot('zip', 7.5, 57, <MapPin size={20} />, t('ui.stepZip'), h.zip),
    spot('electric', 91.5, 22, <Zap size={20} />, t('ui.stepElectric'), answered.electric ? shortUtility(h.electric, h.electricOther, t) : undefined),
    spot('gas', 26.75, 80, <Flame size={20} />, t('ui.stepGas'), answered.gas ? (h.gasOther === NO_GAS ? t('ui.noGas') : shortUtility(h.gas, h.gasOther, t)) : undefined),
    spot('income', 85.5, 75, <Mail size={20} />, t('ui.stepIncome'), answered.income ? t.money(h.monthlyIncome!) : undefined),
    spot('benefits', 62, 82, <ShoppingBasket size={20} />, t('ui.stepBenefits'), gotBenefits.length ? gotBenefits.map((b) => t(`benefits.${b}`).replace(/\s*\(.*\)$/, '')).join(', ') : undefined),
    // Smoke from the chimney: the disaster question.
    spot('disaster', 65, 9, <Siren size={20} />, t('ui.stepDisaster'), h.disaster === undefined ? undefined
      : h.disaster ? (h.disasterDate ? t.date(h.disasterDate) : t('ui.yes')) : t('ui.no')),
  ]
  const windows: HouseWindow[] = h.people.map((p, n) => {
    const name = personLabel(p, n, t)
    return {
      id: p.id, letter: initial(p, n, t), caption: p.age !== undefined ? `${name}, ${p.age}` : name,
      label: p.age !== undefined ? `${name}, ${t('ui.age')} ${p.age}` : name,
      done: done(`p:${p.id}`), active: current === `p:${p.id}`, onClick: () => go(`p:${p.id}`),
      ...(h.people.length > 1 ? { onRemove: () => removePerson(p.id), removeLabel: t('ui.removePerson', { name }) } : {}),
    }
  })
  const doneCount = order.filter(done).length

  // ---- The question for the chosen part ----
  let partName: string
  let title: string
  let body: ReactNode

  if (current === 'zip') {
    partName = t('ui.stepZip')
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
  } else if (current === 'electric' || current === 'gas') {
    const kind = current
    const options = kind === 'electric' ? ELECTRIC : GAS
    const value = h[kind]
    const otherKey = kind === 'electric' ? 'electricOther' : 'gasOther'
    const choose = (u: Utility, other?: string) => {
      set({ [kind]: u, ...(other !== undefined ? { [otherKey]: other } : u !== 'other' ? { [otherKey]: undefined } : {}) })
      if (u === 'unknown') { setHelper(true); return }
      setHelper(false)
      if (u !== 'other' || other !== undefined) nextSoon()
    }
    partName = t(kind === 'electric' ? 'ui.stepElectric' : 'ui.stepGas')
    title = t(kind === 'electric' ? 'ui.electric' : 'ui.gas')
    body = (
      <>
        <div className="tiles" role="group" aria-label={title}>
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
          : <GasHelper pick={(u, other) => choose(u, other)} />)}
      </>
    )
  } else if (current === 'income') {
    partName = t('ui.stepIncome')
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
  } else if (current === 'benefits') {
    partName = t('ui.stepBenefits')
    title = t('ui.benefitsQ')
    body = (
      <div className="tiles" role="group" aria-label={title}>
        {BENEFITS.map((b) => (
          <Tile key={b} role="checkbox" selected={!!h.benefits[b]}
            onClick={() => set({ benefits: { ...h.benefits, [b]: !h.benefits[b] } })}>{t(`benefits.${b}`)}</Tile>
        ))}
      </div>
    )
  } else if (current === 'disaster') {
    const loss = h.disasterLoss ?? {}
    partName = t('ui.stepDisaster')
    title = t('ui.qDisaster')
    body = (
      <>
        <div className="tiles" role="group" aria-label={title}>
          <Tile selected={h.disaster === true} onClick={() => set({ disaster: true })}>{t('ui.yes')}</Tile>
          <Tile selected={h.disaster === false} onClick={() => { set({ disaster: false }); nextSoon() }}>{t('ui.no')}</Tile>
        </div>
        <p className="help">{t('ui.disasterHelp')}</p>
        {h.disaster && (
          <>
            <div className="field other-field">
              <label htmlFor="disaster-date">{t('ui.disasterWhen')}</label>
              <input id="disaster-date" type="date" max={todayISO()} value={h.disasterDate ?? ''}
                onChange={(e) => set({ disasterDate: e.target.value || undefined })} />
            </div>
            <p className="question-sub" id="loss-q">{t('ui.disasterWhat')}</p>
            <div className="tiles tiles-compact" role="group" aria-labelledby="loss-q">
              {(Object.keys(LOSSES) as (keyof typeof LOSSES)[]).map((k) => (
                <Tile key={k} role="checkbox" selected={!!loss[k]} onClick={() => set({ disasterLoss: { ...loss, [k]: !loss[k] } })}>{t(LOSSES[k])}</Tile>
              ))}
            </div>
          </>
        )}
      </>
    )
  } else {
    const n = h.people.findIndex((x) => `p:${x.id}` === current)
    const p = h.people[n]
    const label = personLabel(p, n, t)
    const canBePregnant = p.age === undefined || (p.age >= 10 && p.age <= 55)
    const flags = FLAGS.filter((f) => canBePregnant || (f !== 'pregnant' && f !== 'recentBirth'))
    partName = t('ui.peopleTitle')
    title = label
    body = (
      <>
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
        </div>
        <p className="help" id="age-help">{t('ui.ageHelp')}</p>
        <p className="question-sub" id="status-q">{t('ui.status')}</p>
        <div className="tiles tiles-compact" role="group" aria-labelledby="status-q">
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

  return (
    <form className="household home" onSubmit={(e) => { e.preventDefault(); next() }}>
      <div className="home-intro">
        <h1 tabIndex={-1} className="view-heading page-title">{t('ui.householdTitle')}</h1>
        <p className="page-lead">{t('ui.tapHouse')} {t('ui.householdIntro')}</p>
      </div>

      <div className="home-grid">
        <div className="home-house">
          <House parts={parts} windows={windows} onAdd={addPerson} addLabel={t('ui.addPerson')} />
          <p className="home-hint">{t('ui.peopleHelp')}</p>
        </div>

        <div className="home-panel bubble" ref={panel}>
          <div className="panel-top">
            <span className="panel-part">{partName}</span>
            <span className="panel-count">{t('ui.partsDone', { n: doneCount, total: order.length })}</span>
          </div>
          <div className="panel-dots" aria-hidden="true">
            {order.map((p) => <span key={p} className={`pdot ${done(p) ? 'pdot-done' : ''} ${p === current ? 'pdot-now' : ''}`} />)}
          </div>
          <h2 tabIndex={-1} ref={heading} className="question" key={`q-${current}`}>{title}</h2>
          <div className="answer" key={`a-${current}`}>{body}</div>
        </div>
      </div>

      <div className="action-bar">
        {!last && <button type="button" className="btn btn-ghost" onClick={onDone}>{t('ui.seeResults')}</button>}
        <button type="submit" className="btn btn-primary btn-lg">{last ? t('ui.seeResults') : t('ui.next')}</button>
      </div>
    </form>
  )
}
