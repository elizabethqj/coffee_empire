import { describe, it, expect, beforeEach } from 'vitest'
import { progressProduction } from './progressProduction'
import { useProductionStore } from '@/store/productionStore'

const makeOrder = (overrides = {}) => ({
  id: 'order-1',
  recipeId: 'roasting',
  quantity: 10,
  progress: 0,
  status: 'active' as const,
  accumulatedMPD: 0,
  accumulatedMOD: 0,
  accumulatedCIF: 0,
  startedAtTick: 0,
  completedAtTick: null,
  ...overrides,
})

describe('progressProduction', () => {
  beforeEach(() => {
    useProductionStore.setState({ orders: [] })
  })

  it('increments progress by 100/ticksRequired for roasting (15 ticks)', () => {
    useProductionStore.setState({ orders: [makeOrder()] })
    progressProduction()
    const order = useProductionStore.getState().orders[0]
    expect(order.progress).toBeCloseTo(100 / 15, 5)
  })

  it('does not exceed 100 progress', () => {
    useProductionStore.setState({ orders: [makeOrder({ progress: 99.9 })] })
    progressProduction()
    const order = useProductionStore.getState().orders[0]
    expect(order.progress).toBeLessThanOrEqual(100)
  })

  it('does not advance paused orders', () => {
    useProductionStore.setState({ orders: [makeOrder({ status: 'paused' })] })
    progressProduction()
    const order = useProductionStore.getState().orders[0]
    expect(order.progress).toBe(0)
  })

  it('does not advance completed orders', () => {
    useProductionStore.setState({ orders: [makeOrder({ status: 'completed', progress: 100 })] })
    progressProduction()
    const order = useProductionStore.getState().orders[0]
    expect(order.progress).toBe(100)
  })

  it('skips orders with unknown recipe', () => {
    useProductionStore.setState({ orders: [makeOrder({ recipeId: 'does-not-exist' })] })
    progressProduction()
    const order = useProductionStore.getState().orders[0]
    expect(order.progress).toBe(0)
  })
})
