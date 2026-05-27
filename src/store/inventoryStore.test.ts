import { describe, it, expect, beforeEach } from 'vitest'
import { useInventoryStore } from './inventoryStore'

beforeEach(() => {
  useInventoryStore.setState({
    items: {
      'green-beans': {
        id: 'green-beans',
        name: 'Green Coffee Beans',
        category: 'MP',
        quantity: 50,
        unitCost: 2_500,
        maxCapacity: 200,
      },
    },
    totalPurchasesThisPeriod: 0,
    periodStartSnapshot: null,
  })
})

describe('inventoryStore', () => {
  it('should_updateQuantity_when_deltaIsPositive', () => {
    useInventoryStore.getState().updateQuantity('green-beans', 10)
    expect(useInventoryStore.getState().items['green-beans'].quantity).toBe(60)
  })

  it('should_notGoBelowZero_when_deltaExceedsQuantity', () => {
    useInventoryStore.getState().updateQuantity('green-beans', -999)
    expect(useInventoryStore.getState().items['green-beans'].quantity).toBe(0)
  })

  it('should_calculateWeightedAverageCost_when_purchasingMP', () => {
    // Existing: 50 units at $2,500 = $125,000
    // Purchase: 50 units at $3,000 = $150,000
    // Total: 100 units, cost = $275,000 / 100 = $2,750
    useInventoryStore.getState().purchaseMP('green-beans', 50, 3_000)
    const item = useInventoryStore.getState().items['green-beans']
    expect(item.quantity).toBe(100)
    expect(item.unitCost).toBe(2_750)
  })

  it('should_accumulatePurchasesThisPeriod_when_buyingMP', () => {
    useInventoryStore.getState().purchaseMP('green-beans', 10, 2_500)
    expect(useInventoryStore.getState().totalPurchasesThisPeriod).toBe(25_000)
  })
})
