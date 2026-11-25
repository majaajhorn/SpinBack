import { Confetti } from '../components/Confetti'
import { Timeline } from '../components/Timeline'
import type { GameState } from '../game/types'
import { TopBar } from './TopBar'
import { useFocusOnMount } from './useFocusOnMount'

export function Win({ game, onAgain, onSetup }: { game: GameState; onAgain: () => void; onSetup: () => void }) {
  const heading = useFocusOnMount<HTMLHeadingElement>()
  const winner = game.players[game.winner ?? 0]
  return (
    <main className="wrap">
      <Confetti />
      <TopBar game={game} />
      <div className="center">
        <p className="m-0 text-muted">{game.winReason === 'deck' ? 'Špil je potrošen' : 'Puna vremenska crta'}</p>
        <h1 ref={heading} tabIndex={-1} className="headline outline-none">
          {winner.name} pobjeđuje!
        </h1>
        <div className="max-w-full">
          <Timeline cards={winner.cards} mode="static" />
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <button className="btn-primary w-auto min-w-60" onClick={onAgain}>
            Nova partija
          </button>
          <button className="btn-secondary" onClick={onSetup}>
            Promijeni igrače
          </button>
        </div>
      </div>
    </main>
  )
}
