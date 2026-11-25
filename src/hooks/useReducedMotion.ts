import { useSyncExternalStore } from 'react'

const query = () => matchMedia('(prefers-reduced-motion: reduce)')

export const prefersReducedMotion = () => query().matches

export function useReducedMotion(): boolean {
  return useSyncExternalStore((onChange) => {
    const q = query()
    q.addEventListener('change', onChange)
    return () => q.removeEventListener('change', onChange)
  }, prefersReducedMotion)
}

/** Haptic tick where supported (Android); silently ignored elsewhere. */
export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Some browsers throw when vibration is blocked.
  }
}
