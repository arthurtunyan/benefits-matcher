// The rules engine. Pure functions, no I/O: given a household, a date, and the
// rules data, it returns per-person results. Everything runs on the device.

export type Status = 'citizen' | 'lpr5' | 'lpr' | 'humanitarian' | 'otherLawful' | 'undocumented'
export type Utility = 'ladwp' | 'sce' | 'bwp' | 'gwp' | 'pwp' | 'socalgas' | 'other' | 'unknown'

export interface Person {
  id: string
  name: string
  age?: number
  status?: Status // undefined = "prefer not to say"
  pregnant?: boolean
  recentBirth?: boolean // gave birth in the last 12 months
  disabled?: boolean // disability or blindness
  hasMediCal?: boolean // has Medi-Cal right now
}

export interface Household {
  zip?: string
  electric: Utility
  gas: Utility
  electricOther?: string // company name typed in when electric is 'other' (display only)
  gasOther?: string // same for gas
  monthlyIncome?: number // gross, whole household; undefined = skipped
  hasEarnedIncome?: boolean
  benefits: { calfresh?: boolean; calworks?: boolean; ssi?: boolean; wic?: boolean }
  people: Person[]
}

// ---- Rules data shapes (validated by rules/program.schema.json) ----

export type Scalar = number | string | boolean
export interface TableRef { table: string; by?: string }
export type Value = Scalar | TableRef

export interface Leaf {
  fact: string
  eq?: Value; ne?: Value; in?: Scalar[]
  lt?: Value; lte?: Value; gt?: Value; gte?: Value
  unsure?: Scalar[] // values that make this condition "unknown" instead of pass/fail
}
export type Cond = Leaf | { all: Cond[] } | { any: Cond[] } | { not: Cond }

export interface DateRange { from: string; to: string | null }
export interface Note { key: string; when?: Cond }

export interface Rule {
  id: string
  variant?: string
  effective: DateRange
  conditions: Cond
  outcome?: 'possibly' // cap: even when every condition passes, only "possibly"
  explain: string
  notes?: Note[]
  source: string
  lastVerified: string
  verifiedBy: string
}

export interface Program {
  id: string
  name: string
  category: 'health' | 'food' | 'cash' | 'family' | 'utility' | 'transit'
  appliesTo: 'person' | 'household'
  audience?: Cond // who the program is relevant to; hidden when this fails
  apply: { url: string; phone?: string; where: string }
  documents: string[]
  alternatives?: string[]
  estimate?: { table: string; by?: string } | { text: string }
  rules: Rule[]
}

export interface TableVersion {
  effective: DateRange
  values: Record<string, number>
  each?: number // added per person above the largest listed size
  source: string
  lastVerified: string
}
export interface Table { id: string; unit: 'month' | 'year' | 'percent'; description: string; versions: TableVersion[] }
export type Tables = Record<string, Table>

// ---- Evaluation ----

export type Tri = 'pass' | 'fail' | 'unknown'
export type Outcome = 'likely' | 'possibly' | 'not'
export type Facts = Record<string, Scalar | undefined>

export interface LeafResult {
  kind: 'leaf'
  leaf: Leaf
  op: 'eq' | 'ne' | 'in' | 'lt' | 'lte' | 'gt' | 'gte'
  expected?: Scalar | Scalar[]
  actual?: Scalar
  result: Tri
  reason?: 'missing' | 'unsure' | 'noData'
  over?: number // for failed upper limits: how far above the limit
}
export interface GroupResult { kind: 'all' | 'any' | 'not'; result: Tri; children: CondResult[] }
export type CondResult = LeafResult | GroupResult

export interface RuleResult { rule: Rule; result: Tri; tree: CondResult; blockers: CondResult[]; notes: string[] }
export interface ProgramResult {
  program: Program
  outcome: Outcome
  best: RuleResult
  upgrades: RuleResult[] // better variants that are one changeable answer away
  estimate?: number
}

// Facts a family can change or report differently; used for "what would change it".
const CHANGEABLE = new Set([
  'pregnant', 'recentBirth', 'disabled', 'monthlyIncome', 'annualIncome', 'incomePctFPL',
  'calworksIncome', 'getsCalFresh', 'getsCalWORKs', 'getsSSI', 'getsWIC', 'anyoneHasMediCal',
])
export const NEAR_MISS_MARGIN = 0.1 // within 10% above a limit counts as a near miss

export const inRange = (r: DateRange, d: string) => r.from <= d && (r.to === null || d <= r.to)

export function lookup(tables: Tables, id: string, size: number | undefined, asOf: string): number | undefined {
  const v = tables[id]?.versions.find((x) => inRange(x.effective, asOf))
  if (!v) return undefined
  if (v.values.all !== undefined) return v.values.all
  if (size === undefined) return undefined
  const sizes = Object.keys(v.values).map(Number)
  const max = Math.max(...sizes)
  if (size <= max) return v.values[String(Math.max(size, Math.min(...sizes)))]
  return v.values[String(max)] + (v.each ?? 0) * (size - max)
}

function isTable(v: unknown): v is TableRef {
  return typeof v === 'object' && v !== null && 'table' in v
}

function evalLeaf(leaf: Leaf, facts: Facts, tables: Tables, asOf: string): LeafResult {
  const op = (['eq', 'ne', 'in', 'lt', 'lte', 'gt', 'gte'] as const).find((k) => leaf[k] !== undefined)!
  const raw = leaf[op] as Value | Scalar[]
  let expected: Scalar | Scalar[] | undefined
  if (isTable(raw)) {
    const size = facts[raw.by ?? 'householdSize']
    expected = lookup(tables, raw.table, typeof size === 'number' ? size : undefined, asOf)
  } else expected = raw
  const actual = facts[leaf.fact]
  const base = { kind: 'leaf' as const, leaf, op, expected, actual }
  if (actual === undefined) return { ...base, result: 'unknown', reason: 'missing' }
  if (leaf.unsure?.includes(actual)) return { ...base, result: 'unknown', reason: 'unsure' }
  if (expected === undefined) return { ...base, result: 'unknown', reason: 'noData' }
  let ok: boolean
  switch (op) {
    case 'eq': ok = actual === expected; break
    case 'ne': ok = actual !== expected; break
    case 'in': ok = (expected as Scalar[]).includes(actual); break
    case 'lt': ok = actual < (expected as Scalar); break
    case 'lte': ok = actual <= (expected as Scalar); break
    case 'gt': ok = actual > (expected as Scalar); break
    case 'gte': ok = actual >= (expected as Scalar); break
  }
  const res: LeafResult = { ...base, result: ok ? 'pass' : 'fail' }
  if (!ok && (op === 'lt' || op === 'lte') && typeof actual === 'number' && typeof expected === 'number') {
    res.over = actual - expected
  }
  return res
}

export function evaluate(c: Cond, facts: Facts, tables: Tables, asOf: string): CondResult {
  if ('all' in c || 'any' in c) {
    const kind = 'all' in c ? 'all' : 'any'
    const children = ('all' in c ? c.all : c.any).map((x) => evaluate(x, facts, tables, asOf))
    const rs = children.map((x) => x.result)
    const [win, lose] = kind === 'all' ? (['pass', 'fail'] as const) : (['fail', 'pass'] as const)
    // all: any fail -> fail. any: any pass -> pass. Otherwise unknown beats the default.
    const result: Tri = rs.includes(lose) ? lose : rs.includes('unknown') ? 'unknown' : win
    return { kind, result, children }
  }
  if ('not' in c) {
    const inner = evaluate(c.not, facts, tables, asOf)
    const result: Tri = inner.result === 'pass' ? 'fail' : inner.result === 'fail' ? 'pass' : 'unknown'
    return { kind: 'not', result, children: [inner] }
  }
  return evalLeaf(c, facts, tables, asOf)
}

// The top-level items that stop a rule from passing (failed or unknown).
function blockersOf(tree: CondResult): CondResult[] {
  if (tree.result === 'pass') return []
  if (tree.kind === 'all') return tree.children.filter((c) => c.result !== 'pass')
  return [tree]
}

export function leaves(c: CondResult): LeafResult[] {
  return c.kind === 'leaf' ? [c] : c.children.flatMap(leaves)
}

export const isChangeable = (c: CondResult) => leaves(c).some((l) => CHANGEABLE.has(l.leaf.fact))

export function nearMiss(c: CondResult): LeafResult | undefined {
  return leaves(c).find((l) => l.over !== undefined && l.over > 0 && l.over <= Number(l.expected) * NEAR_MISS_MARGIN)
}

function runRule(rule: Rule, facts: Facts, tables: Tables, asOf: string): RuleResult {
  const tree = evaluate(rule.conditions, facts, tables, asOf)
  const notes = (rule.notes ?? [])
    .filter((n) => !n.when || evaluate(n.when, facts, tables, asOf).result === 'pass')
    .map((n) => n.key)
  return { rule, result: tree.result, tree, blockers: blockersOf(tree), notes }
}

const RANK: Record<Tri, number> = { pass: 0, unknown: 1, fail: 2 }

export function runProgram(program: Program, facts: Facts, tables: Tables, asOf: string): ProgramResult | null {
  if (program.audience && evaluate(program.audience, facts, tables, asOf).result === 'fail') return null
  const results = program.rules
    .filter((r) => inRange(r.effective, asOf))
    .map((r) => runRule(r, facts, tables, asOf))
  if (results.length === 0) return null // program not in effect on this date
  // Rules are listed best-variant first. Pick the first pass, else first unknown,
  // else the failed rule that is closest to passing (fewest blockers).
  const best = results.reduce((a, b) =>
    RANK[b.result] < RANK[a.result] || (b.result === 'fail' && a.result === 'fail' && b.blockers.length < a.blockers.length) ? b : a,
  )
  const outcome: Outcome = best.result === 'pass' ? best.rule.outcome ?? 'likely' : best.result === 'unknown' ? 'possibly' : 'not'
  const better = results.slice(0, results.indexOf(best))
  const upgrades = better.filter(
    (r) => r.result === 'fail' && r.rule.variant !== best.rule.variant && r.blockers.length === 1 && isChangeable(r.blockers[0]),
  )
  let estimate: number | undefined
  if (program.estimate && 'table' in program.estimate && outcome !== 'not') {
    const size = facts[program.estimate.by ?? 'householdSize']
    estimate = lookup(tables, program.estimate.table, typeof size === 'number' ? size : undefined, asOf)
  }
  return { program, outcome, best, upgrades, estimate }
}

// ---- Facts ----

const anyOf = (xs: (boolean | undefined)[]): boolean | undefined =>
  xs.includes(true) ? true : xs.includes(undefined) ? undefined : false

const LA_COUNTY_AV = new Set(['93510', '93532', '93534', '93535', '93536', '93543', '93544', '93550', '93551', '93552', '93553', '93563', '93591'])
const NOT_LA_917 = new Set(['91701', '91708', '91709', '91710', '91729', '91730', '91737', '91739', '91743', '91752', '91758', '91759', '91761', '91762', '91763', '91764', '91784', '91785', '91786'])

// ponytail: ZIP-prefix check for LA County; swap for a full ZIP list if edge ZIPs matter.
export function inLACounty(zip?: string): boolean | undefined {
  if (!zip || !/^\d{5}$/.test(zip)) return undefined
  const p = Number(zip.slice(0, 3))
  return (p >= 900 && p <= 918 && !NOT_LA_917.has(zip)) || LA_COUNTY_AV.has(zip)
}

export function householdFacts(h: Household, tables: Tables, asOf: string): Facts {
  const size = h.people.length || undefined
  const ages = h.people.map((p) => p.age)
  const monthly = h.monthlyIncome
  const annual = monthly === undefined ? undefined : monthly * 12
  const fpl = lookup(tables, 'fpl-annual', size, asOf)
  return {
    asOf,
    householdSize: size,
    householdSizeWithUnborn: size === undefined ? undefined : size + h.people.filter((p) => p.pregnant).length,
    monthlyIncome: monthly,
    annualIncome: annual,
    incomePctFPL: annual === undefined || !fpl ? undefined : Math.round((annual / fpl) * 1000) / 10,
    calworksIncome: monthly === undefined ? undefined : Math.max(0, monthly - (h.hasEarnedIncome ? 450 : 0)),
    householdHasChild: anyOf(ages.map((a) => (a === undefined ? undefined : a < 18))),
    householdHasElderlyOrDisabled: anyOf(h.people.map((p) => (p.disabled ? true : p.age === undefined ? undefined : p.age >= 60))),
    householdHasUndocumentedOrUnknown: h.people.some((p) => p.status === undefined || p.status === 'undocumented'),
    getsCalFresh: !!h.benefits.calfresh,
    getsCalWORKs: !!h.benefits.calworks,
    getsSSI: !!h.benefits.ssi,
    getsWIC: !!h.benefits.wic,
    anyoneHasMediCal: h.people.some((p) => p.hasMediCal),
    electric: h.electric,
    gas: h.gas,
    inLACounty: inLACounty(h.zip),
  }
}

export function personFacts(base: Facts, p: Person): Facts {
  return {
    ...base,
    age: p.age,
    status: p.status,
    pregnant: !!p.pregnant,
    recentBirth: !!p.recentBirth,
    disabled: !!p.disabled,
    hasMediCal: !!p.hasMediCal,
  }
}

// ---- Top level ----

export interface Screening {
  asOf: string
  facts: Facts
  people: { person: Person; results: ProgramResult[] }[]
  household: ProgramResult[]
}

export function screen(h: Household, programs: Program[], tables: Tables, asOf: string): Screening {
  const facts = householdFacts(h, tables, asOf)
  const run = (ps: Program[], f: Facts) =>
    ps.map((p) => runProgram(p, f, tables, asOf)).filter((x): x is ProgramResult => x !== null)
  return {
    asOf,
    facts,
    people: h.people.map((person) => ({
      person,
      results: run(programs.filter((p) => p.appliesTo === 'person'), personFacts(facts, person)),
    })),
    household: run(programs.filter((p) => p.appliesTo === 'household'), facts),
  }
}

// ---- Timeline: how rule changes reach this family ----

const dayAfter = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)

// Results can only change on a day when some rule or table starts or stops.
export function changeDates(programs: Program[], tables: Tables, from: string, to: string): string[] {
  const ranges = [...programs.flatMap((p) => p.rules.map((r) => r.effective)), ...Object.values(tables).flatMap((t) => t.versions.map((v) => v.effective))]
  const days = ranges.flatMap((r) => [r.from, ...(r.to ? [dayAfter(r.to)] : [])])
  return [...new Set(days)].filter((d) => d > from && d <= to).sort()
}

export interface Change { date: string; personId?: string; program: Program; before?: ProgramResult; after?: ProgramResult }

// "Possibly" only because we have no income limit for that date: a gap in our data, not a rule change.
const isGap = (r: ProgramResult) =>
  r.outcome === 'possibly' && r.best.blockers.some((b) => leaves(b).some((l) => l.result === 'unknown' && l.reason === 'noData'))

// A change the family would notice: in or out, a different variant, or (when likely) a new governing rule.
// "Not eligible" and "not offered" count as the same.
function differs(a?: ProgramResult, b?: ProgramResult) {
  const [x, y] = [a, b].map((r) => (r && r.outcome !== 'not' ? r : undefined))
  if (!x || !y) return x !== y
  return x.outcome !== y.outcome || x.best.rule.variant !== y.best.rule.variant
    || (x.outcome === 'likely' && x.best.rule.id !== y.best.rule.id)
}

// Screens the household on every change date and lists what changed for each person, oldest first.
// Ages stay as entered. Data gaps are skipped: a result is compared with the last date we could judge it.
export function timeline(h: Household, programs: Program[], tables: Tables, from: string, to: string): Change[] {
  const last = new Map<string, ProgramResult | 'gap' | undefined>()
  const changes: Change[] = []
  ;[from, ...changeDates(programs, tables, from, to)].forEach((date, i) => {
    const s = screen(h, programs, tables, date)
    const now = new Map<string, readonly [string | undefined, ProgramResult]>([
      ...s.people.flatMap(({ person, results }) => results.map((r) => [`${person.id}|${r.program.id}`, [person.id, r]] as const)),
      ...s.household.map((r) => [`|${r.program.id}`, [undefined, r]] as const),
    ])
    for (const k of new Set([...last.keys(), ...now.keys()])) {
      const [personId, r] = now.get(k) ?? [k.split('|')[0] || undefined, undefined]
      const prev = last.get(k)
      if (r && isGap(r)) { if (!last.has(k)) last.set(k, 'gap'); continue }
      last.set(k, r)
      if (i === 0 || prev === 'gap' || !differs(prev, r)) continue
      changes.push({ date, personId, program: (r ?? prev)!.program, before: prev, after: r })
    }
  })
  return changes
}
