import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import { slotLabel } from '../game/text'
import type { Song, TurnResult } from '../game/types'
import { Card, MysteryCard } from './Card'

type Props =
  | {
      cards: Song[]
      mode: 'place'
      slot: number | null
      onPlace: (slot: number | null) => void
      onDragStart: (e: PointerEvent<HTMLElement>) => void
    }
  | { cards: Song[]; mode: 'reveal'; mystery: Song; result: TurnResult }
  | { cards: Song[]; mode: 'static' }

/** Card that flips from face-down to its face; `ok` glows teal, `fall` shakes and drops off. */
function Flip({ song, kind }: { song: Song; kind: 'ok' | 'fall' }) {
  return (
    <div className={`flipwrap ${kind}`} data-focus="">
      <div className="flipper">
        <Card song={song} />
        <MysteryCard />
      </div>
    </div>
  )
}

export function Timeline(props: Props) {
  const { cards } = props
  const ref = useRef<HTMLDivElement>(null)
  const focusKey = props.mode === 'place' ? props.slot : props.mode

  // Keep the placed / revealed card in view on long timelines.
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current
      ?.querySelector('[data-focus]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [focusKey])

  // What sits in the gap before card i (i = cards.length is the end).
  const gap = (i: number): ReactNode => {
    if (props.mode === 'place') {
      return props.slot === i ? (
        // Keyed by slot so the drop-in animation replays when the card moves.
        <MysteryCard key={`mystery${i}`} className="dropin" hint="Povuci za pomak" slot={i}
          onUndo={() => props.onPlace(null)} onDragStart={props.onDragStart} />
      ) : (
        <button key={`slot${i}`} className="slot" data-slot={i} aria-label={slotLabel(cards, i)} onClick={() => props.onPlace(i)}>
          +
        </button>
      )
    }
    if (props.mode === 'reveal' && !props.result.placedOk) {
      if (props.result.slot === i) return <Flip key="fall" song={props.mystery} kind="fall" />
      if (props.result.correctIndex === i)
        return (
          <div key="ghost" className="ghostwrap">
            <Card song={props.mystery} variant="wrong" />
          </div>
        )
    }
    return null
  }

  const card = (c: Song, i: number) => {
    if (props.mode === 'reveal' && c.id === props.mystery.id) {
      return props.result.bought ? (
        <div key={c.id} className="dropin flex-none">
          <Card song={c} variant="new" />
        </div>
      ) : (
        <Flip key={c.id} song={c} kind="ok" />
      )
    }
    return <Card key={c.id} song={c} k={props.mode === 'static' ? i : undefined} />
  }

  return (
    <div ref={ref} className={`timeline ${props.mode === 'static' ? 'stagger' : ''}`} role="group" aria-label="Vremenska crta"
      data-droppable={props.mode === 'place' ? '' : undefined}>
      {cards.map((c, i) => [gap(i), card(c, i)])}
      {gap(cards.length)}
    </div>
  )
}
