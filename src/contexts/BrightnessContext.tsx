import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ThemeMode = 'dark' | 'light'

type BrightnessContextValue = {
  mode: ThemeMode
  isBrightMode: boolean
  toggleBrightness: () => void
  setMode: (mode: ThemeMode) => void
}

const BrightnessContext = createContext<BrightnessContextValue | undefined>(undefined)

const STORAGE_KEY = 'pls-auth-brightness-mode'

export const BrightnessProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'bright' ? 'light' : 'dark'
  })

  const isBrightMode = mode === 'light'

  const toggleBrightness = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode === 'light' ? 'bright' : 'dark')

    const root = document.documentElement
    root.dataset.theme = mode
    root.classList.remove('theme-dark', 'theme-light', 'dark')
    root.classList.add(mode === 'light' ? 'theme-light' : 'theme-dark')

    if (mode === 'dark') {
      root.classList.add('dark')
    }
  }, [mode])

  const value = useMemo(
    () => ({
      mode,
      isBrightMode,
      toggleBrightness,
      setMode,
    }),
    [mode, isBrightMode],
  )

  return <BrightnessContext.Provider value={value}>{children}</BrightnessContext.Provider>
}

export const useBrightness = () => {
  const context = useContext(BrightnessContext)
  if (!context) {
    throw new Error('useBrightness must be used inside BrightnessProvider')
  }
  return context
}
