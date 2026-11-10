import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Dark is the primary theme. "system" follows the OS preference.
const THEME_OPTIONS = ['dark', 'light', 'system']

const STORAGE_KEY = 'campus_mart_admin_theme'
const DEFAULT_THEME = 'dark'

const readStoredTheme = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    // Older builds stored editor-style theme ids ("dark-plus", "dracula"...).
    if (saved === 'light' || saved === 'system') return saved
  } catch {
    // storage unavailable
  }
  return DEFAULT_THEME
}

const systemPrefersLight = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [preference, setPreference] = useState(readStoredTheme)
  const [systemLight, setSystemLight] = useState(systemPrefersLight)

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!media) return undefined
    const onChange = (event) => setSystemLight(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolved = preference === 'system' ? (systemLight ? 'light' : 'dark') : preference

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', resolved)
    root.classList.toggle('dark', resolved === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      // storage unavailable
    }
  }, [preference, resolved])

  const setTheme = useCallback((next) => {
    if (THEME_OPTIONS.includes(next)) setPreference(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setPreference(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved])

  const value = useMemo(
    () => ({ preference, theme: resolved, isDark: resolved === 'dark', setTheme, toggleTheme }),
    [preference, resolved, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
