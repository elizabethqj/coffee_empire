import { describe, it, expect, beforeEach } from 'vitest'
import { completeOrders } from './completeOrders'
import { useProductionStore } from '@/store/productionStore'
import { useInventoryStore } from '@/store/inventoryStore'

const INITIAL_ITEMS = {
  'green-beans': { id: 'green-beans', name: 'Green Coffee Beans', category: 'MP' as const, quantity: 0, unitCost: 2500, maxCapacity: 200 },
  'roasted-beans': { id: 'roasted-beans', name: 'Roasted Beans', category: 'WIP' as const, quantity: 0, unitCost: 0, maxCapacity: 100 },
  'ground-coffee': { id: 'ground-coffee', name: 'Ground Coffee', category: 'WIP' as const, quantity: 0, unitCost: 0, maxCapacity: 100 },
  'packaging-material': { id: 'packaging-material', name: 'Coffee Packaging', category: 'MP' as const, quantity: 100, unitCost: 800, maxCapacity: 500 },
  'bag-200g': { id: 'bag-200g', name: 'Café Andino 200g', category: 'PT' as const, quantity: 0, unitCost: 0, maxCapacity: 300 },
}

describe('completeOrders', () => {
  beforeEach(() => {
    useInventoryStore.setState({ items: { ...INITIAL_ITEMS }, totalPurchasesThisPeriod: 0, periodStartSnapshot: null })
    useProductionStore.setState({ orders: [] })
  })

  it('does nothing if no orders have reached 100%', () => {
    useProductionStore.setState({
      orders: [{
        id: 'order-1', recipeId: 'roasting', quantity: 10,
        progress: 80, status: 'active',
        accumulatedMPD: 5000, accumulatedMOD: 2000, accumulatedCIF: 500,
        startedAtTick: 0, completedAtTick: null,
      }],
    })
    completeOrders(15)
    expect(useProductionStore.getState().orders[0].status).toBe('active')
  })

  it('marks a finished roasting order as completed', () => {
    useProductionStore.setState({
      orders: [{
        id: 'order-1', recipeId: 'roasting', quantity: 10,
        progress: 100, status: 'active',
        accumulatedMPD: 25000, accumulatedMOD: 2000, accumulatedCIF: 1000,
        startedAtTick: 0, completedAtTick: null,
      }],
    })
    completeOrders(15)
    expect(useProductionStore.getState().orders[0].status).toBe('completed')
    expect(useProductionStore.getState().orders[0].completedAtTick).toBe(15)
  })

  it('receives output quantity into inventory for roasting (0.85 output factor)', () => {
    // roasting outputQuantity=0.85, quantity=10 → 8.5 roasted-beans produced
    useProductionStore.setState({
      orders: [{
        id: 'order-1', recipeId: 'roasting', quantity: 10,
        progress: 100, status: 'active',
        accumulatedMPD: 25000, accumulatedMOD: 2000, accumulatedCIF: 1000,
        startedAtTick: 0, completedAtTick: null,
      }],
    })
    completeOrders(15)
    const roasted = useInventoryStore.getState().items['roasted-beans']
    expect(roasted.quantity).toBeCloseTo(8.5, 5)
  })

  it('calculates unit cost of PT correctly from accumulated costs', () => {
    // totalCost = 25000+2000+1000 = 28000, outputQty = 0.85*10 = 8.5
    // unitCost = 28000 / 8.5 ≈ 3294.12
    useProductionStore.setState({
      orders: [{
        id: 'order-1', recipeId: 'roasting', quantity: 10,
        progress: 100, status: 'active',
        accumulatedMPD: 25000, accumulatedMOD: 2000, accumulatedCIF: 1000,
        startedAtTick: 0, completedAtTick: null,
      }],
    })
    completeOrders(15)
    const roasted = useInventoryStore.getState().items['roasted-beans']
    expect(roasted.unitCost).toBeCloseTo(28000 / 8.5, 2)
  })

  it('does not complete paused orders at 100%', () => {
    // paused orders should stay paused even at 100% progress
    useProductionStore.setState({
      orders: [{
        id: 'order-1', recipeId: 'roasting', quantity: 10,
        progress: 100, status: 'paused',
        accumulatedMPD: 1000, accumulatedMOD: 500, accumulatedCIF: 100,
        startedAtTick: 0, completedAtTick: null,
      }],
    })
    completeOrders(15)
    expect(useProductionStore.getState().orders[0].status).toBe('paused')
  })
})
