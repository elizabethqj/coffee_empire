import { describe, it, expect, beforeEach } from 'vitest'
import { useProductionStore } from './productionStore'

describe('productionStore', () => {
  beforeEach(() => {
    useProductionStore.setState({ orders: [] })
  })

  describe('createOrder', () => {
    it('creates an order with active status and zero progress', () => {
      useProductionStore.getState().createOrder('roasting', 10, 0)
      const orders = useProductionStore.getState().orders
      expect(orders).toHaveLength(1)
      expect(orders[0].status).toBe('active')
      expect(orders[0].progress).toBe(0)
      expect(orders[0].recipeId).toBe('roasting')
      expect(orders[0].quantity).toBe(10)
      expect(orders[0].startedAtTick).toBe(0)
    })

    it('returns the new order id', () => {
      const id = useProductionStore.getState().createOrder('roasting', 5, 1)
      expect(typeof id).toBe('string')
      expect(id.startsWith('order-')).toBe(true)
    })
  })

  describe('updateOrderProgress', () => {
    it('increments progress on active order', () => {
      const id = useProductionStore.getState().createOrder('roasting', 10, 0)
      useProductionStore.getState().updateOrderProgress(id, 20)
      expect(useProductionStore.getState().orders[0].progress).toBe(20)
    })

    it('caps progress at 100', () => {
      const id = useProductionStore.getState().createOrder('roasting', 10, 0)
      useProductionStore.getState().updateOrderProgress(id, 200)
      expect(useProductionStore.getState().orders[0].progress).toBe(100)
    })

    it('does not update paused order', () => {
      const id = useProductionStore.getState().createOrder('roasting', 10, 0)
      useProductionStore.getState().pauseOrder(id)
      useProductionStore.getState().updateOrderProgress(id, 50)
      expect(useProductionStore.getState().orders[0].progress).toBe(0)
    })
  })

  describe('accumulateOrderCosts', () => {
    it('sums MPD, MOD, CIF across calls', () => {
      const id = useProductionStore.getState().createOrder('roasting', 10, 0)
      useProductionStore.getState().accumulateOrderCosts(id, 100, 50, 25)
      useProductionStore.getState().accumulateOrderCosts(id, 100, 50, 25)
      const order = useProductionStore.getState().orders[0]
      expect(order.accumulatedMPD).toBe(200)
      expect(order.accumulatedMOD).toBe(100)
      expect(order.accumulatedCIF).toBe(50)
    })
  })

  describe('completeOrder', () => {
    it('sets status to completed and records tick', () => {
      const id = useProductionStore.getState().createOrder('roasting', 10, 0)
      useProductionStore.getState().completeOrder(id, 15)
      const order = useProductionStore.getState().orders[0]
      expect(order.status).toBe('completed')
      expect(order.completedAtTick).toBe(15)
      expect(order.progress).toBe(100)
    })
  })

  describe('pauseOrder / resumeOrder', () => {
    it('pause sets status to paused', () => {
      const id = useProductionStore.getState().createOrder('roasting', 10, 0)
      useProductionStore.getState().pauseOrder(id)
      expect(useProductionStore.getState().orders[0].status).toBe('paused')
    })

    it('resume sets status back to active', () => {
      const id = useProductionStore.getState().createOrder('roasting', 10, 0)
      useProductionStore.getState().pauseOrder(id)
      useProductionStore.getState().resumeOrder(id)
      expect(useProductionStore.getState().orders[0].status).toBe('active')
    })

    it('does not resume an already-active order', () => {
      const id = useProductionStore.getState().createOrder('roasting', 10, 0)
      useProductionStore.getState().resumeOrder(id)
      expect(useProductionStore.getState().orders[0].status).toBe('active')
    })
  })

  describe('getActiveOrders', () => {
    it('returns only active orders', () => {
      const id1 = useProductionStore.getState().createOrder('roasting', 10, 0)
      useProductionStore.getState().createOrder('grinding', 5, 1)
      useProductionStore.getState().pauseOrder(id1)
      const active = useProductionStore.getState().getActiveOrders()
      expect(active).toHaveLength(1)
      expect(active[0].recipeId).toBe('grinding')
    })
  })
})
