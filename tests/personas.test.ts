// Persona answer key: each household's expected results come from the cited
// official source, not from the code. If a rule edit changes an answer, this fails.
import { describe, expect, it } from 'vitest'
import { nearMiss, screen, type Household, type Person, type ProgramResult } from '../src/engine'
import { programs, tables } from '../src/data'
import personas from './personas.json'

interface Persona {
  id: string; title: string; source: string; asOf: string
  household: Partial<Household> & { people: Person[] }
  expect: Record<string, Record<string, string>>
  nearMiss?: Record<string, string[]>
}

const describeResult = (r?: ProgramResult) =>
  !r ? 'hidden' : r.best.rule.variant ? `${r.outcome}:${r.best.rule.variant}` : r.outcome

describe.each(personas as unknown as Persona[])('$id — $title', (p) => {
  const h: Household = { electric: 'unknown', gas: 'unknown', benefits: {}, ...p.household }
  const s = screen(h, programs, tables, p.asOf)
  const resultsFor = (who: string) =>
    who === 'household' ? s.household : s.people.find((x) => x.person.id === who)!.results

  it('cites a source', () => expect(p.source.length).toBeGreaterThan(5))

  for (const [who, programsExpected] of Object.entries(p.expect)) {
    for (const [programId, want] of Object.entries(programsExpected)) {
      it(`${who}: ${programId} → ${want}`, () => {
        const r = resultsFor(who).find((x) => x.program.id === programId)
        const got = describeResult(r)
        // "likely" alone matches any variant; "likely:full" must match exactly.
        expect(want.includes(':') ? got : got.split(':')[0]).toBe(want)
      })
    }
  }

  for (const [who, ids] of Object.entries(p.nearMiss ?? {})) {
    for (const id of ids) {
      it(`${who}: ${id} is flagged as a near miss`, () => {
        const r = resultsFor(who).find((x) => x.program.id === id)!
        expect(nearMiss(r.best.tree)).toBeDefined()
      })
    }
  }
})

it('has at least 30 personas', () => expect(personas.length).toBeGreaterThanOrEqual(30))
