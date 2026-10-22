// Edge cases: odd input, very small and very large homes, deadline days, date limits, and every language.
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { inLACounty, leaves, lookup, screen, timeline, type Household, type Person, type ProgramResult } from '../src/engine'
import { programs, tables } from '../src/data'
import { exampleHousehold, MAX_DATE, MIN_DATE } from '../src/App'
import { LOCALES, makeT, type Lang } from '../src/i18n'
import HouseholdForm, { num, parseMoney, withAge, zipAnswer } from '../src/components/HouseholdForm'
import ProgramCard from '../src/components/ProgramCard'
import { Deadlines } from '../src/components/Results'

const home = (x: Partial<Household> = {}): Household => ({ electric: 'unknown', gas: 'unknown', benefits: {}, people: [], ...x })
const person = (id: string, x: Partial<Person> = {}): Person => ({ id, name: '', ...x })
const ASOF = '2026-10-22'
const t = makeT('en')
const html = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')

describe('money typed in the income box', () => {
  it.each([
    ['1,500.50', 1500.5], ['$2,000', 2000], [' 0 ', 0], ['1500.', 1500], ['.5', 0.5], ['99999999999', 99999999999],
    ['-5', undefined], ['abc', undefined], ['', undefined], ['   ', undefined], ['1e6', undefined], ['Infinity', undefined],
    ['0x10', undefined], ['1.2.3', undefined], ['$', undefined],
  ] as const)('%j → %s', (typed, want) => expect(parseMoney(typed)).toBe(want))

  it('a household making $99,999,999,999 a month gets no means-tested program (full-price Covered California is for anyone)', () => {
    const s = screen(home({ zip: '91605', electric: 'ladwp', gas: 'socalgas', monthlyIncome: 99999999999,
      people: [person('a', { age: 40, status: 'citizen' }), person('k', { age: 3, status: 'citizen' })] }), programs, tables, ASOF)
    const likely = [...s.people.flatMap((x) => x.results), ...s.household].filter((r) => r.outcome === 'likely' && r.program.category !== 'tax' && r.best.rule.variant !== 'fullPrice')
    expect(likely.map((r) => r.program.id)).toEqual([])
  })
  it.each([true, false, undefined])('a $1,000,000-a-month home (job answer %s) gets no tax credit and no tax money', (job) => {
    const s = screen(home({ zip: '91601', monthlyIncome: 1000000, hasEarnedIncome: job,
      people: [40, 38, 17, 15, 12, 9, 6, 3, 1, 70].map((age, i) => person(String(i), { age })) }), programs, tables, ASOF)
    const tax = s.household.filter((r) => r.program.category === 'tax')
    expect(tax.filter((r) => r.outcome !== 'not').map((r) => r.program.id)).toEqual([])
    expect(tax.filter((r) => r.estimate !== undefined)).toEqual([])
  })
})

describe('ZIP typed in the ZIP box', () => {
  it('keeps digits only, at most five', () => {
    expect(zipAnswer('9a1b6c05').zip).toBe('91605')
    expect(zipAnswer(' 916 05 ').zip).toBe('91605')
    expect(zipAnswer('916051').zip).toBe('91605')
    expect(zipAnswer('abc').zip).toBeUndefined()
    expect(zipAnswer('').zip).toBeUndefined()
  })
  it('pre-fills utilities only for a full LA County ZIP', () => {
    expect(zipAnswer('91605')).toMatchObject({ electric: 'ladwp', gas: 'socalgas' })
    expect(zipAnswer('9160')).toEqual({ zip: '9160' })
    expect(zipAnswer('92101')).toEqual({ zip: '92101' }) // San Diego
    expect(inLACounty('9160')).toBeUndefined()
    expect(inLACounty('92101')).toBe(false)
  })
  it('Long Beach (908xx) gets its own gas company', () => {
    expect(zipAnswer('90802')).toMatchObject({ gas: 'other', gasOther: 'Long Beach Utilities' })
  })
  it('a 4-digit ZIP counts as not answered (LA County assumed); a ZIP outside the county hides LA-only programs', () => {
    const life = (zip: string) => screen(home({ zip, monthlyIncome: 0, people: [person('a', { age: 30, status: 'citizen' })] }), programs, tables, ASOF)
      .household.find((r) => r.program.id === 'metro-life')?.outcome
    expect(life('9160')).toBe(life(''))
    expect(life('92101')).toBeUndefined()
  })
})

describe('ages', () => {
  const p = person('p', { age: 30, pregnant: true, recentBirth: true })
  it.each([['0', 0], ['120', 120], ['2.5', 2.5], ['', undefined], ['-1', undefined], ['1e2', undefined]] as const)('%j → %s', (typed, want) => {
    expect(num(typed)).toBe(want)
    expect(withAge(p, typed).age).toBe(want)
  })
  it('an age over 120 counts as not answered', () => {
    for (const a of ['121', '150', '999']) expect(withAge(p, a).age).toBeUndefined()
  })
  it('drops pregnancy answers when the age leaves 10-55, keeps them otherwise', () => {
    for (const a of ['70', '9', '56']) expect(withAge(p, a)).toMatchObject({ pregnant: undefined, recentBirth: undefined })
    for (const a of ['', '10', '55', '30']) expect(withAge(p, a)).toMatchObject({ pregnant: true, recentBirth: true })
  })
  it('a newborn (age 0) is a child and a 120-year-old screens fine', () => {
    const s = screen(home({ zip: '91605', monthlyIncome: 0, people: [person('m', { age: 30, status: 'citizen' }), person('b', { age: 0, status: 'citizen' }), person('g', { age: 120, status: 'citizen' })] }), programs, tables, ASOF)
    const of = (id: string, prog: string) => s.people.find((x) => x.person.id === id)!.results.find((r) => r.program.id === prog)
    expect(of('b', 'medi-cal')?.best.rule.id).toBe('medi-cal-child')
    expect(of('b', 'wic')?.outcome).toBe('likely')
    expect(of('g', 'medi-cal')?.outcome).toBe('likely')
  })
})

describe('household size', () => {
  const big = (n: number) => home({ zip: '91605', electric: 'ladwp', gas: 'socalgas', monthlyIncome: 3000,
    people: Array.from({ length: n }, (_, i) => person(String(i), { age: i === 0 ? 40 : i, status: 'citizen' })) })
  it.each([1, 12, 13, 20])('%i people screen without errors and every person gets results', (n) => {
    const s = screen(big(n), programs, tables, ASOF)
    expect(s.people).toHaveLength(n)
    for (const x of s.people) expect(x.results.length).toBeGreaterThan(0)
    expect(() => timeline(big(n), programs, tables, MIN_DATE, MAX_DATE)).not.toThrow()
  })
  it('size-based limits keep growing past the largest listed size where the source gives a per-person amount', () => {
    for (const [id, tb] of Object.entries(tables)) {
      for (const v of tb.versions) {
        if (v.values.all !== undefined || v.each === undefined) continue
        const d = v.effective.from
        expect(lookup(tables, id, 12, d)!, id).toBeGreaterThan(lookup(tables, id, 8, d)!)
        expect(lookup(tables, id, 13, d)! - lookup(tables, id, 12, d)!, id).toBe(v.each)
      }
    }
  })
  it.todo('calworks-mbsac / calworks-map / cspp-monthly: no "each additional person" amount, so 11+ people reuse the largest size (needs a verified source)')
})

describe('disaster dates', () => {
  const day = (n: number) => new Date(Date.parse(`${ASOF}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10)
  const hit = (ago: number) => screen(home({ zip: '91605', disaster: true, disasterDate: day(ago), disasterLoss: { home: true, work: true },
    people: [person('a', { age: 40, status: 'citizen' })] }), programs, tables, ASOF)
  const fema = (ago: number) => {
    const r = hit(ago).household.find((x) => x.program.id === 'fema-ia')
    return r ? `${r.outcome}:${r.best.rule.id}` : 'hidden'
  }
  it.each([
    [0, 'possibly:fema-ia-on-time'], [59, 'possibly:fema-ia-on-time'], [60, 'possibly:fema-ia-on-time'],
    [61, 'possibly:fema-ia-late'], [120, 'possibly:fema-ia-late'], [121, 'not:fema-ia-on-time'], [-1, 'hidden'],
  ])('FEMA %i days after the disaster → %s', (ago, want) => expect(fema(ago)).toBe(want))
  it('a future date hides all disaster help (the form warns about it)', () => {
    expect(hit(-30).household.filter((r) => r.program.category === 'disaster')).toEqual([])
  })
  const deadlines = (ago: number) => {
    const s = hit(ago)
    return html(renderToStaticMarkup(h(Deadlines, { results: s.household.filter((r) => r.program.category === 'disaster'), facts: s.facts })))
  }
  it('after 120 days, FEMA shows its 120-day late date as passed, not the 60-day date', () => {
    const text = deadlines(130)
    expect(text).toContain(`FEMA Individual Assistance by about ${t.date(day(130 - 120))}`)
    expect(text).not.toContain(t.date(day(130 - 60)))
  })
  it('between 61 and 120 days, FEMA counts down to the late date', () => {
    expect(deadlines(61)).toContain(`FEMA Individual Assistance by about ${t.date(day(61 - 120))}`)
    expect(deadlines(61)).toContain(t('ui.daysLeft', { n: '59' }))
  })
})

describe('"as of" dates', () => {
  const ex = exampleHousehold()
  it.each([MIN_DATE, MAX_DATE])('%s: the example family has no data gaps', (d) => {
    const s = screen(ex, programs, tables, d)
    const gaps = [...s.people.flatMap((x) => x.results), ...s.household].filter((r) => leaves(r.best.tree).some((l) => l.reason === 'noData'))
    expect(gaps.map((r) => r.program.id)).toEqual([])
  })
  it.each(['2020-01-01', '2024-12-31', '2030-01-01'])('%s (outside the picker) still screens without errors', (d) => {
    const s = screen(ex, programs, tables, d)
    for (const r of [...s.people.flatMap((x) => x.results), ...s.household]) expect(['likely', 'possibly', 'not']).toContain(r.outcome)
  })
})

describe('translations', () => {
  const flat = (o: object, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]))
  const en = new Set(flat(LOCALES.en))
  it.each(['es', 'hy'] as const)('%s has no keys English lacks', (lang) => {
    expect(flat(LOCALES[lang]).filter((k) => !en.has(k))).toEqual([])
  })
  it.each(['es', 'hy'] as const)('%s keeps the same *emphasis* marks as English', (lang) => {
    const tl = makeT(lang)
    const stars = (s: string) => (s.match(/\*/g) ?? []).length
    for (const k of en) expect(stars(tl(k)), `${lang}: ${k}`).toBe(stars(t(k)))
  })
})

describe('dates and money in every language', () => {
  afterEach(() => vi.restoreAllMocks())
  it('formats dates in each language', () => {
    expect(makeT('en').date('2026-12-09')).toBe('December 9, 2026')
    expect(makeT('es').date('2026-12-09')).toBe('9 de diciembre de 2026')
    expect(makeT('hy').date('2026-12-09')).toMatch(/^0?9 դեկտեմբերի, 2026 թ\.$/)
  })
  it('spells Armenian months itself when the browser has no Armenian date data (Chrome)', () => {
    const native = (lang: Lang, iso: string) => makeT(lang).date(iso)
    const want = Object.fromEntries((['en', 'es', 'hy'] as Lang[]).map((l) => [l, Array.from({ length: 12 }, (_, m) => native(l, `2026-${String(m + 1).padStart(2, '0')}-09`))]))
    vi.spyOn(Intl.DateTimeFormat, 'supportedLocalesOf').mockReturnValue([])
    for (const l of ['en', 'es', 'hy'] as Lang[]) {
      const ours = Array.from({ length: 12 }, (_, m) => makeT(l).date(`2026-${String(m + 1).padStart(2, '0')}-09`))
      expect(ours, l).toEqual(want[l].map((s) => s.replace(/^0/, '')))
    }
    expect(makeT('hy').date('2026-01-31')).toBe('31 հունվարի, 2026 թ.')
    expect(makeT('hy').date('2026-01-31')).not.toMatch(/[A-Za-z]/)
  })
  it('formats money in each language', () => {
    expect(makeT('en').money(1500.5)).toBe('$1,500.50')
    expect(makeT('en').money(2000)).toBe('$2,000')
    expect(makeT('en').money(0)).toBe('$0')
    expect(makeT('es').money(1500.5)).toBe('$1,500.50')
    expect(makeT('hy').money(1500.5)).toMatch(/1[\s, ]?500[.,]50/)
  })
})

// Results text from bug reports B7, B8 and the "could get … if" hint.
describe('results wording', () => {
  const card = (r: ProgramResult, facts: Record<string, unknown>) => html(renderToStaticMarkup(h(ProgramCard, { r, facts: facts as never })))
  it('B7: skipping everything lists the skipped questions, not an "or" chain', () => {
    const s = screen(home({ zip: '92101', people: [person('a')] }), programs, tables, ASOF)
    const texts = [...s.people.flatMap((x) => x.results.map((r) => card(r, { ...s.facts, age: x.person.age }))), ...s.household.map((r) => card(r, s.facts))]
    for (const text of texts) {
      const line = text.match(/Depends on[^.]*?(?=Why|$)/)?.[0] ?? ''
      expect(line.split(' or ').length, line).toBeLessThanOrEqual(2)
    }
    const cc = s.people[0].results.find((r) => r.program.id === 'covered-california')!
    expect(card(cc, s.facts)).toContain('Depends on answers you left out: immigration status, age, household income')
  })
  it('B5: a limit that depends on an unknown number of children shows its range, never "—"', () => {
    const s = screen(home({ zip: '91605', monthlyIncome: 2000, hasEarnedIncome: true, people: [person('a', { age: 30, status: 'citizen' }), person('k', { age: 3 })] }), programs, tables, ASOF)
    const eitc = s.household.find((r) => r.program.id === 'federal-eitc')!
    expect(eitc.outcome).toBe('possibly')
    const leaf = leaves(eitc.best.tree).find((l) => l.leaf.fact === 'annualIncome')!
    expect(leaf.range).toEqual([19104, 61555])
    const text = renderToStaticMarkup(h(ProgramCard, { r: eitc, facts: s.facts }))
    expect(text).not.toContain('—')
  })
  it('B11: EITC is only possibly when an adult has no SSN, with the filer note', () => {
    const s = screen(home({ zip: '91205', monthlyIncome: 1500.5, hasEarnedIncome: true, people: [
      person('ana', { age: 34, status: 'undocumented' }), person('leo', { age: 0, status: 'citizen' }), person('abuelo', { age: 99, status: 'lpr5', disabled: true })] }), programs, tables, ASOF)
    const eitc = s.household.find((r) => r.program.id === 'federal-eitc')!
    expect(eitc.outcome).toBe('possibly')
    expect(card(eitc, s.facts)).toContain(t('notes.tax.filerSsn'))
  })
  it('the full-scope Medi-Cal hint reads as a sentence', () => {
    const s = screen(home({ zip: '91605', monthlyIncome: 0, people: [person('m', { age: 25, status: 'undocumented' })] }), programs, tables, ASOF)
    const mc = s.people[0].results.find((r) => r.program.id === 'medi-cal')!
    expect(card(mc, { ...s.facts, age: 25 })).toContain('Could get Full-scope Medi-Cal (all services) if they are pregnant or they had a baby in the last 12 months.')
  })
})

describe('the questions', () => {
  const form = (x: Household) => html(renderToStaticMarkup(h(HouseholdForm, { household: x, setHousehold: () => {}, onDone: () => {} })))
  const full = home({ zip: '91605', electric: 'ladwp', gas: 'socalgas', monthlyIncome: 0, benefits: { none: true }, disaster: false,
    people: [person('a', { age: 30 }), person('b', { age: 5 }), person('c', { age: 2 })] })
  it('B8: "No, none of these" is remembered, so every part is done', () => {
    expect(form(full)).toContain('9 of 9 done')
    expect(form({ ...full, benefits: {} })).toContain('8 of 9 done')
  })
  it('editing answers opens at the first unanswered question, or the ZIP when all are answered', () => {
    expect(form({ ...full, benefits: {} })).toContain(t('ui.benefitsQ'))
    expect(form({ ...full, people: [...full.people, person('d')] })).toContain(t('ui.person', { n: 4 }))
    expect(form(full)).toContain(t('ui.qZip'))
  })
})
