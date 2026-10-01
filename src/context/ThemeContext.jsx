import { createContext, useContext, useState, useEffect } from 'react'

export const ACCENT_COLORS = [
  {
    id: 'blue',
    name: 'Ocean Blue',
    colorHex: '#2563eb',
    palette: {
      50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253',
      400: '96 165 250', 500: '59 130 246', 600: '37 99 235', 700: '29 78 216',
      800: '30 64 175', 900: '30 58 138', 950: '23 37 84',
    }
  },
  {
    id: 'indigo',
    name: 'Electric Indigo',
    colorHex: '#4f46e5',
    palette: {
      50: '238 242 255', 100: '224 231 255', 200: '199 210 254', 300: '165 180 252',
      400: '129 140 248', 500: '99 102 241', 600: '79 70 229', 700: '67 56 202',
      800: '55 48 163', 900: '49 46 129', 950: '30 27 75',
    }
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    colorHex: '#059669',
    palette: {
      50: '236 253 245', 100: '209 250 229', 200: '167 243 208', 300: '110 231 183',
      400: '52 211 153', 500: '16 185 129', 600: '5 150 105', 700: '4 120 87',
      800: '6 95 70', 900: '6 78 59', 950: '2 44 34',
    }
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    colorHex: '#7c3aed',
    palette: {
      50: '245 243 255', 100: '237 233 254', 200: '221 214 254', 300: '196 181 253',
      400: '167 139 250', 500: '139 92 246', 600: '124 58 237', 700: '109 40 217',
      800: '91 33 182', 900: '76 29 149', 950: '46 16 101',
    }
  },
  {
    id: 'rose',
    name: 'Ruby Rose',
    colorHex: '#e11d48',
    palette: {
      50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175',
      400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 700: '190 18 60',
      800: '159 18 57', 900: '136 19 55', 950: '76 5 25',
    }
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    colorHex: '#d97706',
    palette: {
      50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77',
      400: '251 191 36', 500: '245 158 11', 600: '217 119 6', 700: '180 83 9',
      800: '146 64 14', 900: '120 53 15', 950: '69 26 3',
    }
  },
  {
    id: 'cyan',
    name: 'Cyan Teal',
    colorHex: '#0891b2',
    palette: {
      50: '236 254 255', 100: '207 250 254', 200: '165 243 252', 300: '103 232 249',
      400: '34 211 238', 500: '6 182 212', 600: '8 145 178', 700: '14 116 144',
      800: '21 94 117', 900: '22 78 99', 950: '8 51 68',
    }
  },
]

export const applyThemeClass = (mode) => {
  if (typeof document === 'undefined') return false
  let dark = false
  if (mode === 'dark') {
    dark = true
  } else if (mode === 'light') {
    dark = false
  } else {
    dark = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  }

  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  return dark
}

export const applyAccentPalette = (accentId) => {
  if (typeof document === 'undefined') return
  const selected = ACCENT_COLORS.find(c => c.id === accentId) || ACCENT_COLORS[0]
  const root = document.documentElement

  Object.entries(selected.palette).forEach(([key, value]) => {
    root.style.setProperty(`--color-primary-${key}`, value)
  })
  root.style.setProperty('--color-primary-hex', selected.colorHex)
}

// Apply immediately on script execution to avoid delay/FOUT
if (typeof window !== 'undefined') {
  try {
    const initialMode = localStorage.getItem('theme_mode') || 'system'
    const initialAccent = localStorage.getItem('theme_accent') || 'blue'
    applyThemeClass(initialMode)
    applyAccentPalette(initialAccent)
  } catch {}
}

const ThemeContext = createContext({})

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('theme_mode') || 'system'
  })

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('theme_accent') || 'blue'
  })

  // Determine initial dark state
  const [isDark, setIsDark] = useState(() => {
    return applyThemeClass(localStorage.getItem('theme_mode') || 'system')
  })

  // Sync mode changes to document
  useEffect(() => {
    const dark = applyThemeClass(themeMode)
    setIsDark(dark)
    localStorage.setItem('theme_mode', themeMode)

    // Listen to OS changes when in system mode
    if (themeMode === 'system' && typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => {
        const d = applyThemeClass('system')
        setIsDark(d)
      }
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
  }, [themeMode])

  // Sync accent color CSS variables
  useEffect(() => {
    applyAccentPalette(accentColor)
    localStorage.setItem('theme_accent', accentColor)
  }, [accentColor])

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{
      isDark,
      themeMode,
      setThemeMode,
      accentColor,
      setAccentColor,
      toggleTheme,
      accentColors: ACCENT_COLORS,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
