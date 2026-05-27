import { create } from 'zustand'
import type { InventoryItem, InventorySnapshot } from '@/types'
import { INITIAL_INVENTORY } from '@/constants/gameBalance'

interface InventoryStore {
  items: Record<string, InventoryItem>
  totalPurchasesThisPeriod: number
  periodStartSnapshot: InventorySnapshot | null

  updateQuantity: (id: string, delta: number) => void
  purchaseMP: (itemId: string, quantity: number, unitCost: number) => void
  receiveProduction: (itemId: string, quantity: number, newUnitCost: number) => void
  takePeriodSnapshot: (tick: number) => void
  resetPeriodPurchases: () => void
}

function buildInitialItems(): Record<string, InventoryItem> {
  return Object.fromEntries(INITIAL_INVENTORY.map((item) => [item.id, { ...item }]))
}

function weightedAverageCost(
  existingQty: number,
  existingCost: number,
  newQty: number,
  newCost: number
): number {
  const total = existingQty + newQty
  if (total === 0) return 0
  return (existingQty * existingCost + newQty * newCost) / total
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: buildInitialItems(),
  totalPurchasesThisPeriod: 0,
  periodStartSnapshot: null,

  updateQuantity: (id, delta) =>
    set((state) => {
      const item = state.items[id]
      if (!item) return state
      return {
        items: {
          ...state.items,
          [id]: { ...item, quantity: Math.max(0, item.quantity + delta) },
        },
      }
    }),

  purchaseMP: (itemId, quantity, unitCost) =>
    set((state) => {
      const item = state.items[itemId]
      if (!item || item.category !== 'MP') return state
      const newUnitCost = weightedAverageCost(
        item.quantity,
        item.unitCost,
        quantity,
        unitCost
      )
      return {
        items: {
          ...state.items,
          [itemId]: {
            ...item,
            quantity: item.quantity + quantity,
            unitCost: newUnitCost,
          },
        },
        totalPurchasesThisPeriod:
          state.totalPurchasesThisPeriod + quantity * unitCost,
      }
    }),

  receiveProduction: (itemId, quantity, newUnitCost) =>
    set((state) => {
      const item = state.items[itemId]
      if (!item) return state
      const mergedCost = weightedAverageCost(
        item.quantity,
        item.unitCost,
        quantity,
        newUnitCost
      )
      return {
        items: {
          ...state.items,
          [itemId]: {
            ...item,
            quantity: item.quantity + quantity,
            unitCost: mergedCost,
          },
        },
      }
    }),

  takePeriodSnapshot: (tick) => {
    const { items } = get()
    const snapshot: InventorySnapshot = {
      capturedAtTick: tick,
      items: Object.fromEntries(
        Object.entries(items).map(([id, item]) => [
          id,
          { quantity: item.quantity, unitCost: item.unitCost },
        ])
      ),
    }
    set({ periodStartSnapshot: snapshot })
  },

  resetPeriodPurchases: () => set({ totalPurchasesThisPeriod: 0 }),
}))
