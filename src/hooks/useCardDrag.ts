import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { vibrate } from './useReducedMotion'

const MOVE_THRESHOLD = 6 // px before a press becomes a drag
const BAND_ABOVE = 110 // how far above / below the timeline a drop still counts
const BAND_BELOW = 70
const EDGE = 60 // auto-scroll zone at the timeline edges
const MAX_TILT = 14

/**
 * Drag a card onto the timeline. Returns a pointerdown handler for the draggable element.
 * Drop targets are `[data-slot]` elements inside `.timeline[data-droppable]`; the nearest one
 * horizontally becomes "hot". The ghost is a DOM clone moved outside React for 60fps.
 * Tapping + stays the keyboard and accessible way to place a card.
 */
export function useCardDrag(onDrop: (slot: number) => void) {
  const drop = useRef(onDrop)
  useEffect(() => {
    drop.current = onDrop
  })

  return useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const id = e.pointerId
    const sx = e.clientX
    const sy = e.clientY
    let x = sx
    let y = sy
    let lastX = sx
    let tilt = 0
    let ghost: HTMLElement | null = null
    let hot: HTMLElement | null = null
    let raf = 0

    const timeline = () => document.querySelector<HTMLElement>('.timeline[data-droppable]')
    const inBand = (r: DOMRect) => y > r.top - BAND_ABOVE && y < r.bottom + BAND_BELOW

    const findHot = () => {
      const tl = timeline()
      let best: HTMLElement | null = null
      if (tl && inBand(tl.getBoundingClientRect())) {
        let bestDist = Infinity
        for (const s of tl.querySelectorAll<HTMLElement>('[data-slot]')) {
          const r = s.getBoundingClientRect()
          const d = Math.abs(r.left + r.width / 2 - x)
          if (d < bestDist) {
            bestDist = d
            best = s
          }
        }
      }
      if (best === hot) return
      hot?.classList.remove('hot')
      if (best?.classList.contains('slot')) best.classList.add('hot')
      if (best) vibrate(5)
      hot = best
    }

    const autoScroll = () => {
      const tl = timeline()
      if (tl) {
        const r = tl.getBoundingClientRect()
        if (inBand(r)) {
          if (x < r.left + EDGE) tl.scrollLeft -= 10
          else if (x > r.right - EDGE) tl.scrollLeft += 10
        }
        findHot()
      }
      raf = requestAnimationFrame(autoScroll)
    }

    const start = () => {
      ghost = el.cloneNode(true) as HTMLElement
      for (const a of ['data-drag', 'data-slot', 'data-focus']) ghost.removeAttribute(a)
      ghost.classList.remove('bob', 'dropin')
      ghost.classList.add('dragghost')
      ghost.setAttribute('aria-hidden', 'true')
      Object.assign(ghost.style, { width: `${rect.width}px`, height: `${rect.height}px`, animation: 'none' })
      document.body.append(ghost)
      el.classList.add('lifted')
      document.body.classList.add('dragging')
      vibrate(10)
      raf = requestAnimationFrame(autoScroll)
    }

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return
      if (!ghost) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < MOVE_THRESHOLD) return
        start()
      }
      ev.preventDefault()
      x = ev.clientX
      y = ev.clientY
      // Tilt follows horizontal speed, smoothed so the card swings rather than jitters.
      tilt = tilt * 0.8 + Math.max(-MAX_TILT, Math.min(MAX_TILT, (x - lastX) * 1.2)) * 0.2
      lastX = x
      ghost!.style.transform = `translate(${x - (sx - rect.left)}px, ${y - (sy - rect.top)}px) rotate(${tilt}deg) scale(1.06)`
      findHot()
    }

    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', end)
      removeEventListener('pointercancel', end)
      cancelAnimationFrame(raf)
      document.body.classList.remove('dragging')
      if (!ghost) return
      const g = ghost
      hot?.classList.remove('hot')
      if (hot && ev.type === 'pointerup') {
        g.remove()
        el.classList.remove('lifted')
        vibrate(15)
        drop.current(Number(hot.dataset.slot))
        return
      }
      // Missed: fly back to where it came from.
      g.style.transition = 'transform .38s cubic-bezier(.3,1.3,.5,1)'
      g.style.transform = `translate(${rect.left}px, ${rect.top}px)`
      setTimeout(() => {
        g.remove()
        el.classList.remove('lifted')
      }, 380)
    }

    addEventListener('pointermove', move, { passive: false })
    addEventListener('pointerup', end)
    addEventListener('pointercancel', end)
  }, [])
}
