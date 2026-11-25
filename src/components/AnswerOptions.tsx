import type { Song } from '../game/types'

export function AnswerOptions({
  options,
  selected,
  onSelect,
}: {
  options: Song[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <fieldset className="mt-3">
      <legend className="mb-2 font-semibold">Tko pjeva?</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button key={o.id} className="answer" aria-pressed={selected === o.id} onClick={() => onSelect(o.id)}>
            <span className="answer-artist">{o.artist}</span>
            <span className="answer-title">{o.title}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
