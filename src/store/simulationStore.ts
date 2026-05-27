import { create } from 'zustand'

type SimulationSpeed = 1 | 2 | 4

interface SimulationStore {
  running: boolean
  tick: number
  speed: SimulationSpeed
  periodStartTick: number
  start: () => void
  pause: () => void
  setSpeed: (speed: SimulationSpeed) => void
  incrementTick: () => void
  startNewPeriod: () => void
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  running: false,
  tick: 0,
  speed: 1,
  periodStartTick: 0,
  start: () => set({ running: true }),
  pause: () => set({ running: false }),
  setSpeed: (speed) => set({ speed }),
  incrementTick: () => set((state) => ({ tick: state.tick + 1 })),
  startNewPeriod: () => set((state) => ({ periodStartTick: state.tick })),
}))
