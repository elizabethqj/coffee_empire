import { describe, it, expect, beforeEach } from 'vitest'
import { useFinanceStore } from './financeStore'

beforeEach(() => {
  useFinanceStore.getState().resetPeriod()
})

describe('financeStore', () => {
  it('should_accumulateMPD_when_calledMultipleTimes', () => {
    useFinanceStore.getState().accumulateMPD(1_000)
    useFinanceStore.getState().accumulateMPD(500)
    expect(useFinanceStore.getState().state.rawMaterialCost).toBe(1_500)
  })

  it('should_updateProductionCost_when_costsAccumulate', () => {
    useFinanceStore.getState().accumulateMPD(5_000)
    useFinanceStore.getState().accumulateMOD(2_000)
    useFinanceStore.getState().accumulateCIF(800, 300, 0)
    expect(useFinanceStore.getState().state.productionCost).toBe(8_100)
  })

  it('should_calculateProfit_when_saleIsRecorded', () => {
    useFinanceStore.getState().accumulateMPD(3_000)
    useFinanceStore.getState().recordSale(4, 8_500, 3_000)
    const { revenue, salesCost, profit } = useFinanceStore.getState().state
    expect(revenue).toBe(34_000)
    expect(salesCost).toBe(12_000)
    expect(profit).toBe(22_000)
  })

  it('should_resetAllFields_when_periodResets', () => {
    useFinanceStore.getState().accumulateMPD(9_999)
    useFinanceStore.getState().resetPeriod()
    expect(useFinanceStore.getState().state.rawMaterialCost).toBe(0)
    expect(useFinanceStore.getState().state.profit).toBe(0)
  })
})
