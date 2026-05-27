import { describe, it, expect, beforeEach } from 'vitest'
import { checkAchievements } from './achievementTracker'
import { useInventoryStore } from '@/store/inventoryStore'
import { useProductionStore } from '@/store/productionStore'
import { useFinanceStore } from '@/store/financeStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { ACHIEVEMENTS } from '@/constants/gameBalance'

function resetStores() {
  useInventoryStore.setState({
    items: {
      'green-beans': { id: 'green-beans', name: 'Green Coffee Beans', category: 'MP', quantity: 0, unitCost: 2500, maxCapacity: 200 },
    },
    totalPurchasesThisPeriod: 0,
    periodStartSnapshot: null,
  })
  useProductionStore.setState({ orders: [] })
  useFinanceStore.setState({
    state: {
      rawMaterialCost: 0, laborCost: 0, cifCost: 0,
      cifBreakdown: { energy: 0, maintenance: 0, waste: 0 },
      productionCost: 0, revenue: 0, salesCost: 0, profit: 0,
    },
  })
  useGamificationStore.setState({
    xp: 0,
    level: 1,
    achievements: ACHIEVEMENTS.map((a) => ({ ...a })),
    activeEvents: [],
  })
}

describe('checkAchievements', () => {
  beforeEach(resetStores)

  it('unlocks first-purchase when totalPurchasesThisPeriod > 0', () => {
    useInventoryStore.setState({ totalPurchasesThisPeriod: 1000, items: {}, periodStartSnapshot: null })
    checkAchievements(1)
    const a = useGamificationStore.getState().achievements.find((x) => x.id === 'first-purchase')
    expect(a?.unlockedAtTick).toBe(1)
  })

  it('does not re-unlock first-purchase if already unlocked', () => {
    useInventoryStore.setState({ totalPurchasesThisPeriod: 1000, items: {}, periodStartSnapshot: null })
    checkAchievements(1)
    checkAchievements(2)
    const a = useGamificationStore.getState().achievements.find((x) => x.id === 'first-purchase')
    expect(a?.unlockedAtTick).toBe(1)
  })

  it('unlocks first-order when orders exist', () => {
    useProductionStore.setState({
      orders: [{
        id: 'o1', recipeId: 'roasting', quantity: 10, progress: 0, status: 'active',
        accumulatedMPD: 0, accumulatedMOD: 0, accumulatedCIF: 0, startedAtTick: 0, completedAtTick: null,
      }],
    })
    checkAchievements(5)
    const a = useGamificationStore.getState().achievements.find((x) => x.id === 'first-order')
    expect(a?.unlockedAtTick).toBe(5)
  })

  it('unlocks first-sale when revenue > 0', () => {
    useFinanceStore.setState({
      state: {
        rawMaterialCost: 0, laborCost: 0, cifCost: 0,
        cifBreakdown: { energy: 0, maintenance: 0, waste: 0 },
        productionCost: 0, revenue: 50_000, salesCost: 0, profit: 50_000,
      },
    })
    checkAchievements(10)
    const a = useGamificationStore.getState().achievements.find((x) => x.id === 'first-sale')
    expect(a?.unlockedAtTick).toBe(10)
  })

  it('unlocks zero-waste at tick 100 with no waste events', () => {
    checkAchievements(100)
    const a = useGamificationStore.getState().achievements.find((x) => x.id === 'zero-waste')
    expect(a?.unlockedAtTick).toBe(100)
  })

  it('does not unlock zero-waste at tick 100 when waste_spike is active', () => {
    useGamificationStore.setState({
      xp: 0, level: 1,
      achievements: ACHIEVEMENTS.map((a) => ({ ...a })),
      activeEvents: [{
        id: 'e1', type: 'waste_spike', severity: 'medium',
        title: 'Waste', description: '', effectDurationTicks: 200, appliedAtTick: 0,
      }],
    })
    checkAchievements(100)
    const a = useGamificationStore.getState().achievements.find((x) => x.id === 'zero-waste')
    expect(a?.unlockedAtTick).toBeNull()
  })
})
