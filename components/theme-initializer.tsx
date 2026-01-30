'use client'

import { useEffect } from 'react'

/**
 * ThemeInitializer - Restores saved theme preferences on app load
 * 
 * This component runs on initial mount and applies the saved color theme
 * and mode from localStorage to the document root element.
 */
export function ThemeInitializer() {
  useEffect(() => {
    // Restore color theme
    const savedColorTheme = localStorage.getItem('ro-color-theme')
    if (savedColorTheme && savedColorTheme !== 'default') {
      document.documentElement.classList.add(`theme-${savedColorTheme}`)
    }

    // Restore mode (light/dark/system)
    const savedMode = localStorage.getItem('ro-mode')
    if (savedMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (savedMode === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // Listen for system preference changes if in 'system' mode
    if (!savedMode || savedMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // This component doesn't render anything
  return null
}
