import { createContext, useContext } from 'react'
import en from './i18n/en.json'
import es from './i18n/es.json'
import hy from './i18n/hy.json'

export const LOCALES = { en, es, hy } as const
export type Lang = keyof typeof LOCALES
export const LANGS = Object.keys(LOCALES) as Lang[]
// BCP-47 tags for number and date formatting.
const INTL: Record<Lang, string> = { en: 'en-US', es: 'es-US', hy: 'hy-AM' }

type Vars = Record<string, string | number>
type Dict = { [k: string]: string | Dict }

function get(dict: Dict, key: string): string | undefined {
  // Keys like "rules.mc.child" mean section "rules", entry "mc.child".
  const [section, ...rest] = key.split('.')
  const s = dict[section]
  if (typeof s !== 'object') return undefined
  const flat = s[rest.join('.')]
  if (typeof flat === 'string') return flat
  let cur: string | Dict | undefined = s
  for (const k of rest) cur = typeof cur === 'object' ? cur[k] : undefined
  return typeof cur === 'string' ? cur : undefined
}

export interface T {
  (key: string, vars?: Vars): string
  lang: Lang
  money: (n: number) => string
  date: (iso: string) => string
  has: (key: string) => boolean
}

export function makeT(lang: Lang): T {
  const dict = LOCALES[lang] as Dict
  const t = ((key: string, vars?: Vars) => {
    const s = get(dict, key) ?? get(en as Dict, key) ?? key
    return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s
  }) as T
  t.lang = lang
  t.has = (key) => get(dict, key) !== undefined || get(en as Dict, key) !== undefined
  t.money = (n) =>
    new Intl.NumberFormat(INTL[lang], {
      style: 'currency', currency: 'USD', maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
    }).format(n)
  // Noon UTC keeps the calendar day stable in every time zone.
  t.date = (iso) => new Intl.DateTimeFormat(INTL[lang], { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'))
  return t
}

export const I18n = createContext<T>(makeT('en'))
export const useT = () => useContext(I18n)
