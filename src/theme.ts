export type ThemeMode = 'system' | 'light' | 'dark'

const KEY = 'spinback-theme'

export function storedTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

export function saveTheme(mode: ThemeMode) {
  applyTheme(mode)
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    // Private mode: the choice just isn't remembered.
  }
}

// Browser / status bar colour per theme (page background), same values as tokens.css.
const BAR: Record<'light' | 'dark', string> = { light: '#E4EDE8', dark: '#101928' }

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') delete root.dataset.theme
  else root.dataset.theme = mode
  // index.html has one theme-color meta per colour scheme; a forced theme overrides both.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const scheme = meta.media.includes('dark') ? 'dark' : 'light'
    meta.content = BAR[mode === 'system' ? scheme : mode]
  }
}
