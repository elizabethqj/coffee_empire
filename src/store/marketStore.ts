import { create } from 'zustand'
import type { MarketOrder, GameLevel } from '@/types'
import {
  MARKET_ORDER_INTERVAL_BY_LEVEL,
  MARKET_ORDER_MIN_START_TICK,
  MARKET_CLIENTS,
  MARKET_ORDER_BONUS_MULTIPLIER,
  MARKET_ORDER_PENALTY_PCT,
} from '@/constants/gameBalance'

let _nextOrderId = 1

function randomClient(): string {
  return MARKET_CLIENTS[Math.floor(Math.random() * MARKET_CLIENTS.length)]
}

function orderParamsForLevel(level: GameLevel): {
  quantity: number
  offerPricePerUnit: number
  plazoTicks: number
} {
  // Small quantities — 1-digit numbers feel tangible and manageable
  const base = [
    { quantity: [1, 3], price: 9_500, plazo: 220 }, // nivel 1: fácil, plazo generoso
    { quantity: [2, 5], price: 9_000, plazo: 180 },
    { quantity: [3, 7], price: 8_500, plazo: 150 },
    { quantity: [4, 8], price: 8_000, plazo: 120 },
    { quantity: [5, 10], price: 7_500, plazo: 100 },
    { quantity: [6, 12], price: 7_200, plazo: 85 },
    { quantity: [7, 14], price: 7_000, plazo: 75 },
    { quantity: [8, 15], price: 6_800, plazo: 65 },
  ]
  const idx = Math.min(level - 1, 7)
  const {
    quantity: [min, max],
    price,
    plazo,
  } = base[idx]
  return {
    quantity: Math.floor(Math.random() * (max - min + 1)) + min,
    offerPricePerUnit: price,
    plazoTicks: plazo,
  }
}

interface MarketStore {
  pendingOrder: MarketOrder | null
  acceptedOrders: MarketOrder[]
  consecutiveFulfilled: number
  lastOrderTick: number

  shouldGenerate: (currentTick: number, level: GameLevel) => boolean
  generateOrder: (currentTick: number, level: GameLevel) => void
  acceptOrder: () => void
  rejectOrder: () => void
  checkFulfillment: (
    currentTick: number,
    ptQuantity: number
  ) => { fulfilled: boolean; failed: boolean }
  applyFulfillment: (
    orderId: string,
    currentTick: number,
    ptQuantity: number
  ) => { fulfilled: boolean }
  getActiveSellPrice: (basePricePerUnit: number, currentTick: number) => number
  reset: () => void
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  pendingOrder: null,
  acceptedOrders: [],
  consecutiveFulfilled: 0,
  lastOrderTick: 0,

  shouldGenerate: (currentTick, level) => {
    const { pendingOrder, lastOrderTick } = get()
    if (pendingOrder !== null) return false
    if (currentTick < MARKET_ORDER_MIN_START_TICK) return false // no orders until player learns basics
    const interval = MARKET_ORDER_INTERVAL_BY_LEVEL[level]
    return currentTick - lastOrderTick >= interval
  },

  generateOrder: (currentTick, level) => {
    const { quantity, offerPricePerUnit, plazoTicks } = orderParamsForLevel(level)
    const order: MarketOrder = {
      id: `mkt-${_nextOrderId++}`,
      clientName: randomClient(),
      quantity,
      offerPricePerUnit,
      deadlineTick: currentTick + plazoTicks,
      issuedAtTick: currentTick,
      status: 'pending',
      bonusMultiplier: MARKET_ORDER_BONUS_MULTIPLIER,
    }
    set({ pendingOrder: order, lastOrderTick: currentTick })
  },

  acceptOrder: () =>
    set((s) => {
      if (!s.pendingOrder) return s
      const accepted = { ...s.pendingOrder, status: 'accepted' as const }
      return { pendingOrder: null, acceptedOrders: [...s.acceptedOrders, accepted] }
    }),

  rejectOrder: () =>
    set((s) => {
      if (!s.pendingOrder) return s
      return { pendingOrder: null }
    }),

  checkFulfillment: (currentTick, ptQuantity) => {
    const { acceptedOrders } = get()
    let fulfilled = false
    let failed = false

    for (const o of acceptedOrders) {
      if (o.status !== 'accepted') continue
      if (ptQuantity >= o.quantity) {
        fulfilled = true
      } else if (currentTick >= o.deadlineTick) {
        failed = true
      }
    }
    return { fulfilled, failed }
  },

  applyFulfillment: (orderId, _currentTick, ptQuantity) => {
    const { acceptedOrders, consecutiveFulfilled } = get()
    const order = acceptedOrders.find((o) => o.id === orderId)
    if (!order || order.status !== 'accepted') return { fulfilled: false }

    const canFulfill = ptQuantity >= order.quantity
    if (canFulfill) {
      set((s) => ({
        acceptedOrders: s.acceptedOrders.map((o) =>
          o.id === orderId ? { ...o, status: 'fulfilled' as const } : o
        ),
        consecutiveFulfilled: consecutiveFulfilled + 1,
      }))
      return { fulfilled: true }
    }
    return { fulfilled: false }
  },

  getActiveSellPrice: (basePricePerUnit, _currentTick) => {
    const { acceptedOrders } = get()
    // Check if reputation penalty is active via accepted orders that failed
    const hasFailed = acceptedOrders.some((o) => o.status === 'failed')
    if (hasFailed) {
      return basePricePerUnit * (1 - MARKET_ORDER_PENALTY_PCT)
    }
    return basePricePerUnit
  },

  reset: () =>
    set({
      pendingOrder: null,
      acceptedOrders: [],
      consecutiveFulfilled: 0,
      lastOrderTick: 0,
    }),
}))
