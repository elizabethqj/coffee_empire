import { useProductionStore } from '@/store/productionStore'
import { RECIPES } from '@/constants/gameBalance'

/**
 * Advance progress on each active order by 100/ticksRequired per tick.
 * Speed multiplier is applied by the engine before calling this step.
 */
export function progressProduction(): void {
  const { getActiveOrders, updateOrderProgress } = useProductionStore.getState()

  for (const order of getActiveOrders()) {
    const recipe = RECIPES.find((r) => r.id === order.recipeId)
    if (!recipe) continue

    const progressDelta = 100 / recipe.ticksRequired
    updateOrderProgress(order.id, progressDelta)
  }
}
