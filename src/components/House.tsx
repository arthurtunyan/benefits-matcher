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

function Art() {
  return (
    <svg className="house-art" viewBox="0 0 400 320" aria-hidden="true" focusable="false">
      <rect x="0" y="286" width="400" height="34" rx="17" className="h-ground" />
      {/* power pole and wire */}
      <path d="M296 112 Q330 128 366 80" className="h-wire" />
      <rect x="362" y="70" width="8" height="220" rx="4" className="h-dark" />
      {/* street sign */}
      <rect x="26" y="196" width="6" height="94" rx="3" className="h-dark" />
      {/* chimney, roof, walls */}
      <rect x="248" y="54" width="26" height="60" rx="7" className="h-dark" />
      <rect x="72" y="120" width="236" height="170" rx="22" className="h-wall" />
      <path d="M58 140 Q46 140 54 131 L181 38 Q190 31 199 38 L326 131 Q334 140 322 140 Z" className="h-dark" />
      {/* doorway (dark), and the door that swings open over it */}
      <rect x="170" y="236" width="40" height="54" rx="12" className="h-doorway" />
      <g className="h-door-panel">
        <rect x="170" y="236" width="40" height="54" rx="12" className="h-door" />
        <circle cx="202" cy="265" r="3" className="h-wall" />
      </g>
      <rect x="158" y="284" width="64" height="8" rx="4" className="h-dark" />
      {/* gas meter, mailbox post */}
      <rect x="94" y="242" width="26" height="30" rx="8" className="h-door" />
      <rect x="338" y="250" width="6" height="40" rx="3" className="h-dark" />
    </svg>
  )
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))

export default function House({ parts = [], windows = [], decorative = false, entering = false }: {
  parts?: HousePart[]; windows?: HouseWindow[]; decorative?: boolean; entering?: boolean
}) {
  const Tag = decorative ? 'span' : 'button'
  return (
    <div className={`house ${decorative ? 'house-static' : ''} ${entering ? 'house-entering' : ''}`} aria-hidden={decorative || undefined}>
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
