import { describe, it, expect, beforeEach } from 'vitest'
import { accumulateCosts } from './accumulateCosts'
import { useProductionStore } from '@/store/productionStore'
import { useFinanceStore } from '@/store/financeStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { LABOR_COST_PER_TICK, ENERGY_CIF_PER_TICK, MAINTENANCE_CIF_PER_TICK } from '@/constants/gameBalance'

const roastingOrder = {
  id: 'order-1',
  recipeId: 'roasting',
  quantity: 15,
  progress: 0,
  status: 'active' as const,
  accumulatedMPD: 0,
  accumulatedMOD: 0,
  accumulatedCIF: 0,
  startedAtTick: 0,
  completedAtTick: null,
}

describe('accumulateCosts', () => {
  beforeEach(() => {
    useInventoryStore.setState({
      items: {
        'green-beans': { id: 'green-beans', name: 'Green Coffee Beans', category: 'MP', quantity: 50, unitCost: 2500, maxCapacity: 200 },
        'roasted-beans': { id: 'roasted-beans', name: 'Roasted Beans', category: 'WIP', quantity: 0, unitCost: 0, maxCapacity: 100 },
        'ground-coffee': { id: 'ground-coffee', name: 'Ground Coffee', category: 'WIP', quantity: 0, unitCost: 0, maxCapacity: 100 },
        'packaging-material': { id: 'packaging-material', name: 'Coffee Packaging', category: 'MP', quantity: 100, unitCost: 800, maxCapacity: 500 },
        'bag-200g': { id: 'bag-200g', name: 'Café Andino 200g', category: 'PT', quantity: 0, unitCost: 0, maxCapacity: 300 },
      },
      totalPurchasesThisPeriod: 0,
      periodStartSnapshot: null,
    })
    useProductionStore.setState({ orders: [] })
    useFinanceStore.setState({
      state: {
        rawMaterialCost: 0, laborCost: 0, cifCost: 0,
        cifBreakdown: { energy: 0, maintenance: 0, waste: 0 },
        productionCost: 0, revenue: 0, salesCost: 0, profit: 0,
      },
    })
  })

  it('does nothing when no active orders', () => {
    accumulateCosts()
    expect(useFinanceStore.getState().state.laborCost).toBe(0)
  })

  it('accumulates full labor cost per tick with one active order', () => {
    useProductionStore.setState({ orders: [roastingOrder] })
    accumulateCosts()
    expect(useFinanceStore.getState().state.laborCost).toBe(LABOR_COST_PER_TICK)
  })

  it('accumulates energy and maintenance CIF', () => {
    useProductionStore.setState({ orders: [roastingOrder] })
    accumulateCosts()
    const fin = useFinanceStore.getState().state
    const expectedCIF = ENERGY_CIF_PER_TICK + MAINTENANCE_CIF_PER_TICK
    expect(fin.cifCost).toBe(expectedCIF)
    expect(fin.cifBreakdown.energy).toBe(ENERGY_CIF_PER_TICK)
    expect(fin.cifBreakdown.maintenance).toBe(MAINTENANCE_CIF_PER_TICK)
  })

  it('adds waste CIF when cifWasteAddition > 0', () => {
    useProductionStore.setState({ orders: [roastingOrder] })
    accumulateCosts({ laborMultiplier: 1, cifWasteAddition: 500 })
    const fin = useFinanceStore.getState().state
    expect(fin.cifBreakdown.waste).toBe(500)
  })

  it('applies laborMultiplier', () => {
    useProductionStore.setState({ orders: [roastingOrder] })
    accumulateCosts({ laborMultiplier: 0.5, cifWasteAddition: 0 })
    expect(useFinanceStore.getState().state.laborCost).toBe(LABOR_COST_PER_TICK * 0.5)
  })

  it('accumulates MPD based on unit cost of materials', () => {
    // roasting consumes 1 green-bean per unit × 15 qty / 15 ticks = 1/tick at 2500 = 2500 MPD
    useProductionStore.setState({ orders: [roastingOrder] })
    accumulateCosts()
    const fin = useFinanceStore.getState().state
    expect(fin.rawMaterialCost).toBeCloseTo(2500, 1)
  })
})
