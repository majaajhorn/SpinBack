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

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') delete root.dataset.theme
  else root.dataset.theme = mode
}
