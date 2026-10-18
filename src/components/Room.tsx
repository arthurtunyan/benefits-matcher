import type { CSSProperties } from 'react'
import { DoorOpen, Plus, X } from 'lucide-react'

// Inside the house: everyone who lives there stands in the room.
// Tap a person to answer questions about them, + to add someone, the small X to remove someone.

export interface RoomPerson {
  id: string
  letter: string
  name: string
  label: string // accessible name, e.g. "Maria, Age 25"
  color: string
  fill: number // 0 to 1: how much about this person is filled in
  active: boolean
}

export default function Room({ title, people, onSelect, onAdd, addLabel, onRemove, removeLabel, onExit, exitLabel }: {
  title: string
  people: RoomPerson[]
  onSelect: (id: string) => void
  onAdd: () => void
  addLabel: string
  onRemove?: (id: string) => void // undefined when only one person is left
  removeLabel: (name: string) => string
  onExit: () => void
  exitLabel: string
}) {
  return (
    <div className="room">
      <div className="room-top">
        <p className="room-title">{title}</p>
        <button type="button" className="btn btn-ghost btn-small room-exit" onClick={onExit}>
          <DoorOpen size={16} aria-hidden="true" /> {exitLabel}
        </button>
      </div>
      <div className="room-scene">
        {/* back wall decorations */}
        <span className="room-window" aria-hidden="true" />
        <span className="room-lamp" aria-hidden="true" />
        <ul className="room-people">
          {people.map((p) => (
            <li key={p.id} className={`figure-wrap ${p.active ? 'figure-wrap-active' : ''}`}>
              <button type="button" className={`figure ${p.fill >= 1 ? 'figure-full' : ''}`} aria-current={p.active ? 'step' : undefined}
                aria-label={p.label} onClick={() => onSelect(p.id)}
                style={{ '--c': p.color, '--f': Math.max(0, Math.min(1, p.fill)) } as CSSProperties}>
                <span className="figure-head" aria-hidden="true">{p.letter}</span>
                <span className="figure-body" aria-hidden="true" />
                <span className="figure-name" aria-hidden="true">{p.name}</span>
              </button>
              {onRemove && (
                <button type="button" className="figure-x" onClick={() => onRemove(p.id)} aria-label={removeLabel(p.name)}>
                  <X size={12} strokeWidth={4} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
          <li className="figure-wrap">
            <button type="button" className="figure figure-add" onClick={onAdd} aria-label={addLabel}>
              <span className="figure-head" aria-hidden="true"><Plus size={20} strokeWidth={3} /></span>
              <span className="figure-body" aria-hidden="true" />
              <span className="figure-name" aria-hidden="true">{addLabel}</span>
            </button>
          </li>
        </ul>
        <span className="room-floor" aria-hidden="true" />
      </div>
    </div>
  )
}
