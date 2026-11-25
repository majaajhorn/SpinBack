import { describe, expect, it } from 'vitest'
import {
  BUY_COST, MAX_TOKENS, OPTION_COUNT, START_TOKENS,
  buildOptions, correctIndex, decadeOf, isPlacementOk, reduce, startGame,
} from './engine'
import type { Action, Ctx, GameState, Song } from './types'

function rng(seed = 1) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let n = 0
const song = (year: number, local = false, artist = `Artist ${++n}`): Song =>
  ({ id: `s${++n}`, deezerId: n, artist, title: `Song ${n}`, year, local })

const catalog: Song[] = [
  ...[1961, 1964, 1967, 1969, 1975, 1977, 1978, 1983, 1984, 1986, 1988, 1991, 1995, 1999, 2003, 2008, 2013, 2019]
    .map((y) => song(y)),
  ...[1978, 1980, 1981, 1984, 1986, 1989, 1996, 2004].map((y) => song(y, true)),
]
const ctx = (seed = 1): Ctx => ({ catalog, rng: rng(seed) })

/** Game in the listen phase with a fixed timeline and mystery song for the current player. */
function listening(cards: number[], mysteryYear: number, tokens = START_TOKENS): GameState {
  const s = startGame(['Ana', 'Ivo'], 7, ctx())
  const mystery = song(mysteryYear)
  const players = s.players.map((p, i) => (i === 0 ? { ...p, cards: cards.map((y) => song(y)), tokens } : p))
  return { ...s, phase: 'listen', players, mystery, options: buildOptions(mystery, catalog, rng()) }
}

const run = (s: GameState, ...actions: Action[]) => actions.reduce((acc, a) => reduce(acc, a, ctx()), s)

describe('timeline helpers', () => {
  const cards = [1970, 1980, 1980, 1990].map((y) => song(y))

  it('correctIndex puts equal years after existing ones', () => {
    expect(correctIndex(cards, 1960)).toBe(0)
    expect(correctIndex(cards, 1980)).toBe(3)
    expect(correctIndex(cards, 2000)).toBe(4)
    expect(correctIndex([], 1990)).toBe(0)
  })

  it('placement is ok on both edges and on either side of an equal year', () => {
    expect(isPlacementOk(cards, 0, 1960)).toBe(true)
    expect(isPlacementOk(cards, 4, 2000)).toBe(true)
    expect(isPlacementOk(cards, 1, 1980)).toBe(true)
    expect(isPlacementOk(cards, 3, 1980)).toBe(true)
    expect(isPlacementOk(cards, 0, 1975)).toBe(false)
    expect(isPlacementOk(cards, 4, 1985)).toBe(false)
  })
})

describe('buildOptions', () => {
  it('returns 4 unique songs by different artists, including the mystery', () => {
    for (let seed = 1; seed < 30; seed++) {
      const mystery = catalog[seed % catalog.length]
      const opts = buildOptions(mystery, catalog, rng(seed))
      expect(opts).toHaveLength(OPTION_COUNT)
      expect(opts).toContain(mystery)
      expect(new Set(opts.map((o) => o.id)).size).toBe(OPTION_COUNT)
      expect(new Set(opts.map((o) => o.artist.toLowerCase())).size).toBe(OPTION_COUNT)
    }
  })

  it('prefers the same decade and group', () => {
    const mystery = catalog.find((s) => s.year === 1984 && !s.local)!
    const opts = buildOptions(mystery, catalog, rng(3))
    for (const o of opts) {
      expect(decadeOf(o.year)).toBe(1980)
      expect(o.local).toBe(false)
    }
  })

  it('falls back to other decades when the decade is too small', () => {
    const mystery = catalog.find((s) => s.year === 2004 && s.local)!
    const opts = buildOptions(mystery, catalog, rng(5))
    expect(opts).toHaveLength(OPTION_COUNT)
    expect(opts.every((o) => o.local)).toBe(true)
  })

  it('never offers the same artist twice even with a duplicate in the catalog', () => {
    const dup = [song(1984, false, 'Queen'), song(1985, false, 'queen'), ...catalog]
    const opts = buildOptions(dup[0], dup, rng(7))
    expect(opts.filter((o) => o.artist.toLowerCase() === 'queen')).toHaveLength(1)
  })
})

describe('startGame', () => {
  it('deals one card and start tokens to each player and draws a mystery', () => {
    const s = startGame(['Ana', '  ', 'Ivo'], 5, ctx())
    expect(s.phase).toBe('handoff')
    expect(s.players.map((p) => p.name)).toEqual(['Ana', 'Igrač 2', 'Ivo'])
    expect(s.players.every((p) => p.cards.length === 1 && p.tokens === START_TOKENS)).toBe(true)
    expect(s.mystery).not.toBeNull()
    expect(s.options).toContain(s.mystery)
    expect(s.deck.length + 3 + 1).toBe(catalog.length)
  })
})

describe('turn flow', () => {
  it('reveal needs both a slot and a guess', () => {
    const s = listening([1980], 1990)
    expect(run(s, { type: 'reveal' }).phase).toBe('listen')
    expect(run(s, { type: 'place', slot: 1 }, { type: 'reveal' }).phase).toBe('listen')
    expect(run(s, { type: 'place', slot: 1 }, { type: 'guess', songId: s.mystery!.id }, { type: 'reveal' }).phase)
      .toBe('reveal')
  })

  it('rejects out-of-range slots and unknown guesses', () => {
    const s = listening([1980], 1990)
    expect(run(s, { type: 'place', slot: 5 }).slot).toBeNull()
    expect(run(s, { type: 'guess', songId: 'nope' }).guess).toBeNull()
  })

  it('correct placement and guess keeps the card and gives a token', () => {
    const s = listening([1970, 1990], 1980)
    const r = run(s, { type: 'place', slot: 1 }, { type: 'guess', songId: s.mystery!.id }, { type: 'reveal' })
    expect(r.result).toMatchObject({ placedOk: true, guessedOk: true, tokenGained: true, correctIndex: 1 })
    expect(r.players[0].cards.map((c) => c.year)).toEqual([1970, 1980, 1990])
    expect(r.players[0].tokens).toBe(START_TOKENS + 1)
  })

  it('wrong placement discards the card but a correct guess still pays', () => {
    const s = listening([1970, 1990], 1980)
    const r = run(s, { type: 'place', slot: 0 }, { type: 'guess', songId: s.mystery!.id }, { type: 'reveal' })
    expect(r.result).toMatchObject({ placedOk: false, guessedOk: true, slot: 0, correctIndex: 1 })
    expect(r.players[0].cards).toHaveLength(2)
    expect(r.discard).toContain(s.mystery)
    expect(r.players[0].tokens).toBe(START_TOKENS + 1)
  })

  it('wrong guess gives no token; tokens never exceed the max', () => {
    const s = listening([1970], 1980, MAX_TOKENS)
    const wrong = s.options.find((o) => o.id !== s.mystery!.id)!
    const r1 = run(s, { type: 'place', slot: 1 }, { type: 'guess', songId: wrong.id }, { type: 'reveal' })
    expect(r1.players[0].tokens).toBe(MAX_TOKENS)
    const r2 = run(s, { type: 'place', slot: 1 }, { type: 'guess', songId: s.mystery!.id }, { type: 'reveal' })
    expect(r2.players[0].tokens).toBe(MAX_TOKENS)
    expect(r2.result).toMatchObject({ guessedOk: true, tokenGained: false })
  })

  it('next passes the turn and goes to handoff with a new song', () => {
    const s = listening([1970], 1980)
    const r = run(s, { type: 'place', slot: 1 }, { type: 'guess', songId: s.mystery!.id }, { type: 'reveal' }, { type: 'next' })
    expect(r.phase).toBe('handoff')
    expect(r.turn).toBe(1)
    expect(r.mystery).not.toBe(s.mystery)
    expect(r.slot).toBeNull()
    expect(r.guess).toBeNull()
  })

  it('reaching the target wins', () => {
    const s = { ...listening([1960, 1970, 1990], 1980), target: 4 }
    const r = run(s, { type: 'place', slot: 2 }, { type: 'guess', songId: s.mystery!.id }, { type: 'reveal' }, { type: 'next' })
    expect(r).toMatchObject({ phase: 'win', winner: 0, winReason: 'target' })
  })
})

describe('tokens', () => {
  it('skip costs 1 token and draws a new song in the same turn', () => {
    const s = listening([1970], 1980)
    const r = run(s, { type: 'skip' })
    expect(r.phase).toBe('listen')
    expect(r.turn).toBe(0)
    expect(r.players[0].tokens).toBe(START_TOKENS - 1)
    expect(r.discard).toContain(s.mystery)
    expect(r.mystery).not.toBe(s.mystery)
  })

  it('skip without tokens does nothing', () => {
    const s = listening([1970], 1980, 0)
    expect(run(s, { type: 'skip' })).toBe(s)
  })

  it('buy costs 3 tokens and inserts the card at the right spot', () => {
    const s = listening([1970, 1990], 1980, BUY_COST)
    const r = run(s, { type: 'buy' })
    expect(r.phase).toBe('reveal')
    expect(r.players[0].tokens).toBe(0)
    expect(r.players[0].cards.map((c) => c.year)).toEqual([1970, 1980, 1990])
    expect(r.result).toMatchObject({ bought: true, placedOk: true, guessedOk: false })
  })

  it('buy with fewer than 3 tokens does nothing', () => {
    const s = listening([1970], 1980, BUY_COST - 1)
    expect(run(s, { type: 'buy' })).toBe(s)
  })

  it('unavailable song is replaced for free and leaves the game', () => {
    const s = listening([1970], 1980, 0)
    const r = run(s, { type: 'unavailable' })
    expect(r.phase).toBe('listen')
    expect(r.players[0].tokens).toBe(0)
    expect(r.mystery).not.toBe(s.mystery)
    expect(r.discard).not.toContain(s.mystery)
    expect(run({ ...s, phase: 'handoff' }, { type: 'unavailable' }).phase).toBe('handoff')
  })
})

describe('running out of songs', () => {
  it('reshuffles the discard pile when the deck is empty', () => {
    const s = { ...listening([1970], 1980), deck: [], discard: [song(1999)] }
    const r = run(s, { type: 'skip' })
    expect(r.phase).toBe('listen')
    // The skipped song goes to the discard pile first, so it is reshuffled too.
    expect([1980, 1999]).toContain(r.mystery?.year)
    expect(r.deck).toHaveLength(1)
    expect(r.discard).toEqual([])
  })

  it('ends the game when deck and discard are both empty; most cards wins', () => {
    const base = listening([1960, 1970], 1980)
    const s = { ...base, deck: [], discard: [] }
    const r = run(s, { type: 'place', slot: 2 }, { type: 'guess', songId: s.mystery!.id }, { type: 'reveal' }, { type: 'next' })
    expect(r).toMatchObject({ phase: 'win', winner: 0, winReason: 'deck' })
  })
})

describe('phase guards', () => {
  it('ignores actions from the wrong phase', () => {
    const s = startGame(['Ana', 'Ivo'], 7, ctx())
    expect(run(s, { type: 'place', slot: 0 })).toBe(s)
    expect(run(s, { type: 'next' })).toBe(s)
    expect(run(s, { type: 'ready' }).phase).toBe('listen')
  })
})
