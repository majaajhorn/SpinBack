import { useEffect, useRef } from 'react'
import { MAX_TOKENS } from '../game/engine'
import { tokensLabel } from '../game/text'
import type { Player } from '../game/types'

export function ScoreChips({ players, turn, target }: { players: Player[]; turn: number; target: number }) {
  const ref = useRef<HTMLUListElement>(null)
  // With many players or long names, keep the active player's chip on screen.
  useEffect(() => {
    const list = ref.current
    const chip = list?.querySelector<HTMLElement>('[aria-current]')
    if (list && chip) list.scrollLeft = chip.offsetLeft - list.offsetLeft - 8
  }, [turn])

  return (
    <ul ref={ref} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Igrači">
      {players.map((p, i) => (
        <li key={i} className={`chip ${i === turn ? 'active' : ''}`} aria-current={i === turn ? 'true' : undefined}>
          <span className="avatar" aria-hidden="true">
            {p.name.trim()[0]?.toUpperCase() ?? '?'}
          </span>
          <span className="leading-tight">
            <b className="block font-semibold">{p.name}</b>
            <span className="flex gap-2 text-[.85rem]">
              <span className="text-muted tabular-nums">
                {p.cards.length}/{target} kartica
              </span>
              <span className="tracking-[1px] text-amber" role="img" aria-label={tokensLabel(p.tokens)}>
                {'●'.repeat(p.tokens) + '○'.repeat(MAX_TOKENS - p.tokens)}
              </span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
