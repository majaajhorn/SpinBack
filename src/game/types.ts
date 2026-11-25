export interface Song {
  id: string
  deezerId: number
  artist: string
  title: string
  /** Original release year (MusicBrainz first-release-date). */
  year: number
  /** Croatian / ex-YU song. */
  local: boolean
}

export interface Player {
  name: string
  /** Timeline, always sorted by year. */
  cards: Song[]
  tokens: number
}

export type Phase = 'handoff' | 'listen' | 'reveal' | 'win'

export interface TurnResult {
  placedOk: boolean
  guessedOk: boolean
  /** False when the guess was right but tokens were already at the max. */
  tokenGained: boolean
  bought: boolean
  /** Where the player put the card (null when bought). */
  slot: number | null
  /** Where the card belongs on the timeline before it was inserted. */
  correctIndex: number
}

export interface GameState {
  phase: Phase
  target: number
  players: Player[]
  turn: number
  deck: Song[]
  discard: Song[]
  mystery: Song | null
  /** Four answer choices for the mystery song, one of them correct. */
  options: Song[]
  slot: number | null
  guess: string | null
  result: TurnResult | null
  winner: number | null
  winReason: 'target' | 'deck' | null
}

export type Action =
  | { type: 'start'; names: string[]; target: number }
  | { type: 'ready' }
  | { type: 'place'; slot: number | null }
  | { type: 'guess'; songId: string }
  | { type: 'reveal' }
  | { type: 'skip' }
  /** The mystery song has no playable clip; replace it without cost. */
  | { type: 'unavailable' }
  | { type: 'buy' }
  | { type: 'next' }

/** Everything impure the reducer needs, injected so it stays deterministic in tests. */
export interface Ctx {
  catalog: Song[]
  rng: () => number
}
