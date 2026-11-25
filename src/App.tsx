// Phase 0 placeholder: shows tokens and fonts so the setup can be checked in both themes.
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
    </main>
  )
}
