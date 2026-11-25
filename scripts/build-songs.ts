// Builds src/data/songs.json from scripts/songs.seed.json.
// Deezer: track id with a playable preview. Year: curated seed year, cross-checked
// against the earliest MusicBrainz first-release-date (MB alone is too noisy).
// Run: node scripts/build-songs.ts   (results cached in scripts/.cache.json)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

interface Override {
  deezerId?: number
  /** Custom Deezer search query. */
  q?: string
  /** Custom MusicBrainz recording title / artist when names differ. */
  mbTitle?: string
  mbArtist?: string
}
interface Seed {
  artist: string
  title: string
  year: number
  local?: boolean
  override?: Override
}
interface DzHit {
  id: number
  artist: string
  title: string
  exact: boolean
}

const SEED = 'scripts/songs.seed.json'
const OUT = 'src/data/songs.json'
const CACHE = 'scripts/.cache.json'
// MusicBrainz requires an identifying User-Agent and max 1 request/s.
// Contact email comes from the environment so it never lands in git.
const UA = `SpinBack/0.1 ( https://github.com/majaajhorn/SpinBack${process.env.MB_CONTACT ? ' ' + process.env.MB_CONTACT : ''} )`

const cache: { dz: Record<string, DzHit | null>; mb: Record<string, number | null> } = existsSync(CACHE)
  ? JSON.parse(readFileSync(CACHE, 'utf8'))
  : { dz: {}, mb: {} }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, 'dj') // Deezer often spells Đorđe as "Djordje"
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+-\s+.*$/, '') // "Song - Remastered 2009"
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/&/g, 'and')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]/g, '')
}

const sameArtist = (a: string, b: string) => {
  const x = norm(a)
  const y = norm(b)
  return x.includes(y) || y.includes(x)
}
const sameTitle = (a: string, b: string) => norm(a) === norm(b) || norm(a.replace(/[()]/g, '')) === norm(b.replace(/[()]/g, ''))

async function getJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers })
    if (res.ok) return res.json()
    console.error(`\n${res.status} ${url}`)
    await sleep(5000 * (attempt + 1))
  }
  throw new Error(`HTTP failed: ${url}`)
}

async function deezer(s: Seed): Promise<DzHit | null> {
  const o = s.override ?? {}
  if (o.deezerId) {
    const t = await getJson(`https://api.deezer.com/track/${o.deezerId}`)
    return t.readable && t.preview ? { id: t.id, artist: t.artist.name, title: t.title, exact: true } : null
  }
  const queries = o.q ? [o.q] : [`artist:"${s.artist}" track:"${s.title}"`, `${s.artist} ${s.title}`]
  for (const q of queries) {
    const res = await getJson(`https://api.deezer.com/search?limit=50&q=${encodeURIComponent(q)}`)
    await sleep(150)
    const playable = (res.data ?? []).filter((t: any) => t.readable && t.preview)
    const exact = playable.find((t: any) => sameArtist(t.artist.name, s.artist) && sameTitle(t.title, s.title))
    const loose = playable.find((t: any) => sameArtist(t.artist.name, s.artist) && norm(t.title).includes(norm(s.title)))
    const t = exact ?? loose
    if (t) return { id: t.id, artist: t.artist.name, title: t.title, exact: !!exact }
  }
  return null
}

async function musicbrainz(s: Seed): Promise<number | null> {
  const title = s.override?.mbTitle ?? s.title
  const artist = s.override?.mbArtist ?? s.artist
  const esc = (v: string) => v.replace(/[\\"]/g, '\\$&')
  // Official releases only, no compilations/live: drops bootleg demos and most reissues.
  const q = `recording:"${esc(title)}" AND artist:"${esc(artist)}" AND status:official AND NOT secondarytype:(compilation OR live)`
  const res = await getJson(`https://musicbrainz.org/ws/2/recording?fmt=json&limit=100&query=${encodeURIComponent(q)}`, {
    'User-Agent': UA,
  })
  await sleep(1100)
  const years = (res.recordings ?? [])
    .filter((r: any) => r['first-release-date'] && sameTitle(r.title, title))
    .filter((r: any) => sameArtist((r['artist-credit'] ?? []).map((c: any) => c.name + (c.joinphrase ?? '')).join(''), artist))
    .map((r: any) => Number(r['first-release-date'].slice(0, 4)))
  return years.length ? Math.min(...years) : null
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function main() {
  const seeds: Seed[] = JSON.parse(readFileSync(SEED, 'utf8'))
  const songs = []
  const noPreview: string[] = []
  const noMb: string[] = []
  const diff: string[] = []
  const looseDz: string[] = []
  const mbFailed: string[] = []
  const ids = new Set<string>()

  for (const [i, s] of seeds.entries()) {
    const name = `${s.artist} – ${s.title}`
    const o = s.override ?? {}
    process.stdout.write(`\r${i + 1}/${seeds.length} ${name}`.padEnd(90).slice(0, 90))

    const dzKey = `${name}|${o.q ?? ''}|${o.deezerId ?? ''}`
    if (!(dzKey in cache.dz)) cache.dz[dzKey] = await deezer(s)
    const mbKey = `v2|${o.mbArtist ?? s.artist}|${o.mbTitle ?? s.title}`
    // A failed MB lookup is not cached, so the next run retries it.
    if (!(mbKey in cache.mb)) await musicbrainz(s).then((y) => (cache.mb[mbKey] = y), () => mbFailed.push(name))
    writeFileSync(CACHE, JSON.stringify(cache))

    const dz = cache.dz[dzKey]
    const mb = cache.mb[mbKey]
    if (!dz) {
      noPreview.push(name)
      continue
    }
    if (!dz.exact) looseDz.push(`${name}  →  ${dz.artist} – ${dz.title} (${dz.id})`)
    if (mb == null) noMb.push(`${name} (seed ${s.year})`)
    else if (mb !== s.year) diff.push(`${name}: seed ${s.year}, MB ${mb}`)

    const id = slug(name)
    if (ids.has(id)) throw new Error(`Duplicate id ${id}`)
    ids.add(id)
    songs.push({
      id,
      deezerId: dz.id,
      artist: s.artist,
      title: s.title,
      year: s.year,
      local: !!s.local,
      yearSource: mb === s.year ? 'musicbrainz' : 'manual',
    })
  }

  mkdirSync('src/data', { recursive: true })
  writeFileSync(OUT, JSON.stringify(songs, null, 1) + '\n')

  const decades = new Map<number, [number, number]>()
  for (const s of songs) {
    const d = Math.floor(s.year / 10) * 10
    const c = decades.get(d) ?? [0, 0]
    c[s.local ? 1 : 0]++
    decades.set(d, c)
  }
  const section = (title: string, rows: string[]) => console.log(`\n## ${title} (${rows.length})\n${rows.join('\n')}`)
  console.log(`\n\n${songs.length}/${seeds.length} songs written to ${OUT}`)
  section('Nema previewa na Deezeru', noPreview)
  section('MusicBrainz greška (pokreni ponovno)', mbFailed)
  section('Nema u MusicBrainzu (koristi se godina iz seeda)', noMb)
  section('Razlika seed vs MB (koristi se seed, provjeri)', diff)
  section('Deezer: nije točan naslov, provjeri', looseDz)
  section(
    'Desetljeća (strane / domaće)',
    [...decades].sort().map(([d, [f, l]]) => `${d}s: ${f} / ${l}`),
  )
}

await main()
