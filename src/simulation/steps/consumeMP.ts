import { useInventoryStore } from '@/store/inventoryStore'
import { useProductionStore } from '@/store/productionStore'
import { RECIPES } from '@/constants/gameBalance'

/**
 * Deduct raw materials from inventory for each active order each tick.
 * MP is consumed proportionally: totalRequired / ticksRequired per tick.
 */
export function consumeMP(): void {
  const { getActiveOrders } = useProductionStore.getState()
  const { updateQuantity } = useInventoryStore.getState()

  const activeOrders = getActiveOrders()

  for (const order of activeOrders) {
    const recipe = RECIPES.find((r) => r.id === order.recipeId)
    if (!recipe) continue

    for (const req of recipe.mpRequirements) {
      const consumptionPerTick = (req.quantity * order.quantity) / recipe.ticksRequired
      updateQuantity(req.itemId, -consumptionPerTick)
    }
  }
}
