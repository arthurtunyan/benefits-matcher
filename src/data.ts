// Loads the open rules dataset in /rules. Bundled at build time — no network.
import type { Program, Tables } from './engine'
import tablesJson from '../rules/tables.json'
import zipsJson from '../rules/zips.json'
import helpJson from '../rules/help.json'

const files = import.meta.glob<Program>('../rules/programs/*.json', { eager: true, import: 'default' })

// Display order: health, food, cash, family, then household-wide programs.
const ORDER = ['medi-cal', 'covered-california', 'calfresh', 'cfap', 'sun-bucks', 'calworks', 'capi', 'wic', 'early-learning',
  'california-lifeline', 'metro-life', 'sce-care-fera', 'socalgas-care', 'ladwp-ez-save', 'bwp-lifeline', 'glendale-care']
export const programs: Program[] = Object.values(files).sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id))
export const tables = tablesJson as unknown as Tables

export interface ZipInfo { city: string; electric: string | null }
export const zips = zipsJson as unknown as Record<string, ZipInfo>

export interface HelpPlace {
  id: string; name: string; kind: string; area: string
  address?: string; phone?: string; url?: string; languages: string[]
}
export const help = helpJson as HelpPlace[]

// The oldest "last verified" date: every rule and table was checked on or after it.
export const lastFullCheck = [
  ...programs.flatMap((p) => p.rules.map((r) => r.lastVerified)),
  ...Object.values(tables).flatMap((t) => t.versions.map((v) => v.lastVerified)),
].sort()[0]
