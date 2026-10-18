import type { CSSProperties, ReactNode } from 'react'
import { Check } from 'lucide-react'

// The house drawing shared by the start screen, the questions, and the results.
// Parts of the house are buttons laid over the drawing; positions are % of the 400 x 320 drawing.

export interface HousePart {
  id: string
  x: number // % from left
  y: number // % from top
  icon: ReactNode
  color: string // CSS color for this part, e.g. 'var(--c-zip)'
  label: string // part name, e.g. "Electric bill"
  value?: string // the answer, shown on wide screens
  fill: number // 0 to 1: how much of this answer is filled in
  done: boolean // answered, or skipped with Next
  active?: boolean
  onClick?: () => void
}

export interface HouseWindow {
  id: string
  letter: string
  label: string // full accessible name
  color?: string
  fill?: number
  badge?: string
  active?: boolean
  onClick?: () => void
}

// The drawing. Classic house (cream walls, red roof, brick chimney), a wooden signpost (ZIP code),
// trees, a mailbox whose red flag goes up once income is answered, and a street lamp whose bulb
// lights up once the electric bill is answered.
function Art() {
  return (
    <svg className="house-art" viewBox="0 0 400 320" aria-hidden="true" focusable="false">
      <rect x="0" y="284" width="400" height="36" rx="18" className="h-ground" />
      {/* trees behind the house */}
      <g className="h-tree">
        <rect x="60" y="196" width="11" height="92" rx="4" className="h-trunk" />
        <circle cx="52" cy="176" r="24" className="h-leaf-2" />
        <circle cx="76" cy="160" r="26" className="h-leaf" />
        <circle cx="50" cy="146" r="20" className="h-leaf" />
        <circle cx="70" cy="128" r="18" className="h-leaf-2" />
      </g>
      <g className="h-tree">
        <rect x="312" y="200" width="11" height="88" rx="4" className="h-trunk" />
        <circle cx="306" cy="168" r="24" className="h-leaf" />
        <circle cx="330" cy="182" r="20" className="h-leaf-2" />
        <circle cx="326" cy="148" r="20" className="h-leaf-2" />
      </g>
      {/* chimney, walls, roof */}
      <g className="h-lined">
        <rect x="248" y="52" width="26" height="44" rx="3" className="h-brick" />
        <path d="M248 64 H274 M248 76 H274 M261 52 V64 M255 64 V76 M267 64 V76 M261 76 V88" className="h-mortar" />
        <rect x="84" y="126" width="212" height="162" rx="6" className="h-wall" />
        <path d="M68 130 L112 80 H268 L312 130 Z" className="h-roof" />
        <rect x="64" y="126" width="252" height="10" rx="5" className="h-roof" />
        {/* doorway (dark), and the door that swings open over it */}
        <rect x="172" y="232" width="36" height="56" rx="3" className="h-doorway" />
        <g className="h-door-panel">
          <rect x="172" y="232" width="36" height="56" rx="3" className="h-door" />
          <circle cx="200" cy="262" r="2.6" className="h-line-fill" />
        </g>
        <rect x="160" y="286" width="60" height="6" rx="3" className="h-line-fill" />
        {/* gas meter */}
        <rect x="96" y="244" width="24" height="28" rx="5" className="h-meter" />
      </g>
      {/* signpost for the ZIP code */}
      <g className="h-lined">
        <rect x="26" y="150" width="8" height="138" rx="2" className="h-wood-dark" />
        <path d="M8 176 H48 L56 184 L48 192 H8 Z" className="h-sign h-sign-a" />
        <path d="M54 200 H14 L6 208 L14 216 H54 Z" className="h-sign h-sign-b" />
        <path d="M10 224 H46 L53 231 L46 238 H10 Z" className="h-sign h-sign-c" />
      </g>
      {/* mailbox: post, box, red flag */}
      <g className="h-lined">
        <rect x="336" y="244" width="9" height="44" rx="2" className="h-post" />
        <path d="M318 248 V230 Q318 216 332 216 H350 Q364 216 364 230 V248 Z" className="h-mail" />
        <g className="h-flag"><rect x="358" y="206" width="4" height="30" rx="1" className="h-flag-red" /><rect x="358" y="206" width="14" height="8" rx="1" className="h-flag-red" /></g>
      </g>
      {/* street lamp with a light bulb */}
      <g className="h-lined">
        <rect x="381" y="118" width="7" height="170" rx="2" className="h-post" />
        <rect x="374" y="282" width="21" height="8" rx="2" className="h-post" />
        <circle cx="384.5" cy="90" r="26" className="h-glow" />
        <path d="M384.5 72 a14 14 0 0 1 9 24.7 V104 h-18 v-7.3 a14 14 0 0 1 9 -24.7 Z" className="h-bulb" />
        <rect x="376" y="104" width="17" height="14" rx="2" className="h-bulb-base" />
      </g>
    </svg>
  )
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))

export default function House({ parts = [], windows = [], decorative = false, entering = false, done = false }: {
  parts?: HousePart[]; windows?: HouseWindow[]; decorative?: boolean; entering?: boolean
  done?: boolean // everything answered: bulb lit and mailbox flag up (results page)
}) {
  const Tag = decorative ? 'span' : 'button'
  const lit = done || (parts.find((p) => p.id === 'electric')?.fill ?? 0) >= 1
  const flagUp = done || (parts.find((p) => p.id === 'income')?.fill ?? 0) >= 1
  return (
    <div className={`house ${decorative ? 'house-static' : ''} ${entering ? 'house-entering' : ''} ${lit ? 'house-lit' : ''} ${flagUp ? 'house-flag-up' : ''}`} aria-hidden={decorative || undefined}>
      <Art />
      {parts.map((p) => {
        const full = p.fill >= 1
        return (
          <Tag key={p.id} {...(decorative ? {} : { type: 'button' as const, onClick: p.onClick, 'aria-label': p.value ? `${p.label}: ${p.value}` : p.label, 'aria-current': p.active ? 'step' as const : undefined })}
            className={`spot ${full ? 'spot-full' : ''} ${p.active ? 'spot-active' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, '--c': p.color, '--f': clamp(p.fill) } as CSSProperties}>
            <span className="spot-bubble">
              <span className="spot-fill" aria-hidden="true" />
              <span className="spot-icon" aria-hidden="true">{p.icon}</span>
              {p.done && <span className="spot-check"><Check size={11} strokeWidth={4} aria-hidden="true" /></span>}
            </span>
            {/* Visible on wide screens; the button's aria-label carries the same words for screen readers. */}
            <span className="spot-label" aria-hidden="true">{p.value ?? p.label}</span>
          </Tag>
        )
      })}
      <div className="windows">
        {windows.map((w) => (
          <Tag key={w.id} {...(decorative ? {} : { type: 'button' as const, onClick: w.onClick, 'aria-label': w.label, 'aria-current': w.active ? 'step' as const : undefined })}
            className={`window ${w.active ? 'window-active' : ''} ${(w.fill ?? 0) >= 1 ? 'window-full' : ''}`}
            style={{ '--c': w.color ?? 'var(--house-window)', '--f': clamp(w.fill ?? 0) } as CSSProperties}>
            <span className="window-pane" aria-hidden="true">{w.letter}</span>
            {w.badge && <span className="window-badge" aria-hidden="true">{w.badge}</span>}
          </Tag>
        ))}
      </div>
    </div>
  )
}
