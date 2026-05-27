import { useProductionStore } from '@/store/productionStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { RECIPES, XP_COMPLETE_ORDER } from '@/constants/gameBalance'

/**
 * Transition orders that have reached 100% progress from WIP to PT.
 * Unit cost of PT = (accumulatedMPD + accumulatedMOD + accumulatedCIF) / outputQuantity.
 */
export function completeOrders(currentTick: number): void {
  const { orders, completeOrder } = useProductionStore.getState()
  const { receiveProduction } = useInventoryStore.getState()
  const { addXP } = useGamificationStore.getState()

  for (const order of orders) {
    if (order.status !== 'active' || order.progress < 100) continue

    const recipe = RECIPES.find((r) => r.id === order.recipeId)
    if (!recipe) continue

    const totalCost = order.accumulatedMPD + order.accumulatedMOD + order.accumulatedCIF
    const outputQty = recipe.outputQuantity * order.quantity
    const unitCost = outputQty > 0 ? totalCost / outputQty : 0

    receiveProduction(recipe.outputItem, outputQty, unitCost)
    completeOrder(order.id, currentTick)
    addXP(XP_COMPLETE_ORDER)
  }
}
