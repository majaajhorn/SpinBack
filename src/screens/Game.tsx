import { AnswerOptions } from '../components/AnswerOptions'
import { MysteryCard } from '../components/Card'
import { Timeline } from '../components/Timeline'
import { Turntable } from '../components/Turntable'
import { YearCounter } from '../components/YearCounter'
import { BUY_COST, SKIP_COST } from '../game/engine'
import { belongsText } from '../game/text'
import type { Action, GameState } from '../game/types'
import type { MusicError } from '../music/MusicProvider'
import type { useMusic } from '../music/useMusic'
import { useCardDrag } from '../hooks/useCardDrag'
import { vibrate } from '../hooks/useReducedMotion'
import { TopBar } from './TopBar'
import { useFocusOnMount } from './useFocusOnMount'

type Music = ReturnType<typeof useMusic>

const MUSIC_ERROR: Record<MusicError, string> = {
  expired: 'Isječak je osvježen. Dodirni opet.',
  blocked: 'Preglednik je zaustavio zvuk. Dodirni opet.',
  network: 'Nema veze. Dodirni opet.',
  unavailable: 'Isječak nije dostupan.',
}

interface Props {
  game: GameState
  music: Music
  dispatch: (a: Action) => void
}

export function Game({ game, music, dispatch }: Props) {
  return game.phase === 'reveal' ? (
    <Reveal game={game} onNext={() => dispatch({ type: 'next' })} />
  ) : (
    <Listen game={game} music={music} dispatch={dispatch} />
  )
}

function Listen({ game, music, dispatch }: Props) {
  const player = game.players[game.turn]
  const placed = game.slot !== null
  const playing = music.status === 'playing'
  const heading = useFocusOnMount<HTMLParagraphElement>()
  // Token actions and the reveal end this song's clip.
  const act = (a: Action) => {
    music.stop()
    dispatch(a)
  }
  const place = (slot: number | null) => {
    if (slot !== null) vibrate(15)
    dispatch({ type: 'place', slot })
  }
  const drag = useCardDrag(place)

  return (
    <main className="wrap">
      <TopBar game={game} />
      <section className="stage" aria-label="Pozornica">
        <p ref={heading} tabIndex={-1} className="mb-3 text-[1.05rem] outline-none max-[480px]:mb-2">
          Na redu je <strong className="font-display font-bold">{player.name}</strong>
        </p>
        <div className="flex items-center justify-center gap-7 max-[480px]:gap-4">
          <Turntable playing={playing} />
          {placed ? (
            <div className="flex min-h-[150px] w-[132px] max-[480px]:min-h-[128px] max-[480px]:w-[112px] items-center justify-center rounded-[14px] border-2 border-dashed border-line p-2.5 text-center text-[.85rem] text-muted">
              Kartica je na crti
            </div>
          ) : (
            <MysteryCard className="bob" hint="Povuci na crtu" onDragStart={drag} />
          )}
        </div>

        <button className="btn-play mt-4 w-full" onClick={playing ? music.stop : music.play} disabled={music.status === 'loading'}>
          {music.status === 'loading' ? 'Učitavam…' : playing ? '■ Zaustavi' : '▶ Pusti isječak'}
        </button>
        <p className="mt-2 text-center text-[.9rem] text-muted" role="status">
          {music.error && MUSIC_ERROR[music.error]}
        </p>

        {placed ? (
          <AnswerOptions options={game.options} selected={game.guess} onSelect={(id) => dispatch({ type: 'guess', songId: id })} />
        ) : (
          <div className="mt-3 flex gap-2">
            <button className="btn-secondary flex-1 text-[.9rem]" disabled={player.tokens < SKIP_COST} onClick={() => act({ type: 'skip' })}>
              Preskoči <span className="block text-[.8rem] font-normal text-muted">1 žeton</span>
            </button>
            <button className="btn-secondary flex-1 text-[.9rem]" disabled={player.tokens < BUY_COST} onClick={() => act({ type: 'buy' })}>
              Kupi karticu <span className="block text-[.8rem] font-normal text-muted">3 žetona</span>
            </button>
          </div>
        )}
      </section>

      <section className="mt-[22px]">
        <h2 className="text-base font-bold">Vremenska crta: {player.name}</h2>
        <p className="mt-1 mb-2.5 text-[.95rem] text-muted">
          {placed
            ? 'Izaberi pjesmu pa otkrij godinu. Karticu možeš i premjestiti.'
            : 'Povuci tajnu karticu na crtu ili dodirni + na željenom mjestu. Crtu možeš listati prstom.'}
        </p>
        <Timeline cards={player.cards} mode="place" slot={game.slot} onPlace={place} onDragStart={drag} />
      </section>

      <div className="bar">
        <button className="btn-primary" disabled={!placed || game.guess === null} onClick={() => act({ type: 'reveal' })}>
          Otkrij godinu
        </button>
      </div>
    </main>
  )
}

function Reveal({ game, onNext }: { game: GameState; onNext: () => void }) {
  const player = game.players[game.turn]
  const m = game.mystery!
  const r = game.result!
  const guess = game.options.find((o) => o.id === game.guess)
  const heading = useFocusOnMount<HTMLHeadingElement>()

  return (
    <main className="wrap">
      <TopBar game={game} popPlayer={r.tokenGained ? game.turn : undefined} />
      <section className="stage text-center">
        <h2 ref={heading} tabIndex={-1} className="outline-none">
          <YearCounter year={m.year} delay={r.bought ? 150 : 1000} good={r.placedOk} />
          <span className="mt-1.5 block font-body text-[1.15rem] font-bold">{m.title}</span>
          <span className="block font-body text-base font-normal text-muted">{m.artist}</span>
        </h2>

        <p className={`rise mt-4 font-bold ${r.placedOk ? 'text-teal' : 'text-bad'}`}>
          {r.bought ? 'Kartica kupljena.' : r.placedOk ? 'Točno mjesto! Kartica ostaje tvoja.' : 'Krivo mjesto, kartica ide van.'}
        </p>
        {!r.placedOk && <p className="rise text-muted">{belongsText(player.cards, r.correctIndex)}</p>}

        {!r.bought && (
          <>
            <p className={`rise mt-2 font-bold ${r.guessedOk ? 'text-teal' : 'text-bad'}`}>
              {!r.guessedOk ? 'Promašena pjesma.' : r.tokenGained ? 'Pogođena pjesma! +1 žeton' : 'Pogođena pjesma! Žetoni su već puni.'}
            </p>
            {!r.guessedOk && guess && (
              <p className="rise text-muted">
                Tvoj odgovor: {guess.artist}, {guess.title}
              </p>
            )}
          </>
        )}
      </section>

      <section className="mt-[22px]">
        <h2 className="text-base font-bold">Vremenska crta: {player.name}</h2>
        <p className="mt-1 mb-2.5 text-[.95rem] text-muted">
          {r.placedOk ? 'Nova kartica je označena.' : 'Iscrtkana kartica pokazuje gdje je pjesma trebala biti.'}
        </p>
        <Timeline cards={player.cards} mode="reveal" mystery={m} result={r} />
      </section>

      <div className="bar">
        <button className="btn-primary" onClick={onNext}>
          Dalje
        </button>
      </div>
    </main>
  )
}
