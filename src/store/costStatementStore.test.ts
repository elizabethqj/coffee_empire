import { describe, it, expect, beforeEach } from 'vitest'
import { useCostStatementStore } from './costStatementStore'
import { useInventoryStore } from './inventoryStore'
import { useFinanceStore } from './financeStore'

const ITEMS = {
  'green-beans': { id: 'green-beans', name: 'Green Coffee Beans', category: 'MP' as const, quantity: 20, unitCost: 2500, maxCapacity: 200 },
  'roasted-beans': { id: 'roasted-beans', name: 'Roasted Beans', category: 'WIP' as const, quantity: 5, unitCost: 3000, maxCapacity: 100 },
  'bag-200g': { id: 'bag-200g', name: 'Café Andino 200g', category: 'PT' as const, quantity: 10, unitCost: 5000, maxCapacity: 300 },
  'ground-coffee': { id: 'ground-coffee', name: 'Ground Coffee', category: 'WIP' as const, quantity: 0, unitCost: 0, maxCapacity: 100 },
  'packaging-material': { id: 'packaging-material', name: 'Coffee Packaging', category: 'MP' as const, quantity: 0, unitCost: 800, maxCapacity: 500 },
}

describe('costStatementStore.recalculate', () => {
  beforeEach(() => {
    useInventoryStore.setState({
      items: { ...ITEMS },
      totalPurchasesThisPeriod: 30_000,
      periodStartSnapshot: {
        capturedAtTick: 0,
        items: {
          'green-beans': { quantity: 10, unitCost: 2500 },
          'roasted-beans': { quantity: 2, unitCost: 3000 },
          'bag-200g': { quantity: 4, unitCost: 5000 },
          'ground-coffee': { quantity: 0, unitCost: 0 },
          'packaging-material': { quantity: 0, unitCost: 800 },
        },
      },
    })
    useFinanceStore.setState({
      state: {
        rawMaterialCost: 0, laborCost: 20_000, cifCost: 8_000,
        cifBreakdown: { energy: 5000, maintenance: 3000, waste: 0 },
        productionCost: 0, revenue: 100_000, salesCost: 0, profit: 0,
      },
    })
    useCostStatementStore.setState({ statement: { initialMP: 0, purchases: 0, finalMP: 0, materialUsed: 0, mod: 0, cif: 0, productionCost: 0, initialWIP: 0, finalWIP: 0, finishedGoodsCost: 0, initialPT: 0, finalPT: 0, salesCost: 0, revenue: 0, profit: 0 } })
  })

  it('computes initialMP from period snapshot', () => {
    useCostStatementStore.getState().recalculate()
    // initialMP = 10 * 2500 = 25000
    expect(useCostStatementStore.getState().statement.initialMP).toBe(25_000)
  })

  it('computes finalMP from current inventory', () => {
    useCostStatementStore.getState().recalculate()
    // finalMP = 20 * 2500 = 50000
    expect(useCostStatementStore.getState().statement.finalMP).toBe(50_000)
  })

  it('computes materialUsed = initialMP + purchases - finalMP', () => {
    useCostStatementStore.getState().recalculate()
    const { initialMP, purchases, finalMP, materialUsed } = useCostStatementStore.getState().statement
    expect(materialUsed).toBeCloseTo(initialMP + purchases - finalMP, 2)
  })

  it('computes productionCost = materialUsed + mod + cif', () => {
    useCostStatementStore.getState().recalculate()
    const { materialUsed, mod, cif, productionCost } = useCostStatementStore.getState().statement
    expect(productionCost).toBeCloseTo(materialUsed + mod + cif, 2)
  })

  it('computes profit = revenue - salesCost', () => {
    useCostStatementStore.getState().recalculate()
    const { revenue, salesCost, profit } = useCostStatementStore.getState().statement
    expect(profit).toBeCloseTo(revenue - salesCost, 2)
  })

  it('handles missing periodStartSnapshot (all initial values = 0)', () => {
    useInventoryStore.setState({ periodStartSnapshot: null, totalPurchasesThisPeriod: 0, items: { ...ITEMS } })
    useCostStatementStore.getState().recalculate()
    expect(useCostStatementStore.getState().statement.initialMP).toBe(0)
    expect(useCostStatementStore.getState().statement.initialWIP).toBe(0)
  })
})
