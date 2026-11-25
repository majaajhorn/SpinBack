import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]
const COUNT = 160
const DURATION = 3200

/** One burst of confetti in the decade colours. Skipped under reduced motion. */
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx || reduced) return
    const dpr = devicePixelRatio || 1
    const W = (cv.width = innerWidth * dpr)
    const H = (cv.height = innerHeight * dpr)
    const css = getComputedStyle(document.documentElement)
    const colors = DECADES.map((d) => css.getPropertyValue(`--d-${d}`).trim())
    const parts = Array.from({ length: COUNT }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3,
      y: H * 0.35,
      vx: (Math.random() - 0.5) * 16 * dpr,
      vy: (-Math.random() * 14 - 6) * dpr,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      w: (6 + Math.random() * 6) * dpr,
      h: (10 + Math.random() * 8) * dpr,
      c: colors[Math.floor(Math.random() * colors.length)],
    }))
    const t0 = performance.now()
    let raf = 0
    const frame = (now: number) => {
      ctx.clearRect(0, 0, W, H)
      for (const p of parts) {
        p.vy += 0.35 * dpr
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.r += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.r)
        ctx.fillStyle = p.c
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)))
        ctx.restore()
      }
      if (now - t0 < DURATION) raf = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-60 h-full w-full" aria-hidden="true" />
}
