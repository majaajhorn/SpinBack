import { useState } from 'react'
import songs from './data/songs.json'
import { DeezerProvider } from './music/deezer'
import { useMusic } from './music/useMusic'

// Placeholder until phase 4: theme tokens plus a clip tester for the Deezer provider.
const randomSong = () => songs[Math.floor(Math.random() * songs.length)]

function ClipTester() {
  const [provider] = useState(() => new DeezerProvider())
  const [song, setSong] = useState(randomSong)
  const { status, error, play, stop } = useMusic(provider, song.deezerId, () => setSong(randomSong()))
  return (
    <section className="mt-6 rounded-2xl bg-surface p-4" aria-live="polite">
      <p className="font-bold">
        {song.artist} – {song.title} ({song.year})
      </p>
      <p className="text-muted">
        {status}
        {error && ` · ${error} – dodirni opet`}
      </p>
      <div className="mt-3 flex gap-2">
        <button className="rounded-xl bg-pink px-4 py-2 font-bold text-on-accent" onClick={status === 'playing' ? stop : play}
          disabled={status === 'loading'}>
          {status === 'playing' ? 'Stop' : 'Sviraj'}
        </button>
        <button className="rounded-xl px-4 py-2 font-bold" onClick={() => setSong(randomSong())}>
          Druga pjesma
        </button>
      </div>
    </section>
  )
}

const DECADES = ['bg-d-1950', 'bg-d-1960', 'bg-d-1970', 'bg-d-1980', 'bg-d-1990', 'bg-d-2000', 'bg-d-2010', 'bg-d-2020']

export default function App() {
  return (
    <main className="mx-auto max-w-[760px] px-[18px] py-5">
      <header className="pt-7 pb-[18px]">
        <h1 className="text-[clamp(2.6rem,11vw,4.6rem)] leading-[.95] font-extrabold tracking-[-.03em]">
          SpinBack
        </h1>
        <p className="mt-3.5 max-w-[34ch] text-[1.05rem] text-muted">
          Poslušaj pjesmu i smjesti je na svoju vremensku crtu.
        </p>
      </header>
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {DECADES.map((c, i) => (
          <span key={c} className={`${c} rounded-xl px-3 py-2 font-display font-extrabold text-white`}>
            {1950 + i * 10}
          </span>
        ))}
      </div>
      <button className="mt-6 w-full rounded-2xl bg-pink p-4 text-[1.05rem] font-bold text-on-accent">
        Započni igru
      </button>
      <ClipTester />
    </main>
  )
}
