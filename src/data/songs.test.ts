import { describe, expect, it } from 'vitest'
import { buildOptions } from '../game/engine'
import type { Song } from '../game/types'
import data from './songs.json'

const songs: Song[] = data

describe('songs.json', () => {
  it('has enough valid, unique songs', () => {
    expect(songs.length).toBeGreaterThanOrEqual(280)
    expect(new Set(songs.map((s) => s.id)).size).toBe(songs.length)
    expect(new Set(songs.map((s) => s.deezerId)).size).toBe(songs.length)
    for (const s of songs) {
      expect(s.deezerId).toBeGreaterThan(0)
      expect(s.year).toBeGreaterThanOrEqual(1950)
      expect(s.year).toBeLessThanOrEqual(new Date().getFullYear())
    }
  })

  it('gives every song four distinct answer options', () => {
    for (const s of songs) {
      const opts = buildOptions(s, songs, Math.random)
      expect(opts).toHaveLength(4)
      expect(new Set(opts.map((o) => o.id)).size).toBe(4)
      expect(opts).toContain(s)
    }
  })
})
