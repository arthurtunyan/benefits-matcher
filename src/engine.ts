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
  benefits: { calfresh?: boolean; calworks?: boolean; ssi?: boolean; wic?: boolean; none?: boolean } // none: answered "none of these"
  disaster?: boolean // a fire, flood, or other disaster hurt the home, food, or work; undefined = not answered
  disasterDate?: string // YYYY-MM-DD; deadlines count from here
  disasterLoss?: { home?: boolean; food?: boolean; work?: boolean }
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
  category: 'health' | 'food' | 'cash' | 'family' | 'utility' | 'transit' | 'tax' | 'disaster'
  appliesTo: 'person' | 'household'
  audience?: Cond // who the program is relevant to; hidden when this fails
  apply: { url: string; phone?: string; where: string }
  documents: string[]
  alternatives?: string[]
  estimate?: { table: string; by?: string; phaseIn?: { rate: number; over: number } } | { text: string }
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
  reason?: 'missing' | 'unsure' | 'noData' | 'nearData' // nearData: judged on the closest table version (still sure)
  range?: [number, number] // limit unknown because the size is: the smallest and largest it could be
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
  return v && valueAt(v, size)
}

// When no version covers the date: the latest one that ended before it, else the first one that starts after it.
function nearest(tables: Tables, id: string, asOf: string): { v: TableVersion; older: boolean } | undefined {
  const vs = tables[id]?.versions ?? []
  const before = vs.filter((x) => x.effective.to !== null && x.effective.to < asOf).sort((a, b) => b.effective.from.localeCompare(a.effective.from))[0]
  const after = vs.filter((x) => x.effective.from > asOf).sort((a, b) => a.effective.from.localeCompare(b.effective.from))[0]
  return before ? { v: before, older: true } : after ? { v: after, older: false } : undefined
}

function valueAt(v: TableVersion, size: number | undefined): number | undefined {
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
  const upper = op === 'lt' || op === 'lte'
  let expected: Scalar | Scalar[] | undefined
  let near: ReturnType<typeof nearest>
  let range: [number, number] | undefined // size unknown: the smallest and largest limit it could be
  const sizeMissing = isTable(raw) && facts[raw.by ?? 'householdSize'] === undefined
  if (isTable(raw)) {
    const size = facts[raw.by ?? 'householdSize']
    const n = typeof size === 'number' ? size : undefined
    const cover = tables[raw.table]?.versions.find((x) => inRange(x.effective, asOf))
    near = cover ? undefined : nearest(tables, raw.table, asOf)
    const v = cover ?? near?.v
    expected = v && valueAt(v, n)
    // Size unknown (e.g. how many children have an SSN): judge against the largest limit, which only a fail can use.
    if (expected === undefined && v && sizeMissing && upper && v.each === undefined) {
      const vals = Object.values(v.values)
      range = [Math.min(...vals), Math.max(...vals)]
      expected = range[1]
    }
  } else expected = raw
  const actual = facts[leaf.fact]
  const base = { kind: 'leaf' as const, leaf, op, expected, actual }
  if (actual === undefined) return { ...base, result: 'unknown', reason: 'missing', ...(range ? { expected: undefined, range } : {}) }
  if (leaf.unsure?.includes(actual)) return { ...base, result: 'unknown', reason: 'unsure' }
  // No limit: either we lack the table for this date, or the size it's looked up by is unknown.
  if (expected === undefined) return { ...base, result: 'unknown', reason: sizeMissing ? 'missing' : 'noData' }
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
  // Under the largest limit: it depends on the size we don't know.
  if (range && ok) return { ...base, expected: undefined, range, result: 'unknown', reason: 'missing' }
  if (near) {
    // ponytail: assumes limits never go down over time, never more than double past the last version we have, and
    // are never negative. Then an older limit is at most the real one (passing it passes the real one; failing it
    // by more than double fails the real one), a newer one at least the real one (failing it fails the real one),
    // and $0 passes any upper limit. Every other answer stays "we don't have this limit". Ceiling: a limit that
    // drops breaks it; adding the missing table version removes the guess.
    const n = Number(expected)
    const sure = ['lt', 'lte', 'gt', 'gte'].includes(op) && ((upper === near.older) === ok
      || (upper && ok && actual === 0) || (upper && near.older && !ok && Number(actual) > 2 * n))
    if (!sure) return { ...base, result: 'unknown', reason: 'noData' }
  }
  const res: LeafResult = { ...base, result: ok ? 'pass' : 'fail', ...(near ? { reason: 'nearData' as const } : {}) }
  if (!ok && upper && typeof actual === 'number' && typeof expected === 'number') res.over = actual - expected
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

// Income limits only: being a year too old or two days past a deadline is not "income above the limit".
const INCOME = new Set(['monthlyIncome', 'annualIncome', 'incomePctFPL', 'calworksIncome', 'earnedIncome'])

export function nearMiss(c: CondResult): LeafResult | undefined {
  return leaves(c).find((l) => INCOME.has(l.leaf.fact) && l.over !== undefined && l.over > 0 && l.over <= Number(l.expected) * NEAR_MISS_MARGIN)
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
  // Rules are listed best-variant first. Pick the first pass, else first unknown, else the failed rule that is
  // closest to passing: fewest blockers the family can't change (an adult isn't told "you're not under 19"),
  // then fewest blockers, then one where income is just over the limit.
  const score = (r: RuleResult) => [r.blockers.filter((x) => !isChangeable(x)).length, r.blockers.length, nearMiss(r.tree) ? 0 : 1]
  const closer = (a: RuleResult, b: RuleResult) => {
    const [x, y] = [score(a), score(b)]
    const i = x.findIndex((v, k) => v !== y[k])
    return i >= 0 && y[i] < x[i]
  }
  const best = results.reduce((a, b) =>
    RANK[b.result] < RANK[a.result] || (b.result === 'fail' && a.result === 'fail' && closer(a, b)) ? b : a,
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
    // Refundable credits that phase in with earnings (the Child Tax Credit pays 15% of earnings over $2,500).
    const cap = program.estimate.phaseIn, earned = facts.earnedIncome
    if (estimate !== undefined && cap && typeof earned === 'number') estimate = Math.min(estimate, Math.max(0, Math.round(cap.rate * (earned - cap.over))))
  }
  return { program, outcome, best, upgrades, estimate }
}

// ---- Facts ----

const anyOf = (xs: (boolean | undefined)[]): boolean | undefined =>
  xs.includes(true) ? true : xs.includes(undefined) ? undefined : false

const LA_COUNTY_AV = new Set(['93243', '93510', '93532', '93534', '93535', '93536', '93543', '93544', '93550', '93551', '93552', '93553', '93563', '93591'])
// Orange County ZIPs that share LA's 906/907 prefixes (Buena Park, La Palma, Cypress, La Habra, Stanton, Los Alamitos, Seal Beach).
const NOT_LA_OC = new Set(['90620', '90621', '90622', '90623', '90624', '90630', '90631', '90632', '90633', '90680', '90720', '90721', '90740', '90742', '90743'])
const NOT_LA_917 = new Set(['91701', '91708', '91709', '91710', '91729', '91730', '91737', '91739', '91743', '91752', '91758', '91759', '91761', '91762', '91763', '91764', '91784', '91785', '91786'])

// ponytail: ZIP-prefix check for LA County; swap for a full ZIP list if edge ZIPs matter.
export function inLACounty(zip?: string): boolean | undefined {
  if (!zip || !/^\d{5}$/.test(zip)) return undefined
  const p = Number(zip.slice(0, 3))
  return (p >= 900 && p <= 918 && !NOT_LA_917.has(zip) && !NOT_LA_OC.has(zip)) || LA_COUNTY_AV.has(zip)
}

// Statuses that come with a work-eligible Social Security number and count for FEMA, SBA, and DUA.
const QUALIFIED = new Set<Status | undefined>(['citizen', 'lpr5', 'lpr', 'humanitarian'])
const MAYBE_QUALIFIED = new Set<Status | undefined>([undefined, 'otherLawful'])

// How many of these people are qualified; undefined when none are known to be and someone's status is unsure.
function countQualified(ps: Person[]): number | undefined {
  const n = ps.filter((p) => QUALIFIED.has(p.status)).length
  return n === 0 && ps.some((p) => MAYBE_QUALIFIED.has(p.status)) ? undefined : n
}
const anyQualified = (ps: Person[]) => {
  const n = countQualified(ps)
  return n === undefined ? undefined : n > 0
}
const kids = (ps: Person[], under: number) => ps.filter((p) => p.age !== undefined && p.age < under)
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)

export function householdFacts(h: Household, tables: Tables, asOf: string): Facts {
  const size = h.people.length || undefined
  const ages = h.people.map((p) => p.age)
  const monthly = h.monthlyIncome
  const annual = monthly === undefined ? undefined : monthly * 12
  const fpl = lookup(tables, 'fpl-annual', size, asOf)
  const adults = h.people.filter((p) => p.age === undefined || p.age >= 18)
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
    // Tax credits. ponytail: all income counts as earned when "some comes from a job" (an upper bound for the limits).
    earnedIncome: annual === undefined ? undefined : annual === 0 || h.hasEarnedIncome === false ? 0
      : h.hasEarnedIncome ? annual : undefined,
    ssnAdult: anyQualified(adults),
    // Every adult has an SSN: then whoever files can claim the EITC and CTC. False once an adult is undocumented.
    ssnAllAdults: adults.every((p) => QUALIFIED.has(p.status)) ? true : adults.some((p) => p.status === 'undocumented') ? false : undefined,
    eitcKids: countQualified(kids(h.people, 19)),
    ctcKids: countQualified(kids(h.people, 17)),
    taxKids: kids(h.people, 19).length, // California credits accept an ITIN, so status doesn't matter
    youngKids: kids(h.people, 6).length,
    kidsUnder17: kids(h.people, 17).length, // at least as many as ctcKids: sizes the Child Tax Credit phase-out
    // CAPI pays the individual or the couple rate: count the people who could apply (aged 65+ or disabled, not citizens).
    capiApplicants: h.people.filter((p) => p.status !== 'citizen' && (p.disabled || (p.age ?? 0) >= 65)).length || undefined,
    // Adults 18-59 without a disability: the usual CalWORKs caretaker when an older or disabled adult also lives here.
    workingAgeAdults: h.people.filter((p) => p.age !== undefined && p.age >= 18 && p.age < 60 && !p.disabled).length,
    anyAge25to64: anyOf(adults.map((p) => (p.age === undefined ? undefined : p.age >= 25 && p.age <= 64))),
    // Disasters
    disaster: h.disaster === true, // disaster help is opt-in: not answering means no disaster
    daysSinceDisaster: h.disaster && h.disasterDate ? daysBetween(h.disasterDate, asOf) : undefined,
    lostHome: h.disaster ? !!h.disasterLoss?.home : undefined,
    lostFood: h.disaster ? !!h.disasterLoss?.food : undefined,
    lostWork: h.disaster ? !!h.disasterLoss?.work : undefined,
    qualifiedAnyone: anyQualified(h.people),
    qualifiedAdult: anyQualified(adults),
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
  const dates = [...new Set([...changeDates(programs, tables, from, to), ...disasterDates(h, programs, from, to)])].sort()
  ;[from, ...dates].forEach((date, i) => {
    const s = screen(h, programs, tables, date)
    const now = new Map<string, readonly [string | undefined, ProgramResult]>([
      ...s.people.flatMap(({ person, results }) => results.map((r) => [`${person.id}|${r.program.id}`, [person.id, r]] as const)),
      ...s.household.map((r) => [`|${r.program.id}`, [undefined, r]] as const),
    ])
    for (const k of new Set([...last.keys(), ...now.keys()])) {
      const [personId, r] = now.get(k) ?? [k.split('|')[0] || undefined, undefined]
      const prev = last.get(k)
      // A rule that starts today is news even if its income limit isn't published yet (e.g. CFAP for 55+ in Oct 2027).
      if (r && isGap(r) && r.best.rule.effective.from !== date) { if (!last.has(k)) last.set(k, 'gap'); continue }
      last.set(k, r)
      if (i === 0 || prev === 'gap' || !differs(prev, r)) continue
      changes.push({ date, personId, program: (r ?? prev)!.program, before: prev, after: r })
    }
  })
  return changes
}

// Days counted from this family's disaster (the disaster itself, then the day after each deadline in the rules).
function disasterDates(h: Household, programs: Program[], from: string, to: string): string[] {
  if (!h.disaster || !h.disasterDate) return []
  const limits = programs.flatMap((p) => p.rules.flatMap((r) => deadlineDays(r.conditions)))
  const day = (n: number) => new Date(Date.parse(`${h.disasterDate}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
  return [day(0), ...limits.map((n) => day(n + 1))].filter((d) => d > from && d <= to)
}

// "Within N days of the disaster" limits in a rule.
export function deadlineDays(c: Cond): number[] {
  if ('all' in c) return c.all.flatMap(deadlineDays)
  if ('any' in c) return c.any.flatMap(deadlineDays)
  if ('not' in c) return []
  return c.fact === 'daysSinceDisaster' && typeof c.lte === 'number' ? [c.lte] : []
}
