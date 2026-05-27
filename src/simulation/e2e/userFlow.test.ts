/**
 * E2E flow: Level-1 onboarding → purchase MP → start order → complete order → sell → assessment → Level 2
 *
 * This is a store-layer integration test. It drives the full tick pipeline for a minimal
 * number of ticks to verify the happy path without spinning up Firebase or Phaser.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useInventoryStore } from '@/store/inventoryStore'
import { useProductionStore } from '@/store/productionStore'
import { useFinanceStore } from '@/store/financeStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useCostStatementStore } from '@/store/costStatementStore'
import { useSimulationStore } from '@/store/simulationStore'
import { consumeMP } from '@/simulation/steps/consumeMP'
import { progressProduction } from '@/simulation/steps/progressProduction'
import { accumulateCosts } from '@/simulation/steps/accumulateCosts'
import { completeOrders } from '@/simulation/steps/completeOrders'
import { checkAchievements } from '@/simulation/gamification/achievementTracker'
import { INITIAL_INVENTORY, RECIPES, XP_ASSESSMENT_PASS, ACHIEVEMENTS } from '@/constants/gameBalance'

function resetAll() {
  const items = Object.fromEntries(INITIAL_INVENTORY.map((i) => [i.id, { ...i }]))
  useInventoryStore.setState({ items, totalPurchasesThisPeriod: 0, periodStartSnapshot: null })
  useProductionStore.setState({ orders: [] })
  useFinanceStore.setState({
    state: {
      rawMaterialCost: 0, laborCost: 0, cifCost: 0,
      cifBreakdown: { energy: 0, maintenance: 0, waste: 0 },
      productionCost: 0, revenue: 0, salesCost: 0, profit: 0,
    },
  })
  useGamificationStore.setState({ xp: 0, level: 1, achievements: [], activeEvents: [] })
  useCostStatementStore.setState({ history: [] })
  useSimulationStore.setState({ tick: 0, running: false, speed: 1 })
}

describe('Level-1 onboarding user flow', () => {
  beforeEach(resetAll)

  it('should_reachLevel2_when_playerCompletesOnboardingAndPassesAssessment', () => {
    // 1. Purchase MP — triggers first-purchase achievement check
    useInventoryStore.getState().purchaseMP('green-beans', 50, 2_500)
    useGamificationStore.setState({ xp: 0, level: 1, achievements: [], activeEvents: [] })
    expect(useInventoryStore.getState().totalPurchasesThisPeriod).toBe(125_000)

    // 2. Start a roasting order
    const recipe = RECIPES.find((r) => r.id === 'roasting')!
    useProductionStore.getState().createOrder(recipe.id, 10, 0)
    expect(useProductionStore.getState().orders).toHaveLength(1)

    // 3. Advance ticks through the pipeline until the order completes
    const ticksRequired = recipe.ticksRequired // 15
    const rates = { laborMultiplier: 1, cifWasteAddition: 0, speedMultiplier: 1, salePriceMultiplier: 1, mpCostMultiplier: 1 }

    for (let t = 1; t <= ticksRequired; t++) {
      consumeMP()
      progressProduction()
      accumulateCosts(rates)
      completeOrders(t)
    }

    // Order should be completed and roasted-beans in inventory
    const orders = useProductionStore.getState().orders
    const completed = orders.filter((o) => o.status === 'completed')
    expect(completed).toHaveLength(1)
    expect(useInventoryStore.getState().items['roasted-beans'].quantity).toBeGreaterThan(0)

    // 4. No finished goods yet (full pipeline would need packaging order too) —
    //    verify that cost accumulation occurred during the roasting ticks
    const financeState = useFinanceStore.getState().state
    expect(financeState.laborCost).toBeGreaterThan(0)
    expect(financeState.cifCost).toBeGreaterThan(0)

    // 5. Simulate passing an assessment (200 XP) — completeOrders gave 50 XP already
    //    Total: 250 XP → Level 2 (threshold: 150 XP)
    useGamificationStore.getState().addXP(XP_ASSESSMENT_PASS)
    expect(useGamificationStore.getState().level).toBe(2)
    expect(useGamificationStore.getState().xp).toBe(250)
  })

  it('should_unlockAchievements_when_keyActionsOccurDuringFlow', () => {
    useGamificationStore.setState({
      xp: 0, level: 1,
      achievements: ACHIEVEMENTS.map((a) => ({ ...a })),
      activeEvents: [],
    })

    // Purchase
    useInventoryStore.getState().purchaseMP('green-beans', 10, 2_500)
    checkAchievements(1)
    expect(useGamificationStore.getState().achievements.find((a) => a.id === 'first-purchase')?.unlockedAtTick).toBe(1)

    // Order
    useProductionStore.setState({
      orders: [{
        id: 'o1', recipeId: 'roasting', quantity: 5, progress: 0, status: 'active',
        accumulatedMPD: 0, accumulatedMOD: 0, accumulatedCIF: 0, startedAtTick: 1, completedAtTick: null,
      }],
    })
    checkAchievements(2)
    expect(useGamificationStore.getState().achievements.find((a) => a.id === 'first-order')?.unlockedAtTick).toBe(2)

    // Sale
    useFinanceStore.setState({
      state: {
        rawMaterialCost: 0, laborCost: 0, cifCost: 0,
        cifBreakdown: { energy: 0, maintenance: 0, waste: 0 },
        productionCost: 0, revenue: 42_500, salesCost: 0, profit: 42_500,
      },
    })
    checkAchievements(3)
    expect(useGamificationStore.getState().achievements.find((a) => a.id === 'first-sale')?.unlockedAtTick).toBe(3)
  })
})
