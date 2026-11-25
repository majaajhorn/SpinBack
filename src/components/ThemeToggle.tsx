import { useState, type ReactNode } from 'react'
import { saveTheme, storedTheme, type ThemeMode } from '../theme'

const ORDER: ThemeMode[] = ['system', 'light', 'dark']
const LABEL: Record<ThemeMode, string> = { system: 'kao sustav', light: 'svijetla', dark: 'tamna' }

const ICON: Record<ThemeMode, ReactNode> = {
  system: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 1 0 0 18V3Z" fill="currentColor" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
}

/** Cycles system → light → dark; remembered in localStorage. */
export function ThemeToggle() {
  const [mode, setMode] = useState(storedTheme)
  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]
    setMode(next)
    saveTheme(next)
  }
  return (
    <button className="btn-icon flex-none" onClick={cycle} aria-label={`Tema: ${LABEL[mode]}. Dodirni za promjenu.`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        {ICON[mode]}
      </svg>
    </button>
  )
}
