import { create } from 'zustand'

export type PanelId =
  | 'mp-warehouse'
  | 'roasting'
  | 'grinding'
  | 'packaging'
  | 'pt-warehouse'
  | 'ecpv'
  | 'finance'
  | null

export type Theme = 'dark' | 'light'

const THEME_KEY = 'costflow_theme'

function loadTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY) as Theme | null
  return saved ?? 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
}

interface UiStore {
  activePanel: PanelId
  theme: Theme
  setActivePanel: (id: PanelId) => void
  closePanel: () => void
  toggleTheme: () => void
}

export const useUiStore = create<UiStore>((set, get) => {
  const initialTheme = loadTheme()
  applyTheme(initialTheme)

  return {
    activePanel: null,
    theme: initialTheme,
    setActivePanel: (id) => set({ activePanel: id }),
    closePanel: () => set({ activePanel: null }),
    toggleTheme: () => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      set({ theme: next })
    },
  }
})
