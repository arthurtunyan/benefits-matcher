import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { changeDates, evaluate, inLACounty, lookup, nearMiss, runProgram, screen, timeline, type Cond, type Household, type LeafResult, type Program, type Tables } from '../src/engine'
import { exampleHousehold } from '../src/App'
import { programs, tables } from '../src/data'
import personas from './personas.json'

const T: Tables = {
  t: {
    id: 't', unit: 'month', description: '',
    versions: [
      { effective: { from: '2026-01-01', to: '2026-06-30' }, values: { '1': 100, '2': 200 }, each: 50, source: 'https://x', lastVerified: '2026-01-01' },
      { effective: { from: '2026-07-01', to: null }, values: { '1': 110, '2': 220 }, source: 'https://x', lastVerified: '2026-01-01' },
    ],
  },
}

describe('three-valued logic', () => {
  const ev = (c: Cond, facts: Record<string, number | string | boolean | undefined>) => evaluate(c, facts, T, '2026-03-01').result
  it('a skipped answer is unknown, not false', () => {
    expect(ev({ fact: 'age', gte: 19 }, {})).toBe('unknown')
  })
  it('all: any fail wins over unknown', () => {
    expect(ev({ all: [{ fact: 'a', eq: 1 }, { fact: 'b', eq: 1 }] }, { a: 2 })).toBe('fail')
    expect(ev({ all: [{ fact: 'a', eq: 1 }, { fact: 'b', eq: 1 }] }, { a: 1 })).toBe('unknown')
  })
  it('any: any pass wins over unknown', () => {
    expect(ev({ any: [{ fact: 'a', eq: 1 }, { fact: 'b', eq: 1 }] }, { a: 1 })).toBe('pass')
    expect(ev({ any: [{ fact: 'a', eq: 1 }, { fact: 'b', eq: 1 }] }, { a: 2 })).toBe('unknown')
  })
  it('not keeps unknown unknown', () => {
    expect(ev({ not: { fact: 'a', eq: 1 } }, {})).toBe('unknown')
    expect(ev({ not: { fact: 'a', eq: 1 } }, { a: 2 })).toBe('pass')
  })
  it('"unsure" values give unknown', () => {
    expect(ev({ fact: 's', in: ['x'], unsure: ['y'] }, { s: 'y' })).toBe('unknown')
  })
  it('a table with no version for the date gives unknown', () => {
    expect(evaluate({ fact: 'i', lte: { table: 't' } }, { i: 1, householdSize: 1 }, T, '2025-01-01').result).toBe('unknown')
  })
})

describe('dates our tables do not cover', () => {
  const G: Tables = { g: { id: 'g', unit: 'month', description: '', versions: [
    { effective: { from: '2026-01-01', to: '2026-12-31' }, values: { all: 100 }, source: 'https://x', lastVerified: '2026-01-01' },
  ] } }
  const ev = (op: string, i: number, asOf: string) => evaluate({ fact: 'i', [op]: { table: 'g' } } as Cond, { i }, G, asOf) as LeafResult
  it('after the last version: passing an upper limit is sure (limits only rise), failing it is not', () => {
    expect(ev('lte', 50, '2027-03-01')).toMatchObject({ result: 'pass', reason: 'nearData', expected: 100 })
    expect(ev('lt', 50, '2027-03-01').result).toBe('pass')
    expect(ev('lte', 150, '2027-03-01')).toMatchObject({ result: 'unknown', reason: 'noData' })
    expect(ev('gte', 50, '2027-03-01').result).toBe('fail') // under a lower bound that can only rise
    expect(ev('gte', 150, '2027-03-01').result).toBe('unknown')
  })
  it('before the first version: failing an upper limit is sure, passing it is not, and $0 passes any limit', () => {
    expect(ev('lte', 150, '2025-06-01').result).toBe('fail')
    expect(ev('lte', 50, '2025-06-01')).toMatchObject({ result: 'unknown', reason: 'noData' })
    expect(ev('lte', 0, '2025-06-01').result).toBe('pass')
    expect(ev('lt', 0, '2025-06-01').result).toBe('pass')
    expect(ev('gt', 150, '2025-06-01').result).toBe('pass')
    expect(ev('gte', 50, '2025-06-01').result).toBe('unknown')
  })
  it('never guesses an equality test or a missing household size', () => {
    expect(ev('eq', 100, '2027-03-01').result).toBe('unknown')
    expect(evaluate({ fact: 'i', lte: { table: 't' } }, { i: 1 }, T, '2025-01-01')).toMatchObject({ result: 'unknown', reason: 'missing' })
  })
  it('the example family keeps the same likely programs on the as-of presets, as the timeline says', () => {
    const h = exampleHousehold()
    const likely = (d: string) => {
      const s = screen(h, programs, tables, d)
      return [...new Set([...s.people.flatMap((x) => x.results), ...s.household].filter((r) => r.outcome === 'likely').map((r) => r.program.id))].sort()
    }
    const now = likely('2026-10-22')
    expect(now).toHaveLength(9)
    expect(likely('2027-07-15')).toEqual(now)
    expect(likely('2025-12-15')).toEqual(now)
    const moves = timeline(h, programs, tables, '2025-10-01', '2027-12-31').filter((c) => c.date > '2026-10-22' && c.date <= '2027-07-15')
    expect(moves).toEqual([])
  })
})

describe('dated tables', () => {
  it('picks the version in effect on the date', () => {
    expect(lookup(T, 't', 2, '2026-03-01')).toBe(200)
    expect(lookup(T, 't', 2, '2026-07-01')).toBe(220)
  })
  it('adds "each" above the largest size, else uses the largest', () => {
    expect(lookup(T, 't', 4, '2026-03-01')).toBe(300)
    expect(lookup(T, 't', 4, '2026-08-01')).toBe(220)
  })
})

describe('near misses', () => {
  it('flags income within 10% above a limit', () => {
    const tree = evaluate({ fact: 'monthlyIncome', lte: 100 }, { monthlyIncome: 105 }, T, '2026-03-01')
    expect(nearMiss(tree)?.over).toBe(5)
    expect(nearMiss(evaluate({ fact: 'monthlyIncome', lte: 100 }, { monthlyIncome: 150 }, T, '2026-03-01'))).toBeUndefined()
  })
  it('ignores limits that are not income (age, disaster deadlines)', () => {
    expect(nearMiss(evaluate({ fact: 'age', lt: 19 }, { age: 20 }, T, '2026-03-01'))).toBeUndefined()
    expect(nearMiss(evaluate({ fact: 'daysSinceDisaster', lte: 60 }, { daysSinceDisaster: 62 }, T, '2026-03-01'))).toBeUndefined()
  })
})

describe('programs', () => {
  const prog: Program = {
    id: 'p', name: 'P', category: 'food', appliesTo: 'person', apply: { url: 'https://x', where: 'w' }, documents: [],
    rules: [
      { id: 'best', variant: 'a', effective: { from: '2026-01-01', to: null }, conditions: { all: [{ fact: 'x', eq: true }, { fact: 'pregnant', eq: true }] }, explain: 'e', source: 'https://x', lastVerified: '2026-01-01', verifiedBy: 't' },
      { id: 'ok', variant: 'b', effective: { from: '2026-01-01', to: null }, conditions: { fact: 'x', eq: true }, explain: 'e', source: 'https://x', lastVerified: '2026-01-01', verifiedBy: 't' },
      { id: 'old', variant: 'c', effective: { from: '2020-01-01', to: '2020-12-31' }, conditions: { fact: 'x', eq: true }, explain: 'e', source: 'https://x', lastVerified: '2026-01-01', verifiedBy: 't' },
    ],
  }
  it('picks the best passing variant and names a one-answer upgrade', () => {
    const r = runProgram(prog, { x: true, pregnant: false }, T, '2026-03-01')!
    expect(r.outcome).toBe('likely')
    expect(r.best.rule.id).toBe('ok')
    expect(r.upgrades.map((u) => u.rule.id)).toEqual(['best'])
  })
  it('ignores rules outside their dates', () => {
    expect(runProgram({ ...prog, rules: [prog.rules[2]] }, { x: true }, T, '2026-03-01')).toBeNull()
  })
})

describe('LA County ZIP check', () => {
  it('knows the county from the ZIP only', () => {
    expect(inLACounty('91605')).toBe(true)
    expect(inLACounty('92101')).toBe(false)
    expect(inLACounty('91761')).toBe(false) // Ontario, San Bernardino County
    expect(inLACounty('93550')).toBe(true) // Palmdale
    expect(inLACounty('90630')).toBe(false) // Cypress, Orange County
    expect(inLACounty('90740')).toBe(false) // Seal Beach, Orange County
    expect(inLACounty('90638')).toBe(true) // La Mirada
    expect(inLACounty('93243')).toBe(true) // Gorman
    expect(inLACounty(undefined)).toBeUndefined()
  })
})

describe('privacy', () => {
  // Screening must never touch the network. Make any attempt throw.
  const boom = () => { throw new Error('network call during screening') }
  beforeAll(() => {
    vi.stubGlobal('fetch', boom)
    vi.stubGlobal('XMLHttpRequest', boom)
    vi.stubGlobal('WebSocket', boom)
    vi.stubGlobal('navigator', { sendBeacon: boom })
  })
  afterAll(() => vi.unstubAllGlobals())
  it('screens every persona without any network call', () => {
    for (const p of personas) {
      expect(() => screen({ electric: 'unknown', gas: 'unknown', benefits: {}, ...(p.household as object) } as never, programs, tables, p.asOf)).not.toThrow()
    }
  })
})

describe('timeline', () => {
  const maria = (p: Partial<Household['people'][number]> = {}): Household => ({
    zip: '91605', electric: 'ladwp', gas: 'socalgas', monthlyIncome: 0, benefits: {},
    people: [{ id: 'm', name: 'Maria', age: 25, status: 'undocumented', ...p }],
  })
  const run = (h: Household) => timeline(h, programs, tables, '2025-10-01', '2027-12-31')

  it('only checks days when a rule or table starts or stops', () => {
    const days = changeDates(programs, tables, '2025-10-01', '2027-12-31')
    expect(days).toContain('2026-01-01') // Medi-Cal enrollment freeze
    expect(days).toContain('2027-07-01') // restricted scope for humanitarian adults
    expect(days.every((d) => d > '2025-10-01' && d <= '2027-12-31')).toBe(true)
  })
  it('shows the 2026 Medi-Cal freeze for an undocumented adult who is not enrolled', () => {
    const mc = run(maria()).filter((c) => c.program.id === 'medi-cal')
    expect(mc).toHaveLength(1)
    expect(mc[0]).toMatchObject({ date: '2026-01-01', personId: 'm' })
    expect(mc[0].before?.best.rule.variant).toBe('full')
    expect(mc[0].after?.best.rule.variant).toBe('restricted')
  })
  it('keeps full scope for someone already enrolled, noting each new rule', () => {
    const mc = run(maria({ hasMediCal: true })).filter((c) => c.program.id === 'medi-cal')
    expect(mc.map((c) => [c.date, c.after?.best.rule.id])).toEqual([
      ['2026-01-01', 'medi-cal-adult-uis-enrolled'], ['2027-07-01', 'medi-cal-adult-uis-enrolled-2027'],
    ])
    expect(mc.every((c) => c.after?.best.rule.variant === 'full')).toBe(true)
  })
  it('ignores days where we only lack an income table', () => {
    // LifeLine's limit table starts 2026-06-01: before that the result is a data gap, not a rule change.
    expect(run(maria()).filter((c) => c.program.id === 'california-lifeline')).toEqual([])
  })
  it('shows the 2026 Child Tax Credit change for a parent with an ITIN', () => {
    const h: Household = { ...maria({ age: 35 }), monthlyIncome: 2500, hasEarnedIncome: true,
      people: [{ id: 'p', name: '', age: 35, status: 'undocumented' }, { id: 'k', name: '', age: 8, status: 'citizen' }] }
    const ctc = run(h).filter((c) => c.program.id === 'child-tax-credit')
    expect(ctc.map((c) => [c.date, c.before?.outcome, c.after?.outcome])).toEqual([['2026-01-01', 'likely', 'not']])
  })
  it("turns a family's disaster deadlines into dated changes", () => {
    const h: Household = { ...maria({ status: 'citizen' }), disaster: true, disasterDate: '2026-10-01', disasterLoss: { home: true, work: true } }
    const at = (id: string) => run(h).filter((c) => c.program.id === id).map((c) => [c.date, c.after?.outcome ?? 'hidden'])
    expect(at('dua')).toEqual([['2026-10-01', 'possibly'], ['2026-11-01', 'not']]) // 30 days to apply
    expect(at('fema-ia')).toEqual([['2026-10-01', 'possibly'], ['2027-01-30', 'not']]) // 60 days + 60 late
  })
  it('a refugee adult loses full scope Medi-Cal in July 2027', () => {
    const mc = run(maria({ status: 'humanitarian' })).filter((c) => c.program.id === 'medi-cal')
    expect(mc.at(-1)).toMatchObject({ date: '2027-07-01' })
    expect(mc.at(-1)?.after?.best.rule.variant).toBe('restricted')
  })
})
