import { useEffect, useMemo, useState } from 'react'
import { I18n, LANGS, makeT, type Lang, type T } from './i18n'
import { screen, type Household, type Person } from './engine'
import { lastFullCheck, programs, tables } from './data'
import Header from './components/Header'
import Start from './components/Start'
import HouseholdForm from './components/HouseholdForm'
import Results from './components/Results'
import Plan from './components/Plan'

export type View = 'start' | 'household' | 'results' | 'plan'

// The "as of" picker only offers dates our rules data covers.
export const MIN_DATE = '2025-10-01'
export const MAX_DATE = '2027-12-31'
export const todayISO = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local time

let nextId = 1
export const newPerson = (age?: number, name = ''): Person => ({ id: String(nextId++), name, age })

export const personLabel = (p: Person, i: number, t: T) =>
  p.name.trim() || (i === 0 ? t('ui.you') : t('ui.person', { n: i + 1 }))

const emptyHousehold = (): Household => ({ electric: 'unknown', gas: 'unknown', benefits: {}, people: [newPerson()] })

// The worked example from the project brief: a mother in North Hollywood with four children.
export const exampleHousehold = (): Household => ({
  zip: '91605', electric: 'ladwp', gas: 'socalgas', monthlyIncome: 0, benefits: {},
  people: [
    { ...newPerson(25, 'Maria'), status: 'undocumented' },
    newPerson(2, 'Sofia'), newPerson(4, 'Mateo'), newPerson(7, 'Lucas'), newPerson(10, 'Elena'),
  ],
})

function initialLang(): Lang {
  const l = navigator.language.slice(0, 2)
  return (LANGS as string[]).includes(l) ? (l as Lang) : 'en'
}

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  // Opening the page with #example jumps straight to the worked example (handy for demos).
  const demo = location.hash === '#example'
  const [view, setView] = useState<View>(demo ? 'results' : 'start')
  const [household, setHousehold] = useState<Household>(demo ? exampleHousehold : emptyHousehold)
  const [asOf, setAsOf] = useState(todayISO)
  const t = useMemo(() => makeT(lang), [lang])
  const screening = useMemo(() => screen(household, programs, tables, asOf), [household, asOf])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = `${t('ui.appName')} · ${t('ui.appPlace')}`
  }, [lang, t])

  // Move focus to the new screen's heading so screen readers announce it.
  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector<HTMLElement>('.view-heading')?.focus({ preventScroll: true })
  }, [view])

  const updatePerson = (p: Person) =>
    setHousehold((h) => ({ ...h, people: h.people.map((x) => (x.id === p.id ? p : x)) }))

  return (
    <I18n.Provider value={t}>
      <a className="skip" href="#main">{t('ui.skip')}</a>
      <Header view={view} setView={setView} setLang={setLang} canSee={household.people.length > 0} />
      <main id="main" className={`view view-${view}`}>
        {view === 'start' && (
          <Start setLang={setLang} onStart={() => setView('household')}
            onExample={() => { setHousehold(exampleHousehold()); setAsOf(todayISO()); setView('results') }} />
        )}
        {view === 'household' && <HouseholdForm household={household} setHousehold={setHousehold} onDone={() => setView('results')} />}
        {view === 'results' && (
          <Results screening={screening} asOf={asOf} setAsOf={setAsOf} updatePerson={updatePerson}
            onBack={() => setView('household')} onPlan={() => setView('plan')} />
        )}
        {view === 'plan' && <Plan screening={screening} today={todayISO()} onBack={() => setView('results')} />}
      </main>
      <footer className="footer no-print">
        <p>{t('ui.footerMade')}</p>
        <p>{t('ui.footerData', { date: t.date(lastFullCheck) })}</p>
      </footer>
    </I18n.Provider>
  )
}
