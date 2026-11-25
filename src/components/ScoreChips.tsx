import { useEffect, useRef } from 'react'
import { MAX_TOKENS } from '../game/engine'
import { tokensLabel } from '../game/text'
import type { Player } from '../game/types'

interface Props {
  players: Player[]
  turn: number
  target: number
  /** Player whose newest token should pop (just earned). */
  popPlayer?: number
}

export function ScoreChips({ players, turn, target, popPlayer }: Props) {
  const ref = useRef<HTMLUListElement>(null)
  // With many players or long names, keep the active player's chip on screen.
  useEffect(() => {
    const list = ref.current
    const chip = list?.querySelector<HTMLElement>('[aria-current]')
    if (list && chip) list.scrollLeft = chip.offsetLeft - list.offsetLeft - 8
  }, [turn])

  return (
    <ul ref={ref} className="chips" aria-label="Igrači">
      {players.map((p, i) => (
        <li key={i} className={`chip ${i === turn ? 'active' : ''}`} aria-current={i === turn ? 'true' : undefined}>
          <span className="avatar" aria-hidden="true">
            {p.name.trim()[0]?.toUpperCase() ?? '?'}
          </span>
          <span className="min-w-0 leading-tight">
            <b className="block max-w-[8.5rem] truncate font-semibold">{p.name}</b>
            <span className="flex gap-1.5 text-[.85rem]">
              <span className="text-muted tabular-nums" aria-label={`${p.cards.length} od ${target} kartica`}>
                {p.cards.length}/{target}
              </span>
              <span className="tokens" role="img" aria-label={tokensLabel(p.tokens)}>
                {Array.from({ length: MAX_TOKENS }, (_, k) => (
                  // The token just earned pops in.
                  <span key={k} className={`token ${k < p.tokens ? 'on' : ''} ${i === popPlayer && k === p.tokens - 1 ? 'pop' : ''}`} />
                ))}
              </span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
