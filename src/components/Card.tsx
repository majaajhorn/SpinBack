import { decadeOf } from '../game/engine'
import type { Song } from '../game/types'

/** Song card: decade-coloured year band (the Sleeve Rule), then title and artist. */
export function Card({ song, variant }: { song: Song; variant?: 'new' | 'wrong' }) {
  const band = variant === 'wrong' ? 'var(--bad)' : `var(--d-${decadeOf(song.year)})`
  return (
    <div className={`card ${variant ?? ''}`} data-focus={variant ? '' : undefined}>
      <span className="card-year" style={{ background: band }}>
        {song.year}
      </span>
      <span className="card-title">{song.title}</span>
      <span className="card-artist">{song.artist}</span>
    </div>
  )
}

/** Face-down mystery card. Never shows anything about the song. */
export function MysteryCard({ hint, onUndo }: { hint?: string; onUndo?: () => void }) {
  return (
    <div className="card mystery" data-focus="">
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
