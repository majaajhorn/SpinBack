import { useEffect, useRef } from 'react'
import type { Song, TurnResult } from '../game/types'
import { slotLabel } from '../game/text'
import { Card, MysteryCard } from './Card'

type Props =
  | { cards: Song[]; mode: 'place'; slot: number | null; onPlace: (slot: number | null) => void }
  | { cards: Song[]; mode: 'reveal'; mystery: Song; result: TurnResult }
  | { cards: Song[]; mode: 'static' }

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

  // One gap per position 0..n (slot, mystery or ghost), followed by the card at that index.
  const gap = (i: number) => {
    if (props.mode === 'place') {
      return props.slot === i ? (
        <MysteryCard key="mystery" hint="Na crti" onUndo={() => props.onPlace(null)} />
      ) : (
        <button key={`slot${i}`} className="slot" aria-label={slotLabel(cards, i)} onClick={() => props.onPlace(i)}>
          +
        </button>
      )
    }
    if (props.mode === 'reveal' && !props.result.placedOk && props.result.correctIndex === i) {
      return <Card key="ghost" song={props.mystery} variant="wrong" />
    }
    return null
  }
  const isNew = (c: Song) => props.mode === 'reveal' && props.result.placedOk && c.id === props.mystery.id

  return (
    <div ref={ref} className="timeline" role="group" aria-label="Vremenska crta">
      {cards.map((c, i) => [gap(i), <Card key={c.id} song={c} variant={isNew(c) ? 'new' : undefined} />])}
      {gap(cards.length)}
    </div>
  )
}
