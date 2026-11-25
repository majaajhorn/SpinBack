import type { GameState } from '../game/types'
import { TopBar } from './TopBar'
import { useFocusOnMount } from './useFocusOnMount'

export function Handoff({ game, onReady }: { game: GameState; onReady: () => void }) {
  const button = useFocusOnMount<HTMLButtonElement>(game.turn)
  return (
    <main className="wrap">
      <TopBar game={game} />
      <div className="center">
        <p className="m-0 text-muted">Predaj uređaj igraču</p>
        <h1 className="headline">{game.players[game.turn].name}</h1>
        <button ref={button} className="btn-primary min-w-60" onClick={onReady}>
          Kreni
        </button>
      </div>
    </main>
  )
}
