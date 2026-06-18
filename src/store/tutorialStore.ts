import { create } from 'zustand'

const TUTORIAL_KEY = 'costflow_guided_tutorial_v1'

interface TutorialState {
  active: boolean
  step: number // 0 = welcome … 7 = complete
  cashBaseline: number // cash snapshot when step 6 (sell) begins

  nextStep: () => void
  skipTutorial: () => void
  restartTutorial: () => void
  setCashBaseline: (cash: number) => void
}

const TOTAL_STEPS = 8

export const useTutorialStore = create<TutorialState>((set) => ({
  active: localStorage.getItem(TUTORIAL_KEY) !== 'true',
  step: 0,
  cashBaseline: 0,

  nextStep: () =>
    set((state) => {
      const next = state.step + 1
      if (next >= TOTAL_STEPS) {
        localStorage.setItem(TUTORIAL_KEY, 'true')
        return { active: false, step: 0 }
      }
      return { step: next }
    }),

  skipTutorial: () => {
    localStorage.setItem(TUTORIAL_KEY, 'true')
    set({ active: false })
  },

  restartTutorial: () => {
    localStorage.removeItem(TUTORIAL_KEY)
    set({ active: true, step: 0, cashBaseline: 0 })
  },

  setCashBaseline: (cash) => set({ cashBaseline: cash }),
}))
