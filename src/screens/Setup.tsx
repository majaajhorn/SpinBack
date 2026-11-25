import { useRef } from 'react'
import { ThemeToggle } from '../components/ThemeToggle'
import { useFocusOnMount } from './useFocusOnMount'

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6
const TARGETS = [5, 7, 10]

interface Props {
  names: string[]
  target: number
  onNames: (names: string[]) => void
  onTarget: (target: number) => void
  onStart: () => void
}

export function Setup({ names, target, onNames, onTarget, onStart }: Props) {
  const heading = useFocusOnMount<HTMLHeadingElement>()
  const list = useRef<HTMLDivElement>(null)

  const add = () => {
    onNames([...names, ''])
    // Focus the new field once it has rendered.
    requestAnimationFrame(() => [...(list.current?.querySelectorAll('input') ?? [])].at(-1)?.focus())
  }

  return (
    <main className="wrap">
      <header className="relative pt-7 pb-[18px]">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <h1 ref={heading} tabIndex={-1} className="text-[clamp(2.6rem,11vw,4.6rem)] leading-[.95] font-extrabold tracking-[-.03em] outline-none">
          <span className="inline-block">Spin</span>
          <span className="inline-block">Back</span>
        </h1>
        <p className="mt-3.5 max-w-[34ch] text-[1.05rem] text-muted">
          Poslušaj pjesmu i smjesti je na svoju vremensku crtu. Tko prvi složi punu crtu, pobjeđuje.
        </p>
      </header>

      <section className="panel">
        <h2>Igrači</h2>
        <div ref={list}>
          {names.map((n, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                className="field"
                value={n}
                placeholder={`Igrač ${i + 1}`}
                maxLength={16}
                aria-label={`Ime igrača ${i + 1}`}
                onChange={(e) => onNames(names.map((x, j) => (j === i ? e.target.value : x)))}
              />
              {names.length > MIN_PLAYERS && (
                <button className="btn-icon" aria-label={`Ukloni igrača ${n.trim() || i + 1}`}
                  onClick={() => onNames(names.filter((_, j) => j !== i))}>
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {names.length < MAX_PLAYERS && (
          <button className="btn-ghost" onClick={add}>
            + Dodaj igrača
          </button>
        )}
      </section>

      <section className="panel">
        <h2 id="target-label">Kartica za pobjedu</h2>
        <div className="seg" role="group" aria-labelledby="target-label">
          {TARGETS.map((t) => (
            <button key={t} aria-pressed={target === t} onClick={() => onTarget(t)}>
              {t}
            </button>
          ))}
        </div>
      </section>

      <button className="btn-primary" onClick={onStart}>
        Započni igru
      </button>

      <details className="mt-[18px] text-muted">
        <summary className="cursor-pointer py-1.5 font-semibold text-ink">Kako se igra</summary>
        <ol className="my-2 list-decimal space-y-1.5 pl-[1.2em]">
          <li>Svatko počinje s jednom otkrivenom karticom na svojoj vremenskoj crti.</li>
          <li>Kad si na redu, pusti isječak i dodirni + na mjestu gdje misliš da pjesma pripada.</li>
          <li>Zatim izaberi koja je to pjesma između četiri ponuđene.</li>
          <li>Otkrij godinu. Ako je kartica na dobrom mjestu, ostaje tvoja. Ako nije, ide van.</li>
          <li>Pogođena pjesma donosi žeton (najviše 5). Jedan žeton preskače pjesmu, tri kupuju karticu.</li>
        </ol>
      </details>
    </main>
  )
}
