import { ArrowRight, Baby, MapPin, Plus, Trash2, UserRound, Wallet } from 'lucide-react'
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

function PersonCard({ p, index, update, remove, canRemove }: {
  p: Person; index: number; update: (p: Person) => void; remove: () => void; canRemove: boolean
}) {
  const t = useT()
  const id = (f: string) => `p${p.id}-${f}`
  const child = p.age !== undefined && p.age < 18
  const canBePregnant = p.age === undefined || (p.age >= 10 && p.age <= 55)
  const flags = (['pregnant', 'recentBirth', 'disabled', 'hasMediCal'] as const).filter(
    (f) => canBePregnant || (f !== 'pregnant' && f !== 'recentBirth'),
  )
  const label = personLabel(p, index, t)
  return (
    <li className="card person-card">
      <div className="person-head">
        <span className={`avatar ${child ? 'avatar-child' : ''}`} aria-hidden="true">
          {child ? <Baby size={20} /> : <UserRound size={20} />}
        </span>
        <h3>{label}</h3>
        {canRemove && (
          <button className="icon-btn" onClick={remove} aria-label={t('ui.removePerson', { name: label })}>
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor={id('name')}>{t('ui.personName')}</label>
          <input id={id('name')} value={p.name} placeholder={t('ui.personNamePlaceholder')} autoComplete="off"
            onChange={(e) => update({ ...p, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor={id('age')}>{t('ui.age')}</label>
          <input id={id('age')} type="number" inputMode="numeric" min={0} max={120} value={p.age ?? ''}
            aria-describedby={id('age-help')}
            onChange={(e) => update({ ...p, age: num(e.target.value) })} />
          <p className="help" id={id('age-help')}>{t('ui.ageHelp')}</p>
        </div>
      </div>
      <div className="field">
        <label htmlFor={id('status')}>{t('ui.status')}</label>
        <StatusSelect id={id('status')} value={p.status} onChange={(status) => update({ ...p, status })} />
        <p className="help">{t('ui.statusHelp')}</p>
      </div>
      <fieldset className="chips">
        <legend>{t('ui.aboutPerson')}</legend>
        {flags.map((f) => (
          <label key={f} className="chip">
            <input type="checkbox" checked={!!p[f]} onChange={(e) => update({ ...p, [f]: e.target.checked })} />
            <span>{t(`flags.${f}`)}</span>
          </label>
        ))}
      </fieldset>
    </li>
  )
}

export default function HouseholdForm({ household: h, setHousehold, onDone }: {
  household: Household; setHousehold: (h: Household) => void; onDone: () => void
}) {
  const t = useT()
  const set = (patch: Partial<Household>) => setHousehold({ ...h, ...patch })
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

  const updatePerson = (i: number) => (p: Person) => set({ people: h.people.map((x, j) => (j === i ? p : x)) })

  return (
    <form className="household" onSubmit={(e) => { e.preventDefault(); onDone() }}>
      <h1 tabIndex={-1} className="view-heading">{t('ui.householdTitle')}</h1>
      <p className="lead">{t('ui.householdIntro')}</p>

      <section className="card">
        <h2 className="card-title"><MapPin size={20} aria-hidden="true" /> {t('ui.whereTitle')}</h2>
        <div className="field">
          <label htmlFor="zip">{t('ui.zip')}</label>
          <input id="zip" className="input-zip" inputMode="numeric" autoComplete="off" value={h.zip ?? ''}
            aria-describedby="zip-help zip-note" onChange={(e) => setZip(e.target.value)} />
          <p className="help" id="zip-help">{t('ui.zipHelp')}</p>
          <p id="zip-note" aria-live="polite" className={outside ? 'note-warn' : 'note-ok'}>
            {outside ? t('ui.zipOutside') : zipInfo ? t('ui.zipArea', { city: zipInfo.city }) : ''}
          </p>
        </div>
        <div className="grid-2">
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
        </div>
      </section>

      <section className="card">
        <h2 className="card-title"><Wallet size={20} aria-hidden="true" /> {t('ui.moneyTitle')}</h2>
        <div className="field">
          <label htmlFor="income">{t('ui.income')}</label>
          <div className="money-input">
            <span aria-hidden="true">$</span>
            <input id="income" inputMode="decimal" autoComplete="off" placeholder={t('ui.incomePlaceholder')}
              value={h.monthlyIncome ?? ''} aria-describedby="income-help"
              onChange={(e) => set({ monthlyIncome: num(e.target.value.replace(/[$,\s]/g, '')) })} />
          </div>
          <p className="help" id="income-help">{t('ui.incomeHelp')}</p>
        </div>
        <label className="chip">
          <input type="checkbox" checked={!!h.hasEarnedIncome} onChange={(e) => set({ hasEarnedIncome: e.target.checked })} />
          <span>{t('ui.earned')}</span>
        </label>
        <fieldset className="chips">
          <legend>{t('ui.benefitsQ')}</legend>
          {BENEFITS.map((b) => (
            <label key={b} className="chip">
              <input type="checkbox" checked={!!h.benefits[b]}
                onChange={(e) => set({ benefits: { ...h.benefits, [b]: e.target.checked } })} />
              <span>{t(`benefits.${b}`)}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <section>
        <h2 className="section-title">{t('ui.peopleTitle')}</h2>
        <p className="help">{t('ui.peopleHelp')}</p>
        <ul className="people">
          {h.people.map((p, i) => (
            <PersonCard key={p.id} p={p} index={i} update={updatePerson(i)} canRemove={h.people.length > 1}
              remove={() => set({ people: h.people.filter((x) => x.id !== p.id) })} />
          ))}
        </ul>
        <button type="button" className="btn btn-soft" onClick={() => set({ people: [...h.people, newPerson()] })}>
          <Plus size={18} aria-hidden="true" /> {t('ui.addPerson')}
        </button>
      </section>

      <div className="action-bar">
        <button type="submit" className="btn btn-primary btn-lg">
          {t('ui.seeResults')} <ArrowRight size={20} aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}
