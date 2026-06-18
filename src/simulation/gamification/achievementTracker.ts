import { useInventoryStore } from '@/store/inventoryStore'
import { useProductionStore } from '@/store/productionStore'
import { useFinanceStore } from '@/store/financeStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useMarketStore } from '@/store/marketStore'
import { useCostStatementStore } from '@/store/costStatementStore'

export function checkAchievements(currentTick: number): void {
  const { totalPurchasesThisPeriod, items } = useInventoryStore.getState()
  const { orders } = useProductionStore.getState()
  const { state: finance, cashBalance, initialCash } = useFinanceStore.getState()
  const { unlockAchievement, isAchievementUnlocked, activeEvents, eventsResolvedThisSession } =
    useGamificationStore.getState()
  const { acceptedOrders, consecutiveFulfilled } = useMarketStore.getState()
  const statement = useCostStatementStore.getState().statement

  const unlock = (id: string) => {
    if (!isAchievementUnlocked(id)) unlockAchievement(id, currentTick)
  }

  // ── Bronce ────────────────────────────────────────────────────────────────

  if (totalPurchasesThisPeriod > 0) unlock('first-purchase')
  if (orders.length > 0) unlock('first-order')
  if (finance.revenue > 0) unlock('first-sale')
  if (acceptedOrders.length > 0) unlock('first-market-order')
  if (eventsResolvedThisSession > 0) unlock('first-event-decision')

  // ── Plata ─────────────────────────────────────────────────────────────────

  if (statement.revenue > 0 && statement.salesCost > 0) {
    const margin = (statement.revenue - statement.salesCost) / statement.revenue
    if (margin > 0.2) unlock('profit-margin-20')
  }

  if (statement.finishedGoodsCost > 0 && statement.salesCost > 0) {
    const ptItem = Object.values(items).find((i) => i.category === 'PT')
    const soldQty = ptItem
      ? Math.max(1, Math.floor(statement.salesCost / Math.max(1, ptItem.unitCost)))
      : 0
    const costPerUnit = soldQty > 0 ? statement.salesCost / soldQty : Infinity
    if (costPerUnit < 6_000 && costPerUnit > 0) unlock('cost-per-unit-under-6k')
  }

  if (consecutiveFulfilled >= 3) unlock('three-consecutive-orders')

  if (currentTick > 0 && currentTick % 100 === 0) {
    const hasWaste = activeEvents.some((e) => e.type === 'waste_spike')
    if (!hasWaste) unlock('zero-waste')
  }

  const ptItem = Object.values(items).find((i) => i.category === 'PT')
  if (
    ptItem &&
    ptItem.maxCapacity > 0 &&
    ptItem.quantity / ptItem.maxCapacity < 0.7 &&
    finance.revenue > 0
  ) {
    unlock('no-overstock')
  }

  // ── Oro ───────────────────────────────────────────────────────────────────

  const wasCashNeverCritical = cashBalance > initialCash * 0.2
  if (wasCashNeverCritical && currentTick > 50) {
    // Checked in LevelCompleteModal to confirm whole level, not just one tick
  }

  // Survived 3 events with positive profit
  const resolvedEvents = activeEvents.filter((e) => e.chosenResponseId !== null)
  if (resolvedEvents.length >= 3 && statement.profit > 0) {
    unlock('survived-3-events')
  }

  // Market order express: fulfilled before 60% of deadline
  for (const order of acceptedOrders) {
    if (order.status === 'fulfilled') {
      const totalWindow = order.deadlineTick - order.issuedAtTick
      const usedWindow = currentTick - order.issuedAtTick
      if (usedWindow <= totalWindow * 0.6) {
        unlock('market-order-express')
      }
    }
  }

  // ── Secretos ──────────────────────────────────────────────────────────────

  // comeback-kid: was bankrupt (isBankrupt flipped) then recovered
  // Tracked by checking a flag the LiquidityModal sets

  // speedrun: level 1 done in < 80 ticks — checked in LevelCompleteModal

  // ecpv-master: 100% on assessment — checked in Assessment component
}
