import { describe, it, expect, beforeEach } from 'vitest'
import { useGamificationStore } from './gamificationStore'
import { ACHIEVEMENTS } from '@/constants/gameBalance'
import type { DynamicEvent } from '@/types'

const makeEvent = (id: string, appliedAtTick = 0, duration = 30): DynamicEvent => ({
  id,
  type: 'supplier_crisis',
  severity: 'medium',
  title: 'Test',
  description: 'Test event',
  effectDurationTicks: duration,
  appliedAtTick,
})

describe('gamificationStore', () => {
  beforeEach(() => {
    useGamificationStore.setState({
      xp: 0,
      level: 1,
      achievements: ACHIEVEMENTS.map((a) => ({ ...a })),
      activeEvents: [],
    })
  })

  describe('addXP', () => {
    it('increases xp', () => {
      useGamificationStore.getState().addXP(100)
      expect(useGamificationStore.getState().xp).toBe(100)
    })

    it('advances level when XP crosses threshold', () => {
      useGamificationStore.getState().addXP(150)
      expect(useGamificationStore.getState().level).toBe(2)
    })

    it('reaches level 8 at max XP', () => {
      useGamificationStore.getState().addXP(4_500)
      expect(useGamificationStore.getState().level).toBe(8)
    })
  })

  describe('unlockAchievement', () => {
    it('sets unlockedAtTick on the matching achievement', () => {
      useGamificationStore.getState().unlockAchievement('first-purchase', 5)
      const a = useGamificationStore.getState().achievements.find((x) => x.id === 'first-purchase')
      expect(a?.unlockedAtTick).toBe(5)
    })

    it('does not overwrite an already-unlocked achievement', () => {
      useGamificationStore.getState().unlockAchievement('first-purchase', 5)
      useGamificationStore.getState().unlockAchievement('first-purchase', 99)
      const a = useGamificationStore.getState().achievements.find((x) => x.id === 'first-purchase')
      expect(a?.unlockedAtTick).toBe(5)
    })
  })

  describe('isAchievementUnlocked', () => {
    it('returns false before unlock', () => {
      expect(useGamificationStore.getState().isAchievementUnlocked('first-order')).toBe(false)
    })

    it('returns true after unlock', () => {
      useGamificationStore.getState().unlockAchievement('first-order', 10)
      expect(useGamificationStore.getState().isAchievementUnlocked('first-order')).toBe(true)
    })
  })

  describe('triggerEvent / resolveEvent', () => {
    it('adds event to activeEvents', () => {
      useGamificationStore.getState().triggerEvent(makeEvent('e1'))
      expect(useGamificationStore.getState().activeEvents).toHaveLength(1)
    })

    it('resolveEvent removes event by id', () => {
      useGamificationStore.getState().triggerEvent(makeEvent('e1'))
      useGamificationStore.getState().resolveEvent('e1')
      expect(useGamificationStore.getState().activeEvents).toHaveLength(0)
    })
  })

  describe('expireEvents', () => {
    it('removes events past their duration', () => {
      // event applied at tick 0, duration 10 → expires at tick 10+
      useGamificationStore.getState().triggerEvent(makeEvent('e1', 0, 10))
      useGamificationStore.getState().expireEvents(10)
      expect(useGamificationStore.getState().activeEvents).toHaveLength(0)
    })

    it('keeps events that are still within their duration', () => {
      useGamificationStore.getState().triggerEvent(makeEvent('e1', 0, 30))
      useGamificationStore.getState().expireEvents(5)
      expect(useGamificationStore.getState().activeEvents).toHaveLength(1)
    })
  })
})
