import type { Song } from './types'

// Croatian UI strings derived from game state. They describe neighbours only,
// never the mystery song, so nothing leaks before the reveal.

export const tokensLabel = (n: number) => (n === 1 ? '1 žeton' : `${n} žetona`)

export function slotLabel(cards: Song[], i: number): string {
  if (cards.length === 0) return 'Smjesti karticu na crtu'
  if (i === 0) return `Smjesti prije ${cards[0].year}.`
  if (i === cards.length) return `Smjesti nakon ${cards[i - 1].year}.`
  return `Smjesti između ${cards[i - 1].year}. i ${cards[i].year}.`
}

/** "Pripada između 1975. i 1983." from the neighbours at the correct spot. */
export function belongsText(cards: Song[], i: number): string {
  const a = cards[i - 1]
  const b = cards[i]
  if (a && b) return `Pripada između ${a.year}. i ${b.year}.`
  return a ? `Pripada nakon ${a.year}.` : `Pripada prije ${b.year}.`
}
