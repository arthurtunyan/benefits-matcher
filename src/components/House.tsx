import type { ReactNode } from 'react'
import { Check, Plus, X } from 'lucide-react'

// The house drawing shared by the start screen, the questions, and the results.
// Parts of the house are buttons laid over the drawing; positions are % of the 400 x 320 drawing.

export interface HousePart {
  id: string
  x: number // % from left
  y: number // % from top
  icon: ReactNode
  label: string // part name, e.g. "Electric bill"
  value?: string // the answer, shown on wide screens
  done: boolean
  active?: boolean
  onClick?: () => void
}

export interface HouseWindow {
  id: string
  letter: string
  label: string // full accessible name
  caption?: string // short name under the window on wide screens
  done?: boolean
  active?: boolean
  onClick?: () => void
  onRemove?: () => void // shows a small X on hover (or when selected) that removes this person
  removeLabel?: string
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
      {/* door and step */}
      <rect x="170" y="236" width="40" height="54" rx="12" className="h-door" />
      <circle cx="202" cy="265" r="3" className="h-wall" />
      <rect x="158" y="284" width="64" height="8" rx="4" className="h-dark" />
      {/* gas meter, mailbox post */}
      <rect x="94" y="242" width="26" height="30" rx="8" className="h-door" />
      <rect x="338" y="250" width="6" height="40" rx="3" className="h-dark" />
    </svg>
  )
}

export default function House({ parts = [], windows = [], onAdd, addLabel, decorative = false }: {
  parts?: HousePart[]; windows?: HouseWindow[]; onAdd?: () => void; addLabel?: string; decorative?: boolean
}) {
  const Tag = decorative ? 'span' : 'button'
  return (
    <div className={`house ${decorative ? 'house-static' : ''}`} aria-hidden={decorative || undefined}>
      <Art />
      {parts.map((p) => (
        <Tag key={p.id} {...(decorative ? {} : { type: 'button' as const, onClick: p.onClick, 'aria-current': p.active ? 'step' as const : undefined })}
          className={`spot ${p.done ? 'spot-done' : ''} ${p.active ? 'spot-active' : ''}`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <span className="spot-bubble">
            {p.icon}
            {p.done && <span className="spot-check"><Check size={11} strokeWidth={4} aria-hidden="true" /></span>}
          </span>
          <span className="spot-label">
            <span className={p.value ? 'sr-only' : ''}>{p.label}</span>
            {p.value && <><span className="sr-only">: </span>{p.value}</>}
          </span>
        </Tag>
      ))}
      <div className="windows">
        {windows.map((w) => (
          <span key={w.id} className={`window-wrap ${w.active ? 'window-wrap-active' : ''}`}>
            <Tag {...(decorative ? {} : { type: 'button' as const, onClick: w.onClick, 'aria-label': w.label, 'aria-current': w.active ? 'step' as const : undefined })}
              className={`window ${w.active ? 'window-active' : ''} ${w.done ? 'window-done' : ''}`}>
              <span className="window-pane" aria-hidden="true">{w.letter}</span>
              {w.caption && <span className="window-caption" aria-hidden="true">{w.caption}</span>}
            </Tag>
            {w.onRemove && !decorative && (
              <button type="button" className="window-x" onClick={w.onRemove} aria-label={w.removeLabel}>
                <X size={12} strokeWidth={4} aria-hidden="true" />
              </button>
            )}
          </span>
        ))}
        {onAdd && (
          <button type="button" className="window window-add" onClick={onAdd} aria-label={addLabel}>
            <span className="window-pane" aria-hidden="true"><Plus size={20} strokeWidth={3} /></span>
          </button>
        )}
      </div>
    </div>
  )
}
