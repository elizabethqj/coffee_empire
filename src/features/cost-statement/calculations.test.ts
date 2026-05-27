import { describe, it, expect } from 'vitest'
import { calculateCostStatement, isECPVBalanced } from './calculations'
import type { ECPVInputs } from './calculations'

const BASE_INPUTS: ECPVInputs = {
  initialMP: 10_000,
  purchases: 50_000,
  finalMP: 15_000,
  laborCost: 20_000,
  cifCost: 8_000,
  initialWIP: 5_000,
  finalWIP: 3_000,
  initialPT: 12_000,
  finalPT: 8_000,
  revenue: 100_000,
}

describe('calculateCostStatement', () => {
  it('calculates materialUsed = initialMP + purchases - finalMP', () => {
    const stmt = calculateCostStatement(BASE_INPUTS)
    expect(stmt.materialUsed).toBe(10_000 + 50_000 - 15_000)
  })

  it('calculates productionCost = materialUsed + MOD + CIF', () => {
    const stmt = calculateCostStatement(BASE_INPUTS)
    const expected = stmt.materialUsed + 20_000 + 8_000
    expect(stmt.productionCost).toBe(expected)
  })

  it('calculates finishedGoodsCost = initialWIP + productionCost - finalWIP', () => {
    const stmt = calculateCostStatement(BASE_INPUTS)
    expect(stmt.finishedGoodsCost).toBe(5_000 + stmt.productionCost - 3_000)
  })

  it('calculates salesCost = initialPT + finishedGoodsCost - finalPT', () => {
    const stmt = calculateCostStatement(BASE_INPUTS)
    expect(stmt.salesCost).toBe(12_000 + stmt.finishedGoodsCost - 8_000)
  })

  it('calculates profit = revenue - salesCost', () => {
    const stmt = calculateCostStatement(BASE_INPUTS)
    expect(stmt.profit).toBe(100_000 - stmt.salesCost)
  })

  it('mirrors input fields onto output', () => {
    const stmt = calculateCostStatement(BASE_INPUTS)
    expect(stmt.initialMP).toBe(BASE_INPUTS.initialMP)
    expect(stmt.purchases).toBe(BASE_INPUTS.purchases)
    expect(stmt.finalMP).toBe(BASE_INPUTS.finalMP)
    expect(stmt.mod).toBe(BASE_INPUTS.laborCost)
    expect(stmt.cif).toBe(BASE_INPUTS.cifCost)
    expect(stmt.revenue).toBe(BASE_INPUTS.revenue)
  })

  it('handles zero values without NaN', () => {
    const zero: ECPVInputs = { initialMP: 0, purchases: 0, finalMP: 0, laborCost: 0, cifCost: 0, initialWIP: 0, finalWIP: 0, initialPT: 0, finalPT: 0, revenue: 0 }
    const stmt = calculateCostStatement(zero)
    Object.values(stmt).forEach((v) => expect(v).toBe(0))
  })

  it('allows negative profit (loss scenario)', () => {
    const stmt = calculateCostStatement({ ...BASE_INPUTS, revenue: 1_000 })
    expect(stmt.profit).toBeLessThan(0)
  })
})

describe('isECPVBalanced', () => {
  it('returns true for a correctly computed statement', () => {
    const stmt = calculateCostStatement(BASE_INPUTS)
    expect(isECPVBalanced(stmt)).toBe(true)
  })

  it('returns false when materialUsed is manually tampered', () => {
    const stmt = calculateCostStatement(BASE_INPUTS)
    expect(isECPVBalanced({ ...stmt, materialUsed: stmt.materialUsed + 1000 })).toBe(false)
  })
})
