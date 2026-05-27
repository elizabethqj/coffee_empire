import { describe, it, expect, beforeEach } from 'vitest'
import { useInventoryStore } from './inventoryStore'

describe('inventoryStore.receiveProduction', () => {
  beforeEach(() => {
    useInventoryStore.setState({
      items: {
        'roasted-beans': { id: 'roasted-beans', name: 'Roasted Beans', category: 'WIP', quantity: 0, unitCost: 0, maxCapacity: 100 },
        'bag-200g': { id: 'bag-200g', name: 'Café Andino 200g', category: 'PT', quantity: 10, unitCost: 5000, maxCapacity: 300 },
      },
      totalPurchasesThisPeriod: 0,
      periodStartSnapshot: null,
    })
  })

  it('adds quantity to an empty item', () => {
    useInventoryStore.getState().receiveProduction('roasted-beans', 8.5, 3000)
    expect(useInventoryStore.getState().items['roasted-beans'].quantity).toBeCloseTo(8.5)
  })

  it('sets unit cost when item was previously empty', () => {
    useInventoryStore.getState().receiveProduction('roasted-beans', 8.5, 3000)
    expect(useInventoryStore.getState().items['roasted-beans'].unitCost).toBe(3000)
  })

  it('applies weighted average cost when item already has stock', () => {
    // existing: 10 @ 5000, incoming: 5 @ 2000
    // weighted = (10*5000 + 5*2000) / 15 = 60000/15 = 4000
    useInventoryStore.getState().receiveProduction('bag-200g', 5, 2000)
    const item = useInventoryStore.getState().items['bag-200g']
    expect(item.quantity).toBeCloseTo(15)
    expect(item.unitCost).toBeCloseTo(4000)
  })

  it('does nothing for unknown item id', () => {
    useInventoryStore.getState().receiveProduction('nonexistent', 10, 1000)
    // store should remain unchanged
    expect(Object.keys(useInventoryStore.getState().items)).toHaveLength(2)
  })
})
