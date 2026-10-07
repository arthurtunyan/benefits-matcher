import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { evaluate, inLACounty, lookup, nearMiss, runProgram, screen, type Cond, type Program, type Tables } from '../src/engine'
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
    const tree = evaluate({ fact: 'i', lte: 100 }, { i: 105 }, T, '2026-03-01')
    expect(nearMiss(tree)?.over).toBe(5)
    expect(nearMiss(evaluate({ fact: 'i', lte: 100 }, { i: 150 }, T, '2026-03-01'))).toBeUndefined()
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
