import { expect, it } from 'vitest'
import { previewExpiry } from './deezer'

it('reads the expiry from a Deezer preview URL, with a fallback', () => {
  const url = 'https://cdnt-preview.dzcdn.net/api/1/x.mp3?hdnea=exp=1795623573~acl=/api/1/x.mp3*~hmac=ab'
  expect(previewExpiry(url)).toBe(1795623573000)
  expect(previewExpiry('https://example.com/a.mp3', 1000)).toBe(1000 + 10 * 60_000)
})
