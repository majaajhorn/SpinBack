import { useReducer, useState } from 'react'
import { flushSync } from 'react-dom'
import { prefersReducedMotion } from './hooks/useReducedMotion'
import songs from './data/songs.json'
import { reduce, startGame } from './game/engine'
import type { Action, Ctx, GameState } from './game/types'
import { DeezerProvider } from './music/deezer'
import { useMusic } from './music/useMusic'
import { Game } from './screens/Game'
import { Handoff } from './screens/Handoff'
import { Setup } from './screens/Setup'
import { Win } from './screens/Win'

const CTX: Ctx = { catalog: songs, rng: Math.random }

type AppAction = Action | { type: 'setup' }
const SCREEN_CHANGES = new Set<AppAction['type']>(['start', 'ready', 'next', 'setup'])

/** `null` game = setup screen. */
function appReducer(s: GameState | null, a: AppAction): GameState | null {
  if (a.type === 'setup') return null
  if (a.type === 'start') return startGame(a.names, a.target, CTX)
  return s && reduce(s, a, CTX)
}

export default function App() {
  const [names, setNames] = useState(['', ''])
  const [target, setTarget] = useState(7)
  const [game, dispatch] = useReducer(appReducer, null)
  const [provider] = useState(() => new DeezerProvider())
  // Prepared from the handoff screen on, so the first tap on "play" starts instantly.
  const music = useMusic(provider, game?.mystery?.deezerId ?? null, () => dispatch({ type: 'unavailable' }))

  // Screen changes slide; in-screen actions (place, guess, reveal…) update in place.
  const act = (a: AppAction) => {
    if (!SCREEN_CHANGES.has(a.type) || !document.startViewTransition || prefersReducedMotion()) return dispatch(a)
    document.startViewTransition(() => flushSync(() => dispatch(a)))
  }
  const start = () => act({ type: 'start', names, target })

  if (!game) return <Setup names={names} target={target} onNames={setNames} onTarget={setTarget} onStart={start} />
  if (game.phase === 'handoff') return <Handoff game={game} onReady={() => act({ type: 'ready' })} />
  if (game.phase === 'win') return <Win game={game} onAgain={start} onSetup={() => act({ type: 'setup' })} />
  return <Game game={game} music={music} dispatch={act} />
}
