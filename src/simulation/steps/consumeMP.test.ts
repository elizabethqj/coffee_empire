import { describe, it, expect, beforeEach } from 'vitest'
import { consumeMP } from './consumeMP'
import { useInventoryStore } from '@/store/inventoryStore'
import { useProductionStore } from '@/store/productionStore'

describe('consumeMP', () => {
  beforeEach(() => {
    useInventoryStore.setState({
      items: {
        'green-beans': { id: 'green-beans', name: 'Green Coffee Beans', category: 'MP', quantity: 50, unitCost: 2500, maxCapacity: 200 },
        'roasted-beans': { id: 'roasted-beans', name: 'Roasted Beans', category: 'WIP', quantity: 0, unitCost: 0, maxCapacity: 100 },
      },
      totalPurchasesThisPeriod: 0,
      periodStartSnapshot: null,
    })
    useProductionStore.setState({ orders: [] })
  })

  it('does nothing when no active orders exist', () => {
    consumeMP()
    expect(useInventoryStore.getState().items['green-beans'].quantity).toBe(50)
  })

  it('deducts MP proportionally over ticksRequired ticks for one order', () => {
    useProductionStore.setState({
      orders: [
        {
          id: 'order-1',
          recipeId: 'roasting',
          quantity: 15,
          progress: 0,
          status: 'active',
          accumulatedMPD: 0,
          accumulatedMOD: 0,
          accumulatedCIF: 0,
          startedAtTick: 0,
          completedAtTick: null,
        },
      ],
    })

    // roasting: 1 green-bean per unit × 15 units / 15 ticksRequired = 1 per tick
    consumeMP()

    const qty = useInventoryStore.getState().items['green-beans'].quantity
    expect(qty).toBeCloseTo(49, 5)
  })

  it('does not reduce quantity below zero', () => {
    useInventoryStore.setState({
      items: {
        'green-beans': { id: 'green-beans', name: 'Green Coffee Beans', category: 'MP', quantity: 0.1, unitCost: 2500, maxCapacity: 200 },
        'roasted-beans': { id: 'roasted-beans', name: 'Roasted Beans', category: 'WIP', quantity: 0, unitCost: 0, maxCapacity: 100 },
      },
      totalPurchasesThisPeriod: 0,
      periodStartSnapshot: null,
    })
    useProductionStore.setState({
      orders: [
        {
          id: 'order-1',
          recipeId: 'roasting',
          quantity: 15,
          progress: 0,
          status: 'active',
          accumulatedMPD: 0,
          accumulatedMOD: 0,
          accumulatedCIF: 0,
          startedAtTick: 0,
          completedAtTick: null,
        },
      ],
    })

    consumeMP()
    expect(useInventoryStore.getState().items['green-beans'].quantity).toBeGreaterThanOrEqual(0)
  })

  it('skips orders whose recipe is not found', () => {
    useProductionStore.setState({
      orders: [
        {
          id: 'order-bad',
          recipeId: 'nonexistent-recipe',
          quantity: 10,
          progress: 0,
          status: 'active',
          accumulatedMPD: 0,
          accumulatedMOD: 0,
          accumulatedCIF: 0,
          startedAtTick: 0,
          completedAtTick: null,
        },
      ],
    })

    consumeMP()
    expect(useInventoryStore.getState().items['green-beans'].quantity).toBe(50)
  })
})
