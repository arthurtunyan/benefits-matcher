import { useEffect, useMemo, useRef, useState } from 'react'
import { I18n, LANGS, makeT, type Lang, type T } from './i18n'
import { screen, timeline, type Household, type Person } from './engine'
import { lastFullCheck, programs, rulesDraft, tables } from './data'
import Header, { Logo } from './components/Header'
import Start from './components/Start'
import HouseholdForm from './components/HouseholdForm'
import Results from './components/Results'
import Plan from './components/Plan'
import Legal from './components/Legal'

export type View = 'start' | 'household' | 'results' | 'plan' | 'privacy' | 'terms'

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
  const isExample = useRef(demo) // "Check my family" after the example starts from a blank home, not Maria's
  // The example as loaded. Any edit makes a new household object, which hides the "example family" banner.
  const example = useRef(demo ? household : undefined)
  // Each screen is a browser history entry, so the phone's Back gesture moves between screens instead of leaving.
  // `depth` lets Quick exit step back over these entries (see quickExit).
  const go = (v: View) => {
    if (v === view) return
    history.pushState({ view: v, depth: (history.state?.depth ?? 0) + 1 }, '')
    setView(v)
  }
  useEffect(() => {
    history.replaceState({ view, depth: 0 }, '')
    const onPop = (e: PopStateEvent) => e.state?.view && setView(e.state.view)
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [asOf, setAsOf] = useState(todayISO)
  const t = useMemo(() => makeT(lang), [lang])
  const screening = useMemo(() => screen(household, programs, tables, asOf), [household, asOf])
  // Only Results shows the timeline; skipping it elsewhere keeps typing on the questions fast.
  const changes = useMemo(() => (view === 'results' ? timeline(household, programs, tables, MIN_DATE, MAX_DATE) : []), [household, view])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = `${t('ui.appName')} · ${t('ui.appPlace')}`
  }, [lang, t])

  // Move focus to the new screen's heading so screen readers announce it.
  // Not on first load: there the first Tab should reach the skip link and Quick exit.
  const shownView = useRef(view)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (shownView.current === view) return
    shownView.current = view
    document.querySelector<HTMLElement>('.view-heading')?.focus({ preventScroll: true })
  }, [view])

  const updatePerson = (p: Person) =>
    setHousehold((h) => ({ ...h, people: h.people.map((x) => (x.id === p.id ? p : x)) }))

  return (
    <I18n.Provider value={t}>
      {/* No hash change: a #main history entry would break Quick exit's step back over this app's screens. */}
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.querySelector<HTMLElement>('.view-heading')?.focus() }}>{t('ui.skip')}</a>
      <Header view={view} setView={go} setLang={setLang} canSee={household.people.length > 0} />
      <main id="main" className={`view view-${view}`}>
        {view === 'start' && (
          <Start setLang={setLang}
            onStart={() => { if (isExample.current) { setHousehold(emptyHousehold()); isExample.current = false } go('household') }}
            onExample={() => { const ex = exampleHousehold(); example.current = ex; setHousehold(ex); isExample.current = true; setAsOf(todayISO()); go('results') }} />
        )}
        {view === 'household' && <HouseholdForm household={household} setHousehold={setHousehold} onDone={() => go('results')} />}
        {view === 'results' && (
          <Results screening={screening} changes={changes} asOf={asOf} setAsOf={setAsOf} updatePerson={updatePerson}
            onBack={() => go('household')} onPlan={() => go('plan')} zip={household.zip} example={household === example.current}
            onNew={() => { setHousehold(emptyHousehold()); isExample.current = false; go('household') }} />
        )}
        {(view === 'privacy' || view === 'terms') && <Legal page={view} />}
        {view === 'plan' && <Plan screening={screening} today={todayISO()} zip={household.zip} onBack={() => go('results')} />}
      </main>
      <footer className="footer no-print">
        <div className="footer-inner">
          <p className="footer-brand"><Logo size={28} /> {t('ui.appName')}</p>
          <p>{t('ui.footerMade')}</p>
          <p>{rulesDraft ? t('ui.footerDraft') : t('ui.footerData', { date: t.date(lastFullCheck) })}</p>
          <nav className="footer-links" aria-label={t('ui.footerLinks')}>
            <button type="button" className="link-btn" onClick={() => go('privacy')}>{t('ui.privacyLink')}</button>
            <button type="button" className="link-btn" onClick={() => go('terms')}>{t('ui.termsLink')}</button>
          </nav>
        </div>
      </footer>
    </I18n.Provider>
  )
}
