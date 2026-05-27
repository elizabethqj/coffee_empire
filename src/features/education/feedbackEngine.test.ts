import { describe, it, expect } from 'vitest'
import { analyzeCostStatement } from './feedbackEngine'
import type { CostStatement } from '@/types'

const base: CostStatement = {
  initialMP: 10_000,
  purchases: 50_000,
  finalMP: 15_000,
  materialUsed: 45_000,
  mod: 20_000,
  cif: 8_000,
  productionCost: 73_000,
  initialWIP: 5_000,
  finalWIP: 3_000,
  finishedGoodsCost: 75_000,
  initialPT: 12_000,
  finalPT: 8_000,
  salesCost: 79_000,
  revenue: 100_000,
  profit: 21_000,
}

describe('analyzeCostStatement', () => {
  it('returns idle message when nothing has happened', () => {
    const idle: CostStatement = { ...base, materialUsed: 0, purchases: 0 }
    const msgs = analyzeCostStatement(idle, null)
    expect(msgs.some((m) => m.id === 'idle')).toBe(true)
  })

  it('returns loss message when profit is negative', () => {
    const loss: CostStatement = { ...base, profit: -5_000, salesCost: 105_000, revenue: 100_000 }
    const msgs = analyzeCostStatement(loss, null)
    expect(msgs.some((m) => m.id === 'loss')).toBe(true)
  })

  it('returns high-cif warning when CIF > 40% of production cost', () => {
    const highCif: CostStatement = { ...base, cif: 35_000, productionCost: 80_000 }
    const msgs = analyzeCostStatement(highCif, null)
    expect(msgs.some((m) => m.id === 'high-cif')).toBe(true)
  })

  it('does not flag high-cif when CIF is within normal range', () => {
    const msgs = analyzeCostStatement(base, null)
    expect(msgs.some((m) => m.id === 'high-cif')).toBe(false)
  })

  it('flags no-sales when PT exists but revenue is zero', () => {
    const noSales: CostStatement = { ...base, revenue: 0, finalPT: 10_000 }
    const msgs = analyzeCostStatement(noSales, null)
    expect(msgs.some((m) => m.id === 'no-sales')).toBe(true)
  })

  it('returns turnaround message when profit improves from negative to positive', () => {
    const prev: CostStatement = { ...base, profit: -1_000 }
    const msgs = analyzeCostStatement(base, prev)
    expect(msgs.some((m) => m.id === 'turnaround')).toBe(true)
  })

  it('returns empty array for a healthy statement with no previous', () => {
    const msgs = analyzeCostStatement(base, null)
    expect(msgs.every((m) => m.id !== 'loss')).toBe(true)
    expect(msgs.every((m) => m.id !== 'high-cif')).toBe(true)
  })
})
