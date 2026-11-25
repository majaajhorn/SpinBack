import { MusicFailure, type MusicProvider } from './MusicProvider'

// api.deezer.com sends no CORS headers, so the browser has to use JSONP.
const API = 'https://api.deezer.com'
const TIMEOUT_MS = 8000
// Treat a clip as expired a minute early so it cannot run out between tap and load.
const EXPIRY_MARGIN_MS = 60_000

let seq = 0

function jsonp<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const name = `__deezer${seq++}`
    const w = window as unknown as Record<string, unknown>
    const script = document.createElement('script')
    const cleanup = () => {
      clearTimeout(timer)
      script.remove()
      // A late response still calls this name; keep a no-op so it does not throw.
      w[name] = () => {}
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new MusicFailure('network'))
    }, TIMEOUT_MS)
    w[name] = (data: T) => {
      cleanup()
      resolve(data)
    }
    script.onerror = () => {
      cleanup()
      reject(new MusicFailure('network'))
    }
    script.src = `${url}?output=jsonp&callback=${name}`
    document.head.append(script)
  })
}

/** Preview URLs carry `exp=<unix seconds>`; without it assume a short life. */
export function previewExpiry(url: string, now = Date.now()): number {
  const m = /\bexp=(\d+)/.exec(url)
  return m ? Number(m[1]) * 1000 : now + 10 * 60_000
}

interface Track {
  readable?: boolean
  preview?: string
}

export class DeezerProvider implements MusicProvider {
  private audio = new Audio()
  private id: number | null = null
  private expires = 0

  constructor() {
    this.audio.preload = 'auto'
  }

  async prepare(deezerId: number): Promise<void> {
    this.stop()
    this.id = deezerId
    this.expires = 0
    const track = await jsonp<Track>(`${API}/track/${deezerId}`)
    if (this.id !== deezerId) return // a newer prepare() took over
    if (!track.readable || !track.preview) throw new MusicFailure('unavailable')
    this.audio.src = track.preview
    this.audio.load()
    this.expires = previewExpiry(track.preview)
  }

  async play(): Promise<void> {
    if (this.id === null) throw new MusicFailure('unavailable')
    if (Date.now() > this.expires - EXPIRY_MARGIN_MS) throw new MusicFailure('expired')
    this.audio.currentTime = 0
    try {
      await this.audio.play() // called before any await, so the tap still counts on iOS
    } catch (e) {
      throw new MusicFailure(e instanceof DOMException && e.name === 'NotAllowedError' ? 'blocked' : 'network')
    }
  }

  stop(): void {
    this.audio.pause()
    if (this.audio.src) this.audio.currentTime = 0
  }

  onEnded(cb: () => void): () => void {
    this.audio.addEventListener('ended', cb)
    return () => this.audio.removeEventListener('ended', cb)
  }
}
