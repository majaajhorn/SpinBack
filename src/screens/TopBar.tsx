import { ScoreChips } from '../components/ScoreChips'
import { ThemeToggle } from '../components/ThemeToggle'
import type { GameState } from '../game/types'

export function TopBar({ game, popPlayer }: { game: GameState; popPlayer?: number }) {
  return (
    <div className="mb-3.5 flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <ScoreChips players={game.players} turn={game.turn} target={game.target} popPlayer={popPlayer} />
      </div>
      <ThemeToggle />
    </div>
  )
}
