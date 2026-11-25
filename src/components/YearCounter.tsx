import { useEffect, useState } from 'react'
import { useReducedMotion, vibrate } from '../hooks/useReducedMotion'

const FROM = 1950
const DURATION = 850

/** Counts up to the revealed year after `delay` ms; screen readers get the final year only. */
export function YearCounter({ year, delay, good }: { year: number; delay: number; good: boolean }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState('?')

  useEffect(() => {
    if (reduced) return
    let raf = 0
    const timer = setTimeout(() => {
      const t0 = performance.now()
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / DURATION)
        const eased = 1 - (1 - k) ** 3
        setShown(String(Math.round(FROM + (year - FROM) * eased)))
        if (k < 1) raf = requestAnimationFrame(step)
        else vibrate(good ? 20 : [30, 40, 30])
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [year, delay, good, reduced])

  return (
    <>
      <span className="big-year block" aria-hidden="true">
        {reduced ? year : shown}
      </span>
      <span className="sr-only">{year}.</span>
    </>
  )
}
