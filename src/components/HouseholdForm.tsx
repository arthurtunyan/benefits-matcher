import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useT } from '../i18n'
import { inLACounty, type Household, type Person, type Status, type Utility } from '../engine'
import { zips } from '../data'
import { newPerson, personLabel } from '../App'

export const STATUSES: Status[] = ['citizen', 'lpr5', 'lpr', 'humanitarian', 'otherLawful', 'undocumented']
const ELECTRIC: Utility[] = ['ladwp', 'sce', 'bwp', 'gwp', 'pwp', 'other', 'unknown']
const GAS: Utility[] = ['socalgas', 'other', 'unknown']
const BENEFITS = ['calfresh', 'calworks', 'ssi', 'wic'] as const

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

// One screen per question. The fixed questions come first, then one screen for each person.
type Step = 'zip' | 'bills' | 'income' | 'benefits' | 'people' | { person: string }

export default function HouseholdForm({ household: h, setHousehold, onDone }: {
  household: Household; setHousehold: (h: Household) => void; onDone: () => void
}) {
  const t = useT()
  const set = (patch: Partial<Household>) => setHousehold({ ...h, ...patch })
  const steps: Step[] = ['zip', 'bills', 'income', 'benefits', 'people', ...h.people.map((p) => ({ person: p.id }))]
  const [index, setIndex] = useState(0)
  const i = Math.min(index, steps.length - 1)
  const step = steps[i]
  const last = i === steps.length - 1
  const heading = useRef<HTMLHeadingElement>(null)

  // Each new question starts at the top, and screen readers hear the new question.
  useEffect(() => {
    window.scrollTo(0, 0)
    if (index > 0) heading.current?.focus({ preventScroll: true })
  }, [index])

  const next = () => (last ? onDone() : setIndex(i + 1))
  const back = () => setIndex(Math.max(0, i - 1))

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

  let title: string
  let body: React.ReactNode

  if (step === 'zip') {
    title = t('ui.qZip')
    body = (
      <>
        <p className="lead">{t('ui.householdIntro')}</p>
        <div className="field">
          <label htmlFor="zip" className="sr-only">{t('ui.zip')}</label>
          <input id="zip" className="input-zip input-big" inputMode="numeric" autoComplete="off" value={h.zip ?? ''}
            placeholder="91605" aria-describedby="zip-help zip-note" onChange={(e) => setZip(e.target.value)} />
          <p id="zip-note" aria-live="polite" className={outside ? 'note-warn' : 'note-ok'}>
            {outside ? t('ui.zipOutside') : zipInfo ? t('ui.zipArea', { city: zipInfo.city }) : ''}
          </p>
          <p className="help" id="zip-help">{t('ui.zipHelp')}</p>
        </div>
      </>
    )
  } else if (step === 'bills') {
    title = t('ui.qBills')
    body = (
      <>
        <div className="field">
          <label htmlFor="electric">{t('ui.electric')}</label>
          <select id="electric" value={h.electric} onChange={(e) => set({ electric: e.target.value as Utility })}>
            {ELECTRIC.map((u) => <option key={u} value={u}>{t(`utility.${u}`)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="gas">{t('ui.gas')}</label>
          <select id="gas" value={h.gas} onChange={(e) => set({ gas: e.target.value as Utility })}>
            {GAS.map((u) => <option key={u} value={u}>{t(`utility.${u}`)}</option>)}
          </select>
        </div>
      </>
    )
  } else if (step === 'income') {
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
        <label className="chip">
          <input type="checkbox" checked={!!h.hasEarnedIncome} onChange={(e) => set({ hasEarnedIncome: e.target.checked })} />
          <span>{t('ui.earned')}</span>
        </label>
      </>
    )
  } else if (step === 'benefits') {
    title = t('ui.benefitsQ')
    body = (
      <fieldset className="choices">
        <legend className="sr-only">{t('ui.benefitsQ')}</legend>
        {BENEFITS.map((b) => (
          <label key={b} className="chip">
            <input type="checkbox" checked={!!h.benefits[b]}
              onChange={(e) => set({ benefits: { ...h.benefits, [b]: e.target.checked } })} />
            <span>{t(`benefits.${b}`)}</span>
          </label>
        ))}
      </fieldset>
    )
  } else if (step === 'people') {
    title = t('ui.peopleTitle')
    body = (
      <>
        <p className="lead">{t('ui.peopleHelp')}</p>
        <ul className="people">
          {h.people.map((p, n) => {
            const label = personLabel(p, n, t)
            return (
              <li key={p.id} className="person-row">
                <div className="field">
                  <label htmlFor={`p${p.id}-name`}>{t('ui.personName')}</label>
                  <input id={`p${p.id}-name`} value={p.name} placeholder={t('ui.personNamePlaceholder')} autoComplete="off"
                    onChange={(e) => updatePerson({ ...p, name: e.target.value })} />
                </div>
                <div className="field field-age">
                  <label htmlFor={`p${p.id}-age`}>{t('ui.age')}</label>
                  <input id={`p${p.id}-age`} type="number" inputMode="numeric" min={0} max={120} value={p.age ?? ''}
                    onChange={(e) => updatePerson({ ...p, age: num(e.target.value) })} />
                </div>
                {h.people.length > 1 && (
                  <button type="button" className="icon-btn" aria-label={t('ui.removePerson', { name: label })}
                    onClick={() => set({ people: h.people.filter((x) => x.id !== p.id) })}>
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        <p className="help">{t('ui.ageHelp')}</p>
        <button type="button" className="btn btn-soft add-person" onClick={() => set({ people: [...h.people, newPerson()] })}>
          <Plus size={18} aria-hidden="true" /> {t('ui.addPerson')}
        </button>
      </>
    )
  } else {
    const n = h.people.findIndex((p) => p.id === step.person)
    const p = h.people[n]
    const canBePregnant = p.age === undefined || (p.age >= 10 && p.age <= 55)
    const flags = (['pregnant', 'recentBirth', 'disabled', 'hasMediCal'] as const).filter(
      (f) => canBePregnant || (f !== 'pregnant' && f !== 'recentBirth'),
    )
    title = personLabel(p, n, t)
    body = (
      <>
        {p.age !== undefined && <p className="lead">{t('ui.age')}: {p.age}</p>}
        <div className="field">
          <label htmlFor={`p${p.id}-status`}>{t('ui.status')}</label>
          <StatusSelect id={`p${p.id}-status`} value={p.status} onChange={(status) => updatePerson({ ...p, status })} />
          <p className="help">{t('ui.statusHelp')}</p>
        </div>
        <fieldset className="choices">
          <legend>{t('ui.aboutPerson')}</legend>
          {flags.map((f) => (
            <label key={f} className="chip">
              <input type="checkbox" checked={!!p[f]} onChange={(e) => updatePerson({ ...p, [f]: e.target.checked })} />
              <span>{t(`flags.${f}`)}</span>
            </label>
          ))}
        </fieldset>
      </>
    )
  }

  return (
    <form className="household wizard" onSubmit={(e) => { e.preventDefault(); next() }}>
      <div className="progress">
        <p className="progress-label">{t('ui.progress', { n: i + 1, total: steps.length })}</p>
        <div className="progress-track" role="progressbar" aria-label={t('ui.stepHousehold')}
          aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={i + 1}>
          <div className="progress-fill" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <h1 tabIndex={-1} ref={heading} className="view-heading question" key={i}>{title}</h1>
      <div className="answer">{body}</div>

      <div className="action-bar">
        {i > 0 && (
          <button type="button" className="btn btn-ghost" onClick={back}>
            <ArrowLeft size={18} aria-hidden="true" /> {t('ui.back')}
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-lg">{last ? t('ui.seeResults') : t('ui.next')}</button>
      </div>
    </form>
  )
}
