'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true)
    
    // Get saved theme or default to system
    const savedTheme = localStorage.getItem('theme') as Theme
    const initialTheme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'system'
    
    setTheme(initialTheme)
    
    // Set initial resolved theme
    if (initialTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setResolvedTheme(systemPrefersDark ? 'dark' : 'light')
    } else {
      setResolvedTheme(initialTheme)
    }
  }, [])

  // Update resolved theme when theme changes
  useEffect(() => {
    if (!mounted) return

    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setResolvedTheme(systemPrefersDark ? 'dark' : 'light')
    } else {
      setResolvedTheme(theme)
    }
  }, [theme, mounted])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
  }, [resolvedTheme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const systemPrefersDark = mediaQuery.matches
      setResolvedTheme(systemPrefersDark ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  // Save theme to localStorage
  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    if (mounted) {
      localStorage.setItem('theme', newTheme)
    }
  }

  const value = {
    theme,
    resolvedTheme,
    setTheme: handleSetTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
