import { create } from 'zustand'
import type { CostStatement } from '@/types'
import { useInventoryStore } from './inventoryStore'
import { useFinanceStore } from './financeStore'

const EMPTY: CostStatement = {
  initialMP: 0,
  purchases: 0,
  finalMP: 0,
  materialUsed: 0,
  mod: 0,
  cif: 0,
  productionCost: 0,
  initialWIP: 0,
  finalWIP: 0,
  finishedGoodsCost: 0,
  initialPT: 0,
  finalPT: 0,
  salesCost: 0,
  revenue: 0,
  profit: 0,
}

interface CostStatementStore {
  statement: CostStatement
  history: Array<{ tick: number; statement: CostStatement }>
  recalculate: () => void
  snapshotHistory: (tick: number) => void
}

function inventoryValue(
  ids: string[],
  quantities: Record<string, { quantity: number; unitCost: number }>
): number {
  return ids.reduce((sum, id) => {
    const v = quantities[id]
    return sum + (v ? v.quantity * v.unitCost : 0)
  }, 0)
}

export const useCostStatementStore = create<CostStatementStore>((set, get) => ({
  statement: { ...EMPTY },
  history: [],

  recalculate: () => {
    const { items, periodStartSnapshot, totalPurchasesThisPeriod } =
      useInventoryStore.getState()
    const { state: finance } = useFinanceStore.getState()

    const mpIds = Object.values(items)
      .filter((i) => i.category === 'MP')
      .map((i) => i.id)
    const wipIds = Object.values(items)
      .filter((i) => i.category === 'WIP')
      .map((i) => i.id)
    const ptIds = Object.values(items)
      .filter((i) => i.category === 'PT')
      .map((i) => i.id)

    const currentValues = Object.fromEntries(
      Object.values(items).map((i) => [i.id, { quantity: i.quantity, unitCost: i.unitCost }])
    )
    const snapshotValues = periodStartSnapshot?.items ?? {}

    const finalMP = inventoryValue(mpIds, currentValues)
    const finalWIP = inventoryValue(wipIds, currentValues)
    const finalPT = inventoryValue(ptIds, currentValues)

    const initialMP = inventoryValue(mpIds, snapshotValues)
    const initialWIP = inventoryValue(wipIds, snapshotValues)
    const initialPT = inventoryValue(ptIds, snapshotValues)

    // ECPV canonical formulas
    const materialUsed = initialMP + totalPurchasesThisPeriod - finalMP
    const productionCost = materialUsed + finance.laborCost + finance.cifCost
    const finishedGoodsCost = initialWIP + productionCost - finalWIP
    const salesCost = initialPT + finishedGoodsCost - finalPT
    const profit = finance.revenue - salesCost

    set({
      statement: {
        initialMP,
        purchases: totalPurchasesThisPeriod,
        finalMP,
        materialUsed,
        mod: finance.laborCost,
        cif: finance.cifCost,
        productionCost,
        initialWIP,
        finalWIP,
        finishedGoodsCost,
        initialPT,
        finalPT,
        salesCost,
        revenue: finance.revenue,
        profit,
      },
    })
  },

  snapshotHistory: (tick) => {
    const { statement, history } = get()
    // Keep a maximum of 60 data points
    const next = history.length >= 60 ? history.slice(1) : history
    set({ history: [...next, { tick, statement: { ...statement } }] })
  },
}))
