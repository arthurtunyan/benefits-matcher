// Rule linter. The build fails if any rule or table is missing a source, has
// bad dates, was not verified in the last 90 days, or names text that is
// missing from a translation.
import { describe, expect, it } from 'vitest'
import Ajv from 'ajv'
import schema from '../rules/program.schema.json'
import zips from '../rules/zips.json'
import { help, programs, tables } from '../src/data'
import type { Cond } from '../src/engine'
import { LOCALES, makeT } from '../src/i18n'

const MAX_AGE_DAYS = 90
const today = new Date().toISOString().slice(0, 10)
const daysSince = (d: string) => (Date.parse(today) - Date.parse(d)) / 86_400_000

const conds = (c: Cond): Cond[] =>
  'all' in c ? [c, ...c.all.flatMap(conds)] : 'any' in c ? [c, ...c.any.flatMap(conds)] : 'not' in c ? [c, ...conds(c.not)] : [c]

describe('schema', () => {
  const validate = new Ajv({ allErrors: true }).compile(schema)
  it.each(programs.map((p) => [p.id, p] as const))('%s matches rules/program.schema.json', (_, p) => {
    const ok = validate(p)
    expect(validate.errors ?? []).toEqual([])
    expect(ok).toBe(true)
  })
})

describe.each(programs.map((p) => [p.id, p] as const))('%s', (_, p) => {
  it('has unique rule ids', () => {
    const ids = programs.flatMap((x) => x.rules.map((r) => r.id))
    for (const r of p.rules) expect(ids.filter((i) => i === r.id)).toHaveLength(1)
  })
  it.each(p.rules.map((r) => [r.id, r] as const))('%s: source, dates, and recent verification', (_, r) => {
    expect(r.source).toMatch(/^https:\/\//)
    expect(r.effective.to === null || r.effective.from <= r.effective.to).toBe(true)
    expect(daysSince(r.lastVerified), `${r.id} last verified ${r.lastVerified}; re-check it`).toBeLessThanOrEqual(MAX_AGE_DAYS)
    expect(r.lastVerified <= today).toBe(true)
  })
  it('only references tables that exist', () => {
    const all = [p.audience, ...p.rules.flatMap((r) => [r.conditions, ...(r.notes ?? []).map((n) => n.when)])]
      .filter((c): c is Cond => !!c)
      .flatMap(conds)
    for (const c of all) {
      for (const v of Object.values(c)) {
        if (v && typeof v === 'object' && 'table' in v) expect(tables[(v as { table: string }).table], (v as { table: string }).table).toBeDefined()
      }
    }
    if (p.estimate && 'table' in p.estimate) expect(tables[p.estimate.table]).toBeDefined()
  })
})

describe('tables', () => {
  it.each(Object.entries(tables))('%s: sources, dates, no overlaps, sizes start at 1', (_, t) => {
    const vs = [...t.versions].sort((a, b) => a.effective.from.localeCompare(b.effective.from))
    vs.forEach((v, i) => {
      expect(v.source).toMatch(/^https:\/\//)
      expect(daysSince(v.lastVerified)).toBeLessThanOrEqual(MAX_AGE_DAYS)
      if (v.values.all === undefined) {
        const sizes = Object.keys(v.values).map(Number).sort((a, b) => a - b)
        expect(sizes).toEqual(sizes.map((_, j) => j + 1))
      }
      const next = vs[i + 1]
      if (next) expect(v.effective.to !== null && v.effective.to < next.effective.from).toBe(true)
    })
  })
})

describe('translations', () => {
  const flatKeys = (o: object, prefix = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
  const en = flatKeys(LOCALES.en)

  it.each(['es', 'hy'] as const)('%s has every English key', (lang) => {
    const keys = new Set(flatKeys(LOCALES[lang]))
    expect(en.filter((k) => !keys.has(k))).toEqual([])
  })
  it.each(['es', 'hy'] as const)('%s keeps every {placeholder}', (lang) => {
    const t = makeT(lang)
    const tEn = makeT('en')
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join()
    for (const k of en) expect(ph(t(k)), `${lang}: ${k}`).toBe(ph(tEn(k)))
  })

  const t = makeT('en')
  const used = programs.flatMap((p) => [
    `programs.${p.id}`, `where.${p.apply.where}`,
    ...p.documents.map((d) => `docs.${d}`),
    ...(p.alternatives ?? []).map((a) => `alt.${a}`),
    ...(p.estimate && 'text' in p.estimate ? [`values.${p.estimate.text}`] : []),
    ...p.rules.flatMap((r) => [`rules.${r.explain}`, ...(r.notes ?? []).map((n) => `notes.${n.key}`), ...(r.variant ? [`variants.${r.variant}`] : [])]),
  ])
  it.each([...new Set(used)])('%s exists', (key) => expect(t.has(key)).toBe(true))

  it('has a label for every condition in the rules', () => {
    for (const p of programs) {
      for (const r of p.rules) {
        for (const c of conds(r.conditions)) {
          if ('fact' in c) {
            const op = (['eq', 'ne', 'in', 'lt', 'lte', 'gt', 'gte'] as const).find((o) => c[o] !== undefined)!
            const v = c[op]
            const key = typeof v === 'boolean' ? `cond.${c.fact}.${v}` : `cond.${c.fact}.${op === 'in' ? 'eq' : op}`
            expect(t.has(key), `${r.id}: ${key}`).toBe(true)
          }
        }
      }
    }
  })
  it('has names for every help area and kind', () => {
    for (const h of help) {
      expect(t.has(`help.areas.${h.area}`), h.area).toBe(true)
      expect(t.has(`help.kinds.${h.kind}`), h.kind).toBe(true)
    }
  })
})

describe('zips', () => {
  it('uses known utility codes', () => {
    for (const [zip, v] of Object.entries(zips)) {
      if (zip.startsWith('_')) continue
      expect(zip).toMatch(/^\d{5}$/)
      expect([null, 'ladwp', 'sce', 'bwp', 'gwp', 'pwp']).toContain((v as { electric: string | null }).electric)
    }
  })
})
