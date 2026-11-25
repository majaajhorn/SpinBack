import { expect, it } from 'vitest'
import { belongsText, slotLabel, tokensLabel } from './text'
import type { Song } from './types'

const cards = [1975, 1983].map((year, i): Song => ({ id: `c${i}`, deezerId: i + 1, artist: 'A', title: 'T', year, local: false }))

it('slot labels name the neighbouring years only', () => {
  expect(slotLabel([], 0)).toBe('Smjesti karticu na crtu')
  expect(slotLabel(cards, 0)).toBe('Smjesti prije 1975.')
  expect(slotLabel(cards, 1)).toBe('Smjesti između 1975. i 1983.')
  expect(slotLabel(cards, 2)).toBe('Smjesti nakon 1983.')
})

it('explains where a wrongly placed card belongs', () => {
  expect(belongsText(cards, 0)).toBe('Pripada prije 1975.')
  expect(belongsText(cards, 1)).toBe('Pripada između 1975. i 1983.')
  expect(belongsText(cards, 2)).toBe('Pripada nakon 1983.')
})

it('uses the Croatian plural for tokens', () => {
  expect(tokensLabel(1)).toBe('1 žeton')
  expect(tokensLabel(3)).toBe('3 žetona')
})
