import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowLeft, Check, DoorOpen, Flame, Mail, MapPin, ShoppingBasket, Zap } from 'lucide-react'
import { useT, type T } from '../i18n'
import { inLACounty, type Household, type Person, type Status, type Utility } from '../engine'
import { zips } from '../data'
import { newPerson, personLabel } from '../App'
import House, { type HousePart, type HouseWindow } from './House'
import Room, { type RoomPerson } from './Room'

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

// First letter of a person's name (or "You" / "Person 2") for their window.
export const initial = (p: Person, index: number, t: T) =>
  personLabel(p, index, t).trim().charAt(0).toUpperCase() || String(index + 1)

// A person shown as a round face with their first initial.
export function Face({ p, index }: { p: Person; index: number }) {
  const t = useT()
  return <span className="face" aria-hidden="true">{initial(p, index, t)}</span>
}

// A big answer button. Single-choice tiles are radios; multi-choice tiles are checkboxes.
function Tile({ selected, onClick, children, role = 'radio' }: {
  selected: boolean; onClick: () => void; children: ReactNode; role?: 'radio' | 'checkbox'
}) {
  return (
    <button type="button" role={role} aria-checked={selected} className="tile" onClick={onClick}>
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

// Parts of the house, in the order Next walks them: left to right across the house,
// then in through the door to the people. People are "p:<id>".
type Part = 'zip' | 'gas' | 'benefits' | 'income' | 'electric' | `p:${string}`
const OUTSIDE: Part[] = ['zip', 'gas', 'benefits', 'income', 'electric']
const isPerson = (p: Part) => p.startsWith('p:')
// Each part of the house has its own color; people take turns through these.
const PART_COLOR: Record<string, string> = {
  zip: 'var(--c-zip)', gas: 'var(--c-gas)', benefits: 'var(--c-benefits)', income: 'var(--c-income)', electric: 'var(--c-electric)', home: 'var(--c-home)',
}
export const PERSON_COLORS = ['var(--c-home)', 'var(--c-zip)', 'var(--c-income)', 'var(--c-gas)', 'var(--c-benefits)', 'var(--c-electric)']
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function HouseholdForm({ household: h, setHousehold, onDone, unlocked, onComplete }: {
  household: Household; setHousehold: (h: Household) => void; onDone: () => void
  unlocked: boolean // results already reached once, e.g. coming back to edit
  onComplete: () => void
}) {
  const t = useT()
  const set = (patch: Partial<Household>) => setHousehold({ ...h, ...patch })
  const order: Part[] = [...OUTSIDE, ...h.people.map((p) => `p:${p.id}` as Part)]
  const [part, setPart] = useState<Part>('zip')
  const [left, setLeft] = useState<Set<Part>>(() => new Set()) // parts the user has moved past
  const [helper, setHelper] = useState(false)
  const [entering, setEntering] = useState(false) // the door is opening
  const current: Part = order.includes(part) ? part : 'zip'
  const at = order.indexOf(current)
  const last = at === order.length - 1
  const inside = isPerson(current)
  const heading = useRef<HTMLHeadingElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const moved = useRef(false)
  const wasInside = useRef(false)
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
  useEffect(() => { wasInside.current = inside })
  useEffect(() => () => window.clearTimeout(advance.current), [])

  const go = (p: Part) => {
    window.clearTimeout(advance.current)
    moved.current = true
    setLeft((s) => new Set(s).add(current))
    // Going from outside to a person: the door opens first, then we step in.
    if (!inside && isPerson(p) && !reducedMotion()) {
      setEntering(true)
      advance.current = window.setTimeout(() => { setEntering(false); setPart(p) }, 520)
      return
    }
    setPart(p)
  }
  const back = () => at > 0 && go(order[at - 1])
  const next = () => (last ? finish() : go(order[at + 1]))
  // Tapping a single-choice answer moves on by itself, after a beat so the check mark shows.
  const nextSoon = () => { window.clearTimeout(advance.current); advance.current = window.setTimeout(next, 320) }

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

  // ---- How filled in each part is (the circles fill up as you answer) ----
  const gotBenefits = BENEFITS.filter((b) => h.benefits[b])
  const personFill = (p: Person) => (Number(p.name.trim() !== '') + Number(p.age !== undefined)) / 2
  const fill = (p: Part): number => {
    if (isPerson(p)) { const x = h.people.find((y) => `p:${y.id}` === p); return x ? personFill(x) : 0 }
    switch (p) {
      case 'zip': return (h.zip?.length ?? 0) / 5
      case 'gas': return h.gas !== 'unknown' ? 1 : 0
      case 'electric': return h.electric !== 'unknown' ? 1 : 0
      case 'benefits': return gotBenefits.length > 0 ? 1 : 0
      case 'income': return h.monthlyIncome === undefined ? 0 : Math.min(1, String(Math.round(h.monthlyIncome)).length / 4)
    }
    return 0
  }
  // Done = fully answered, or skipped by moving past it with Next.
  const done = (p: Part) => (isPerson(p) ? h.people.find((x) => `p:${x.id}` === p)?.age !== undefined : fill(p) >= 1) || (left.has(p) && p !== current)
  // See results unlocks once every part is done (the part on screen counts, since See results moves past it).
  const complete = unlocked || order.every((p) => p === current || done(p))
  useEffect(() => { if (complete && !unlocked) onComplete() }, [complete, unlocked, onComplete])
  const finish = () => { if (complete) onDone() }

  const spot = (id: Part, x: number, y: number, icon: ReactNode, label: string, value?: string): HousePart =>
    ({ id, x, y, icon, label, value, color: PART_COLOR[id], fill: fill(id), done: done(id), active: current === id, onClick: () => go(id) })
  const peopleFill = h.people.reduce((sum, p) => sum + personFill(p), 0) / Math.max(1, h.people.length)
  const parts: HousePart[] = [
    spot('zip', 7.5, 42, <MapPin size={20} />, t('ui.stepZip'), h.zip),
    spot('gas', 26.75, 80, <Flame size={20} />, t('ui.stepGas'), fill('gas') ? (h.gasOther === NO_GAS ? t('ui.noGas') : shortUtility(h.gas, h.gasOther, t)) : undefined),
    {
      id: 'home', x: 47.5, y: 80, icon: <DoorOpen size={20} />, label: t('ui.peopleTitle'), color: PART_COLOR.home,
      fill: peopleFill, done: h.people.every((p) => done(`p:${p.id}`)), active: false, onClick: () => go(`p:${h.people[0].id}`),
    },
    spot('benefits', 64, 82, <ShoppingBasket size={20} />, t('ui.stepBenefits'), gotBenefits.length ? gotBenefits.map((b) => t(`benefits.${b}`).replace(/\s*\(.*\)$/, '')).join(', ') : undefined),
    spot('income', 84.5, 61, <Mail size={20} />, t('ui.stepIncome'), h.monthlyIncome !== undefined ? t.money(h.monthlyIncome) : undefined),
    spot('electric', 87.5, 22, <Zap size={20} />, t('ui.stepElectric'), fill('electric') ? shortUtility(h.electric, h.electricOther, t) : undefined),
  ]
  const personColor = (n: number) => PERSON_COLORS[n % PERSON_COLORS.length]
  const windows: HouseWindow[] = h.people.map((p, n) => {
    const name = personLabel(p, n, t)
    return {
      id: p.id, letter: initial(p, n, t), color: personColor(n), fill: personFill(p),
      label: p.age !== undefined ? `${name}, ${t('ui.age')} ${p.age}` : name, onClick: () => go(`p:${p.id}`),
    }
  })
  const roomPeople: RoomPerson[] = h.people.map((p, n) => {
    const name = personLabel(p, n, t)
    return {
      id: p.id, letter: initial(p, n, t), name, color: personColor(n), fill: personFill(p), active: current === `p:${p.id}`,
      label: p.age !== undefined ? `${name}, ${t('ui.age')} ${p.age}` : name,
    }
  })
  const doneCount = order.filter(done).length
  const panelColor = inside ? personColor(Math.max(0, h.people.findIndex((x) => `p:${x.id}` === current))) : PART_COLOR[current]

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

  return (
    <form className="household home" onSubmit={(e) => { e.preventDefault(); next() }}>
      <div className="home-intro">
        <h1 tabIndex={-1} className="view-heading page-title">{t('ui.householdTitle')}</h1>
        <p className="page-lead">{inside ? t('ui.peopleHelp') : `${t('ui.tapHouse')} ${t('ui.householdIntro')}`}</p>
      </div>

      <div className="home-grid">
        <div className={`home-house ${inside ? 'home-inside' : wasInside.current ? 'home-back-out' : ''}`} key={inside ? 'in' : 'out'}>
          {inside ? (
            <Room title={t('ui.peopleTitle')} people={roomPeople} onSelect={(id) => go(`p:${id}`)}
              onAdd={addPerson} addLabel={t('ui.addPerson')}
              onRemove={h.people.length > 1 ? removePerson : undefined} removeLabel={(name) => t('ui.removePerson', { name })}
              onExit={() => go('electric')} exitLabel={t('ui.stepOutside')} />
          ) : (
            <House parts={parts} windows={windows} entering={entering} />
          )}
        </div>

        <div className="home-panel bubble" ref={panel} style={{ '--part': panelColor } as CSSProperties}>
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
        {at > 0 && (
          <button type="button" className="btn btn-ghost" onClick={back}>
            <ArrowLeft size={18} aria-hidden="true" /> {inside && at === OUTSIDE.length ? t('ui.stepOutside') : t('ui.back')}
          </button>
        )}
        {last && !complete && <p className="finish-first" id="finish-first">{t('ui.finishFirst')}</p>}
        <button type="submit" className="btn btn-primary btn-lg" disabled={last && !complete} aria-describedby={last && !complete ? 'finish-first' : undefined}>
          {last ? t('ui.seeResults') : t('ui.next')}
        </button>
      </div>
    </form>
  )
}
