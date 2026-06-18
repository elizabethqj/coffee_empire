import { create } from 'zustand'
import type { GameLevel, LevelStars } from '@/types'
import { LEVEL_OBJECTIVES } from '@/constants/gameBalance'
import { useCostStatementStore } from './costStatementStore'
import { useProductionStore } from './productionStore'
import { useMarketStore } from './marketStore'

interface ProgressStore {
  stars: Partial<Record<GameLevel, LevelStars>>
  levelCompleted: boolean
  completedAtTick: number | null

  // Tracked counters for complex objectives
  profitableTicks: number
  cifBelowThresholdTicks: number
  ordersWithSimultaneousWIP: number
  objectiveSalesCount: number

  checkObjective: (currentTick: number, level: GameLevel) => boolean
  recordSaleForObjective: () => void
  awardStars: (level: GameLevel, tick: number) => LevelStars
  resetLevel: () => void
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  stars: {},
  levelCompleted: false,
  completedAtTick: null,
  profitableTicks: 0,
  cifBelowThresholdTicks: 0,
  ordersWithSimultaneousWIP: 0,
  objectiveSalesCount: 0,

  checkObjective: (currentTick, level) => {
    const obj = LEVEL_OBJECTIVES[level]
    if (!obj) return false
    const { levelCompleted } = get()
    if (levelCompleted) return false

    const statement = useCostStatementStore.getState().statement
    const production = useProductionStore.getState()
    const market = useMarketStore.getState()

    const { objectiveSalesCount } = get()

    // Update rolling counters
    const isProfit = statement.profit > 0
    const cifPct = statement.productionCost > 0 ? statement.cif / statement.productionCost : 0
    const isCIFLow = cifPct < 0.3
    const activeOrders = production.getActiveOrders()
    const allFieldsPositive =
      statement.materialUsed > 0 &&
      statement.productionCost > 0 &&
      statement.finishedGoodsCost > 0 &&
      statement.salesCost > 0 &&
      statement.profit > 0

    set((s) => ({
      profitableTicks: isProfit ? s.profitableTicks + 1 : 0,
      cifBelowThresholdTicks: isCIFLow ? s.cifBelowThresholdTicks + 1 : 0,
    }))

    let completed = false

    switch (level) {
      case 1:
        completed = objectiveSalesCount >= 5 && statement.profit > 0
        break
      case 2: {
        const costPerUnit =
          statement.finishedGoodsCost > 0 && statement.salesCost > 0
            ? statement.salesCost / Math.max(1, objectiveSalesCount)
            : Infinity
        completed = objectiveSalesCount >= 10 && costPerUnit < 7_500
        break
      }
      case 3:
        completed = allFieldsPositive
        break
      case 4: {
        const fulfilled = market.acceptedOrders.filter((o) => o.status === 'fulfilled').length
        completed = fulfilled >= 2
        break
      }
      case 5:
        completed = get().cifBelowThresholdTicks >= 50
        break
      case 6: {
        const simultaneousWIP = activeOrders.length >= 3
        if (simultaneousWIP) {
          set((s) => ({ ordersWithSimultaneousWIP: s.ordersWithSimultaneousWIP + 1 }))
        }
        completed = get().ordersWithSimultaneousWIP >= 3
        break
      }
      case 7:
        completed = get().profitableTicks >= 60
        break
      case 8:
        completed = statement.profit > 200_000
        break
    }

    if (completed) {
      set({ levelCompleted: true, completedAtTick: currentTick })
    }

    return completed
  },

  recordSaleForObjective: () => set((s) => ({ objectiveSalesCount: s.objectiveSalesCount + 1 })),

  awardStars: (level, tick) => {
    const obj = LEVEL_OBJECTIVES[level]
    if (!obj) return 0
    let stars: LevelStars = 1
    if (tick <= obj.starThresholds.three) stars = 3
    else if (tick <= obj.starThresholds.two) stars = 2
    set((s) => ({ stars: { ...s.stars, [level]: stars } }))
    return stars
  },

  resetLevel: () =>
    set({
      levelCompleted: false,
      completedAtTick: null,
      profitableTicks: 0,
      cifBelowThresholdTicks: 0,
      ordersWithSimultaneousWIP: 0,
      objectiveSalesCount: 0,
    }),
}))
