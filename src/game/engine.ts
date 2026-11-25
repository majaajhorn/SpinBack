import type { Action, Ctx, GameState, Player, Song } from './types'

export const START_TOKENS = 2
export const MAX_TOKENS = 5
export const SKIP_COST = 1
export const BUY_COST = 3
export const OPTION_COUNT = 4

export const decadeOf = (year: number) => Math.floor(year / 10) * 10

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Index where a card of `year` belongs; equal years go after existing ones. */
export function correctIndex(cards: Song[], year: number): number {
  let i = 0
  while (i < cards.length && cards[i].year <= year) i++
  return i
}

/** Equal years count as correct on either side. */
export function isPlacementOk(cards: Song[], slot: number, year: number): boolean {
  const left = cards[slot - 1]
  const right = cards[slot]
  return (!left || left.year <= year) && (!right || year <= right.year)
}

/**
 * Answer choices: the mystery song plus distractors by other artists, preferring the same
 * decade and the same local/foreign group so the era of the clip does not give it away.
 */
export function buildOptions(mystery: Song, catalog: Song[], rng: () => number): Song[] {
  const decade = decadeOf(mystery.year)
  const tiers: ((s: Song) => boolean)[] = [
    (s) => decadeOf(s.year) === decade && s.local === mystery.local,
    (s) => Math.abs(decadeOf(s.year) - decade) <= 10 && s.local === mystery.local,
    (s) => s.local === mystery.local,
    () => true,
  ]
  const picked: Song[] = []
  const artists = new Set([mystery.artist.toLowerCase()])
  for (const fits of tiers) {
    for (const s of shuffle(catalog, rng)) {
      if (picked.length === OPTION_COUNT - 1) break
      if (s.id === mystery.id || artists.has(s.artist.toLowerCase()) || !fits(s)) continue
      picked.push(s)
      artists.add(s.artist.toLowerCase())
    }
  }
  return shuffle([mystery, ...picked], rng)
}

const current = (s: GameState) => s.players[s.turn]

function updateCurrent(s: GameState, fn: (p: Player) => Player): Player[] {
  return s.players.map((p, i) => (i === s.turn ? fn(p) : p))
}

/** Draw the next mystery song; reshuffles the discard pile, ends the game if nothing is left. */
function drawMystery(s: GameState, ctx: Ctx): GameState {
  let deck = s.deck
  let discard = s.discard
  if (deck.length === 0) {
    deck = shuffle(discard, ctx.rng)
    discard = []
  }
  const base = { ...s, discard, slot: null, guess: null, result: null }
  if (deck.length === 0) {
    const most = Math.max(...s.players.map((p) => p.cards.length))
    return { ...base, deck, mystery: null, options: [], phase: 'win', winReason: 'deck',
      winner: s.players.findIndex((p) => p.cards.length === most) }
  }
  const mystery = deck[deck.length - 1]
  return { ...base, deck: deck.slice(0, -1), mystery, options: buildOptions(mystery, ctx.catalog, ctx.rng) }
}

export function startGame(names: string[], target: number, ctx: Ctx): GameState {
  const deck = shuffle(ctx.catalog, ctx.rng)
  const players = names.map((n, i) => ({
    name: n.trim() || `Igrač ${i + 1}`,
    cards: [deck.pop()!],
    tokens: START_TOKENS,
  }))
  const s: GameState = {
    phase: 'handoff', target, players, turn: 0, deck, discard: [], mystery: null, options: [],
    slot: null, guess: null, result: null, winner: null, winReason: null,
  }
  return drawMystery(s, ctx)
}

export function reduce(s: GameState, a: Action, ctx: Ctx): GameState {
  if (a.type === 'start') return startGame(a.names, a.target, ctx)
  const p = current(s)
  const m = s.mystery

  switch (a.type) {
    case 'ready':
      return s.phase === 'handoff' ? { ...s, phase: 'listen' } : s

    case 'place':
      if (s.phase !== 'listen') return s
      if (a.slot !== null && (a.slot < 0 || a.slot > p.cards.length)) return s
      return { ...s, slot: a.slot }

    case 'guess':
      if (s.phase !== 'listen' || !s.options.some((o) => o.id === a.songId)) return s
      return { ...s, guess: a.songId }

    case 'reveal': {
      if (s.phase !== 'listen' || !m || s.slot === null || s.guess === null) return s
      const placedOk = isPlacementOk(p.cards, s.slot, m.year)
      const guessedOk = s.guess === m.id
      const ci = correctIndex(p.cards, m.year)
      const players = updateCurrent(s, (pl) => ({
        ...pl,
        cards: placedOk ? [...pl.cards.slice(0, ci), m, ...pl.cards.slice(ci)] : pl.cards,
        tokens: guessedOk ? Math.min(MAX_TOKENS, pl.tokens + 1) : pl.tokens,
      }))
      return {
        ...s, players, phase: 'reveal',
        discard: placedOk ? s.discard : [...s.discard, m],
        result: { placedOk, guessedOk, bought: false, slot: s.slot, correctIndex: ci },
      }
    }

    case 'skip': {
      if (s.phase !== 'listen' || !m || p.tokens < SKIP_COST) return s
      const players = updateCurrent(s, (pl) => ({ ...pl, tokens: pl.tokens - SKIP_COST }))
      const next = drawMystery({ ...s, players, discard: [...s.discard, m] }, ctx)
      return next.phase === 'win' ? next : { ...next, phase: 'listen' }
    }

    case 'buy': {
      if (s.phase !== 'listen' || !m || p.tokens < BUY_COST) return s
      const ci = correctIndex(p.cards, m.year)
      const players = updateCurrent(s, (pl) => ({
        ...pl,
        tokens: pl.tokens - BUY_COST,
        cards: [...pl.cards.slice(0, ci), m, ...pl.cards.slice(ci)],
      }))
      return {
        ...s, players, phase: 'reveal',
        result: { placedOk: true, guessedOk: false, bought: true, slot: null, correctIndex: ci },
      }
    }

    case 'next': {
      if (s.phase !== 'reveal') return s
      if (p.cards.length >= s.target) return { ...s, phase: 'win', winner: s.turn, winReason: 'target' }
      const next = drawMystery({ ...s, turn: (s.turn + 1) % s.players.length }, ctx)
      return next.phase === 'win' ? next : { ...next, phase: 'handoff' }
    }
  }
}
