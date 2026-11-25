import { useReducer, useState } from 'react'
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

/** `null` game = setup screen. */
function appReducer(s: GameState | null, a: Action | { type: 'setup' }): GameState | null {
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
  const start = () => dispatch({ type: 'start', names, target })

  if (!game) return <Setup names={names} target={target} onNames={setNames} onTarget={setTarget} onStart={start} />
  if (game.phase === 'handoff') return <Handoff game={game} onReady={() => dispatch({ type: 'ready' })} />
  if (game.phase === 'win') return <Win game={game} onAgain={start} onSetup={() => dispatch({ type: 'setup' })} />
  return <Game game={game} music={music} dispatch={dispatch} />
}
