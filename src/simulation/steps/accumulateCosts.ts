import { useProductionStore } from '@/store/productionStore'
import { useFinanceStore } from '@/store/financeStore'
import { useInventoryStore } from '@/store/inventoryStore'
import {
  LABOR_COST_PER_TICK,
  ENERGY_CIF_PER_TICK,
  MAINTENANCE_CIF_PER_TICK,
  RECIPES,
} from '@/constants/gameBalance'

interface CostRates {
  laborMultiplier: number
  cifWasteAddition: number
}

/**
 * Accumulate MPD, MOD, and CIF for all active orders in a single tick.
 * MPD is the cost of materials consumed (read from inventory unit costs).
 * MOD and CIF are split evenly across all active orders.
 */
export function accumulateCosts(rates: CostRates = { laborMultiplier: 1, cifWasteAddition: 0 }): void {
  const { getActiveOrders, accumulateOrderCosts } = useProductionStore.getState()
  const { accumulateMPD, accumulateMOD, accumulateCIF } = useFinanceStore.getState()
  const { items } = useInventoryStore.getState()

  const activeOrders = getActiveOrders()
  if (activeOrders.length === 0) return

  const laborPerOrder = (LABOR_COST_PER_TICK * rates.laborMultiplier) / activeOrders.length
  const energyPerOrder = ENERGY_CIF_PER_TICK / activeOrders.length
  const maintenancePerOrder = MAINTENANCE_CIF_PER_TICK / activeOrders.length
  const wastePerOrder = rates.cifWasteAddition / activeOrders.length

  let totalMPD = 0

  for (const order of activeOrders) {
    const recipe = RECIPES.find((r) => r.id === order.recipeId)
    if (!recipe) continue

    // MPD = unit cost of materials consumed this tick
    let orderMPD = 0
    for (const req of recipe.mpRequirements) {
      const consumptionPerTick = (req.quantity * order.quantity) / recipe.ticksRequired
      const unitCost = items[req.itemId]?.unitCost ?? 0
      orderMPD += consumptionPerTick * unitCost
    }

    accumulateOrderCosts(order.id, orderMPD, laborPerOrder, energyPerOrder + maintenancePerOrder + wastePerOrder)
    totalMPD += orderMPD
  }

  const totalLabor = LABOR_COST_PER_TICK * rates.laborMultiplier
  const totalEnergy = ENERGY_CIF_PER_TICK
  const totalMaintenance = MAINTENANCE_CIF_PER_TICK

  accumulateMPD(totalMPD)
  accumulateMOD(totalLabor)
  accumulateCIF(totalEnergy, totalMaintenance, rates.cifWasteAddition)
}
