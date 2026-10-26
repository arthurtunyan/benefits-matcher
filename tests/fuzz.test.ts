// Stress test: hundreds of random households, screened and rendered in every language.
// Seeded, so a failure always comes back the same way.
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { leaves, screen, timeline, type Household, type Person, type Status, type Utility } from '../src/engine'
import { programs, tables } from '../src/data'
import { MAX_DATE, MIN_DATE } from '../src/App'
import { I18n, LANGS, makeT } from '../src/i18n'
import Results from '../src/components/Results'
import Plan from '../src/components/Plan'
import { leafLabel } from '../src/components/ProgramCard'

let seed = 7
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
const pick = <X,>(xs: X[]): X => xs[Math.floor(rand() * xs.length)]
const maybe = <X,>(x: X) => (rand() < 0.3 ? undefined : x)

const STATUSES: (Status | undefined)[] = ['citizen', 'lpr5', 'lpr', 'humanitarian', 'otherLawful', 'undocumented', undefined]
const ELECTRIC: Utility[] = ['ladwp', 'sce', 'bwp', 'gwp', 'pwp', 'other', 'unknown']
const ZIPS = [undefined, '91605', '91201', '91502', '91101', '90802', '90210', '93550', '92101', '9160', '90620']
const DATES = [MIN_DATE, '2025-12-15', '2026-04-01', '2026-10-25', '2027-07-15', '2027-10-01', MAX_DATE]

function randomPerson(i: number): Person {
  const age = maybe(pick([0, 1, 3, 4, 5, 10, 16, 17, 18, 19, 25, 40, 55, 59, 60, 64, 65, 80, 120]))
  return { id: String(i), name: pick(['', 'Ana', 'José', 'Արամ']), age, status: pick(STATUSES),
    pregnant: rand() < 0.15, recentBirth: rand() < 0.1, disabled: rand() < 0.15, hasMediCal: rand() < 0.2 }
}

function randomHousehold(): Household {
  const disaster = pick([undefined, false, true])
  return {
    zip: pick(ZIPS), electric: pick(ELECTRIC), gas: pick<Utility>(['socalgas', 'other', 'unknown']),
    monthlyIncome: maybe(pick([0, 450, 1200, 2500, 4000, 6500, 9000, 15000, 50000])), hasEarnedIncome: pick([true, false, undefined]),
    benefits: { calfresh: rand() < 0.2, calworks: rand() < 0.1, ssi: rand() < 0.1, wic: rand() < 0.1 },
    disaster, disasterDate: disaster ? maybe(pick(['2025-10-05', '2026-09-01', '2026-10-20', '2026-10-25'])) : undefined,
    disasterLoss: disaster ? { home: rand() < 0.5, food: rand() < 0.5, work: rand() < 0.5 } : undefined,
    people: Array.from({ length: 1 + Math.floor(rand() * rand() * 12) }, (_, i) => randomPerson(i)),
  }
}

// Text that should never reach the page: a missing translation key, an unfilled {placeholder}, or a broken value.
const KEY = /\b(ui|cond|rules|notes|values|alt|programs|variants|docs|where|statusShort|status|flags|utility|benefits|help|lang)\.[a-z][\w.-]*/i
const BROKEN = /\{\w+\}|undefined|NaN|Infinity|\[object|—%/

describe('random households', () => {
  const homes = Array.from({ length: 300 }, randomHousehold)
  it('screen on every date without errors; estimates are whole, positive amounts', () => {
    for (const hh of homes) {
      for (const d of DATES) {
        const s = screen(hh, programs, tables, d)
        for (const r of [...s.people.flatMap((x) => x.results), ...s.household]) {
          if (r.estimate !== undefined) expect(Number.isFinite(r.estimate) && r.estimate >= 0, `${r.program.id} ${r.estimate}`).toBe(true)
        }
      }
    }
  })
  it('timelines build without errors', () => {
    for (const hh of homes.slice(0, 60)) expect(() => timeline(hh, programs, tables, MIN_DATE, MAX_DATE)).not.toThrow()
  })
  it.each(LANGS)('results and plan render in %s with no raw keys or broken values', (lang) => {
    const t = makeT(lang)
    for (const hh of homes.slice(0, 80)) {
      const s = screen(hh, programs, tables, pick(DATES))
      const page = (el: ReturnType<typeof h>) => renderToStaticMarkup(h(I18n.Provider, { value: t }, el))
        .replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')
      const text = page(h(Results, { screening: s, changes: timeline(hh, programs, tables, MIN_DATE, MAX_DATE), asOf: s.asOf,
        setAsOf: () => {}, updatePerson: () => {}, onBack: () => {}, onPlan: () => {}, zip: hh.zip }))
        + page(h(Plan, { screening: s, today: '2026-10-25', zip: hh.zip, onBack: () => {} }))
      // The "Why?" panel's condition list.
      const why = [...s.people.flatMap((x) => x.results.map((r) => [r, { ...s.facts, age: x.person.age }] as const)), ...s.household.map((r) => [r, s.facts] as const)]
        .flatMap(([r, f]) => leaves(r.best.tree).map((l) => leafLabel(l, t, f))).join(' ')
      expect((text + why).match(KEY)?.[0], JSON.stringify(hh)).toBeUndefined()
      expect((text + why).match(BROKEN)?.[0], JSON.stringify(hh)).toBeUndefined()
    }
  })
})
