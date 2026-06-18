import { create } from 'zustand'
import type { GameLevel, Achievement, DynamicEvent } from '@/types'
import { ACHIEVEMENTS, XP_LEVEL_THRESHOLD } from '@/constants/gameBalance'

interface GamificationStore {
  xp: number
  level: GameLevel
  achievements: Achievement[]
  activeEvents: DynamicEvent[]
  pendingEventDecision: DynamicEvent | null
  eventsResolvedThisSession: number

  addXP: (amount: number) => void
  unlockAchievement: (id: string, tick: number) => void
  triggerEvent: (event: DynamicEvent) => void
  resolveEvent: (eventId: string) => void
  expireEvents: (currentTick: number) => void
  isAchievementUnlocked: (id: string) => boolean
  setPendingEventDecision: (event: DynamicEvent | null) => void
  resolveEventWithResponse: (eventId: string, responseId: 'A' | 'B' | 'C') => void
}

function computeLevel(xp: number): GameLevel {
  const levels = [8, 7, 6, 5, 4, 3, 2, 1] as GameLevel[]
  for (const level of levels) {
    if (xp >= XP_LEVEL_THRESHOLD[level]) return level
  }
  return 1
}

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  xp: 0,
  level: 1,
  achievements: ACHIEVEMENTS.map((a) => ({ ...a })),
  activeEvents: [],
  pendingEventDecision: null,
  eventsResolvedThisSession: 0,

  addXP: (amount) =>
    set((state) => {
      const xp = state.xp + amount
      return { xp, level: computeLevel(xp) }
    }),

  unlockAchievement: (id, tick) =>
    set((state) => ({
      achievements: state.achievements.map((a) =>
        a.id === id && a.unlockedAtTick === null ? { ...a, unlockedAtTick: tick } : a
      ),
    })),

  triggerEvent: (event) => set((state) => ({ activeEvents: [...state.activeEvents, event] })),

  resolveEvent: (eventId) =>
    set((state) => ({
      activeEvents: state.activeEvents.filter((e) => e.id !== eventId),
    })),

  expireEvents: (currentTick) =>
    set((state) => ({
      activeEvents: state.activeEvents.filter(
        (e) => currentTick < e.appliedAtTick + e.effectDurationTicks
      ),
    })),

  isAchievementUnlocked: (id) =>
    get().achievements.some((a) => a.id === id && a.unlockedAtTick !== null),

  setPendingEventDecision: (event) => set({ pendingEventDecision: event }),

  resolveEventWithResponse: (eventId, responseId) =>
    set((state) => ({
      activeEvents: state.activeEvents.map((e) =>
        e.id === eventId ? { ...e, chosenResponseId: responseId } : e
      ),
      pendingEventDecision: null,
      eventsResolvedThisSession: state.eventsResolvedThisSession + 1,
    })),
}))
