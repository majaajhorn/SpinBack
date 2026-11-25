import { useCallback, useEffect, useRef, useState } from 'react'
import { MusicFailure, type MusicError, type MusicProvider } from './MusicProvider'

export type MusicStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'error'

const reasonOf = (e: unknown): MusicError => (e instanceof MusicFailure ? e.reason : 'network')

/**
 * Prepares the clip as soon as `deezerId` changes, so `play()` can run inside the tap.
 * `error` stays set (e.g. "expired, tap again") until a play succeeds or the song changes.
 * Songs without a preview call `onUnavailable` so the game can draw another one.
 */
export function useMusic(provider: MusicProvider, deezerId: number | null, onUnavailable: () => void) {
  const [attempt, setAttempt] = useState(0)
  // Status and error are tagged with what they belong to, so a new song starts clean
  // without resetting state inside an effect.
  const key = `${deezerId}:${attempt}`
  const [loaded, setLoaded] = useState<{ key: string; status: MusicStatus }>()
  const [failure, setFailure] = useState<{ id: number | null; reason: MusicError }>()
  const status: MusicStatus = deezerId === null ? 'idle' : loaded?.key === key ? loaded.status : 'loading'
  const error = failure?.id === deezerId ? failure.reason : null

  const unavailable = useRef(onUnavailable)
  useEffect(() => {
    unavailable.current = onUnavailable
  })

  useEffect(() => {
    if (deezerId === null) return
    let live = true
    const k = `${deezerId}:${attempt}`
    provider.prepare(deezerId).then(
      () => live && setLoaded({ key: k, status: 'ready' }),
      (e) => {
        if (!live) return
        const reason = reasonOf(e)
        if (reason === 'unavailable') return unavailable.current()
        setFailure({ id: deezerId, reason })
        setLoaded({ key: k, status: 'error' })
      },
    )
    return () => {
      live = false
      provider.stop()
    }
  }, [provider, deezerId, attempt])

  useEffect(() => provider.onEnded(() => setLoaded((l) => l && { ...l, status: 'ready' })), [provider])

  const play = useCallback(() => {
    provider.play().then(
      () => {
        setFailure(undefined)
        setLoaded((l) => l && { ...l, status: 'playing' })
      },
      (e) => {
        const reason = reasonOf(e)
        if (reason === 'unavailable') return unavailable.current()
        setFailure({ id: deezerId, reason })
        // Fetch a fresh clip now; the next tap plays it inside its own gesture.
        setAttempt((a) => a + 1)
      },
    )
  }, [provider, deezerId])

  const stop = useCallback(() => {
    provider.stop()
    setLoaded((l) => l && (l.status === 'playing' ? { ...l, status: 'ready' } : l))
  }, [provider])

  return { status, error, play, stop }
}
