import { create } from 'zustand'
import type { ProductionOrder } from '@/types'

interface ProductionStore {
  orders: ProductionOrder[]

  createOrder: (recipeId: string, quantity: number, currentTick: number) => string
  updateOrderProgress: (orderId: string, progressDelta: number) => void
  accumulateOrderCosts: (
    orderId: string,
    mpd: number,
    mod: number,
    cif: number
  ) => void
  completeOrder: (orderId: string, tick: number) => void
  pauseOrder: (orderId: string) => void
  resumeOrder: (orderId: string) => void
  getActiveOrders: () => ProductionOrder[]
}

let _nextId = 1

export const useProductionStore = create<ProductionStore>((set, get) => ({
  orders: [],

  createOrder: (recipeId, quantity, currentTick) => {
    const id = `order-${_nextId++}`
    const order: ProductionOrder = {
      id,
      recipeId,
      quantity,
      progress: 0,
      status: 'active',
      accumulatedMPD: 0,
      accumulatedMOD: 0,
      accumulatedCIF: 0,
      startedAtTick: currentTick,
      completedAtTick: null,
    }
    set((state) => ({ orders: [...state.orders, order] }))
    return id
  },

  updateOrderProgress: (orderId, progressDelta) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId && o.status === 'active'
          ? { ...o, progress: Math.min(100, o.progress + progressDelta) }
          : o
      ),
    })),

  accumulateOrderCosts: (orderId, mpd, mod, cif) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              accumulatedMPD: o.accumulatedMPD + mpd,
              accumulatedMOD: o.accumulatedMOD + mod,
              accumulatedCIF: o.accumulatedCIF + cif,
            }
          : o
      ),
    })),

  completeOrder: (orderId, tick) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'completed', progress: 100, completedAtTick: tick }
          : o
      ),
    })),

  pauseOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId && o.status === 'active' ? { ...o, status: 'paused' } : o
      ),
    })),

  resumeOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId && o.status === 'paused' ? { ...o, status: 'active' } : o
      ),
    })),

  getActiveOrders: () => get().orders.filter((o) => o.status === 'active'),
}))
