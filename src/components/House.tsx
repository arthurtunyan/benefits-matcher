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

// Drawn like a neighborhood sign-painter would: ink lines a little off-true, flat fills, a sun, a green blob behind.
function Art() {
  return (
    <svg className="house-art" viewBox="0 0 400 320" aria-hidden="true" focusable="false">
      <path className="h-blob" d="M44 168C34 96 112 34 214 38c98 4 170 52 162 138-6 76-62 122-170 120C102 294 52 238 44 168z" />
      <circle className="h-sun ln" cx="112" cy="62" r="17" />
      <path className="ln" d="M112 31v-8M112 101v-8M81 62h-8M151 62h-8M90 40l-6-6M140 90l-6-6M134 40l6-6M84 90l6-6" />
      {/* ground */}
      <path className="h-ground" d="M0 292c44-5 86 4 132 0s94-5 138 1 90 3 130-2v31H0z" />
      {/* power pole and wire */}
      <path className="ln" d="M302 118c22 18 44 14 62-30" />
      <path className="ln" d="M366 72l1 220M350 88h32" strokeWidth="4" />
      {/* street sign post */}
      <path className="ln" d="M30 196l-1 96" strokeWidth="4" />
      {/* chimney, then roof over it, then walls */}
      <path className="h-brick ln" d="M249 112V58h25l-1 54" />
      <path className="h-wall ln" d="M76 132l-2 158h232l-2-158" />
      <path className="h-roof ln" d="M56 141L190 35l135 106c2 3 0 5-3 5H59c-4 0-5-3-3-5z" />
      {/* bushes */}
      <path className="h-leaf ln" d="M128 291c-8-12 2-24 13-19 3-11 19-12 22 0 10-3 17 9 10 19" />
      <path className="h-leaf ln" d="M262 291c-6-11 3-21 12-16 4-9 17-8 19 2 8-1 12 8 7 14" />
      {/* door with an arched top, and the step */}
      <path className="h-door ln" d="M172 290v-40a18 18 0 0 1 36 0v40" />
      <circle className="h-ink" cx="200" cy="268" r="3" />
      <path className="ln" d="M158 291h64" strokeWidth="4" />
      {/* gas meter */}
      <path className="h-glass ln" d="M95 244h26v28H95z" />
      {/* mailbox */}
      <path className="ln" d="M341 252v40" strokeWidth="4" />
      <path className="h-wall ln" d="M324 252v-14a9 9 0 0 1 9-9h18a9 9 0 0 1 9 9v14z" />
      <path className="ln" d="M0 292c44-5 86 4 132 0s94-5 138 1 90 3 130-2" />
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
