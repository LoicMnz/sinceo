import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const THEME_KEY = 'sinceo.theme'
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch { return null }
}
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#191e18' : '#fafaf6')
}
function resolveTheme(preference: Theme | null): Theme {
  return preference ?? (systemTheme.matches ? 'dark' : 'light')
}
// Apply before React renders to avoid flashing the wrong theme on reload.
applyTheme(resolveTheme(savedTheme()))

export function useTheme() {
  const [preference, setPreference] = useState<Theme | null>(savedTheme)
  const [systemDark, setSystemDark] = useState(systemTheme.matches)
  const theme = preference ?? (systemDark ? 'dark' : 'light')

  useEffect(() => {
    const changed = () => setSystemDark(systemTheme.matches)
    const sync = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null) setPreference(savedTheme())
    }
    systemTheme.addEventListener('change', changed)
    window.addEventListener('storage', sync)
    return () => { systemTheme.removeEventListener('change', changed); window.removeEventListener('storage', sync) }
  }, [])
  useEffect(() => { applyTheme(theme) }, [theme])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setPreference(next)
    try { localStorage.setItem(THEME_KEY, next) }
    catch { /* The selection still applies for this session if storage is blocked. */ }
  }
  return { theme, toggleTheme }
}
