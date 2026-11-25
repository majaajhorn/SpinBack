import type { CSSProperties, PointerEvent } from 'react'
import { decadeOf } from '../game/engine'
import type { Song } from '../game/types'

/** Song card: decade-coloured year band (the Sleeve Rule), then title and artist. `k` staggers entry. */
export function Card({ song, variant, k }: { song: Song; variant?: 'new' | 'wrong'; k?: number }) {
  const band = variant === 'wrong' ? 'var(--bad)' : `var(--d-${decadeOf(song.year)})`
  return (
    <div className={`card ${variant ?? ''}`} data-focus={variant ? '' : undefined} style={k === undefined ? undefined : ({ '--k': k } as CSSProperties)}>
      <span className="card-year" style={{ background: band }}>
        {song.year}
      </span>
      <span className="card-title">{song.title}</span>
      <span className="card-artist">{song.artist}</span>
    </div>
  )
}

interface MysteryProps {
  hint?: string
  className?: string
  /** Index this card occupies on the timeline, so it is also a drop target. */
  slot?: number
  onUndo?: () => void
  onDragStart?: (e: PointerEvent<HTMLElement>) => void
}

/** Face-down mystery card. Never shows anything about the song. */
export function MysteryCard({ hint, className = '', slot, onUndo, onDragStart }: MysteryProps) {
  return (
    <div
      className={`card mystery ${className}`}
      data-focus=""
      data-slot={slot}
      data-drag={onDragStart ? '' : undefined}
      onPointerDown={onDragStart}
      role={onDragStart ? 'img' : undefined}
      aria-label={onDragStart ? 'Tajna pjesma. Povuci je na crtu ili dodirni +.' : undefined}
    >
      <span className="q" aria-hidden="true">
        ?
      </span>
      {hint && <span className="hint">{hint}</span>}
      {onUndo && (
        <button className="min-h-11 px-3 text-[.85rem] font-semibold underline underline-offset-2" onClick={onUndo}>
          Vrati
        </button>
      )}
    </div>
  )
}
