import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'sharedspace-theme'

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'system'
  }
  const stored = window.localStorage.getItem(THEME_KEY)
  return isTheme(stored) ? stored : 'system'
}

export function getThemeInitScript() {
  return `(function(){try{var t=localStorage.getItem('${THEME_KEY}');var m=(t==='light'||t==='dark'||t==='system')?t:'system';var s=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var r=m==='system'?s:m;var e=document.documentElement;e.classList.toggle('dark',r==='dark');e.style.colorScheme=r;}catch(e){}})();`
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  useEffect(() => {
    const apply = () => {
      const resolved = theme === 'system' ? getSystemTheme() : theme
      document.documentElement.classList.toggle('dark', resolved === 'dark')
      document.documentElement.style.colorScheme = resolved
    }

    apply()
    localStorage.setItem(THEME_KEY, theme)

    if (theme !== 'system') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  return { theme, setTheme }
}
