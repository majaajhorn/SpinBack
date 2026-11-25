/**
 * Why a clip could not play.
 * - unavailable: the song has no playable preview; skip it.
 * - expired: the clip URL timed out; a fresh one is being fetched, tap again.
 * - blocked: the browser refused playback outside a user gesture; tap again.
 * - network: the request or the audio failed to load.
 */
export type MusicError = 'unavailable' | 'expired' | 'blocked' | 'network'

export class MusicFailure extends Error {
  readonly reason: MusicError
  constructor(reason: MusicError) {
    super(reason)
    this.reason = reason
  }
}

export interface MusicProvider {
  /** Fetch the clip ahead of time so play() can start instantly inside a tap handler. */
  prepare(deezerId: number): Promise<void>
  /** Call synchronously from a user gesture: iOS blocks play() after an await. */
  play(): Promise<void>
  stop(): void
  /** Returns an unsubscribe function. */
  onEnded(cb: () => void): () => void
}
