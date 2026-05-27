import { useInventoryStore } from '@/store/inventoryStore'
import { useProductionStore } from '@/store/productionStore'
import { useFinanceStore } from '@/store/financeStore'
import { useGamificationStore } from '@/store/gamificationStore'

/**
 * Checks all achievement conditions against current game state.
 * Called once per tick from the engine — all checks must be O(1) or O(n) with small n.
 */
export function checkAchievements(currentTick: number): void {
  const { totalPurchasesThisPeriod } = useInventoryStore.getState()
  const { orders } = useProductionStore.getState()
  const { state: finance } = useFinanceStore.getState()
  const { unlockAchievement, isAchievementUnlocked, activeEvents } =
    useGamificationStore.getState()

  if (!isAchievementUnlocked('first-purchase') && totalPurchasesThisPeriod > 0) {
    unlockAchievement('first-purchase', currentTick)
  }

  if (!isAchievementUnlocked('first-order') && orders.length > 0) {
    unlockAchievement('first-order', currentTick)
  }

  if (!isAchievementUnlocked('first-sale') && finance.revenue > 0) {
    unlockAchievement('first-sale', currentTick)
  }

  // Zero-waste: check every 100 ticks if no waste_spike is active
  if (
    !isAchievementUnlocked('zero-waste') &&
    currentTick > 0 &&
    currentTick % 100 === 0
  ) {
    const hasWaste = activeEvents.some((e) => e.type === 'waste_spike')
    if (!hasWaste) {
      unlockAchievement('zero-waste', currentTick)
    }
  }
}
