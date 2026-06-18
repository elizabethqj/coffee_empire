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
const ONBOARDING_KEY = 'costflow_onboarding_done'

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
  onboardingStep: number | null // null = done, 0-4 = active step
  setActivePanel: (id: PanelId) => void
  closePanel: () => void
  toggleTheme: () => void
  setOnboardingStep: (step: number | null) => void
  startOnboarding: () => void
  finishOnboarding: () => void
}

export const useUiStore = create<UiStore>((set, get) => {
  const initialTheme = loadTheme()
  applyTheme(initialTheme)

  const onboardingDone = localStorage.getItem(ONBOARDING_KEY) === 'true'

  return {
    activePanel: null,
    theme: initialTheme,
    onboardingStep: onboardingDone ? null : 0,
    setActivePanel: (id) => set({ activePanel: id }),
    closePanel: () => set({ activePanel: null }),
    toggleTheme: () => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      set({ theme: next })
    },
    setOnboardingStep: (step) => set({ onboardingStep: step }),
    startOnboarding: () => set({ onboardingStep: 0 }),
    finishOnboarding: () => {
      localStorage.setItem(ONBOARDING_KEY, 'true')
      set({ onboardingStep: null })
    },
  }
})
