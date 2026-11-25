import { useEffect, useRef } from 'react'

/** Moves focus to the element when a screen appears, so keyboard and screen reader users start at the top. */
export function useFocusOnMount<T extends HTMLElement>(key?: unknown) {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [key])
  return ref
}
