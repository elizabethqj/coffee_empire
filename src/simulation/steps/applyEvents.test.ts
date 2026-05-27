import { describe, it, expect } from 'vitest'
import { applyEvents } from './applyEvents'
import type { DynamicEvent } from '@/types'
import {
  MP_COST_CRISIS_MULTIPLIER,
  DEMAND_SURGE_PRICE_MULTIPLIER,
  MACHINE_FAILURE_SPEED_MULTIPLIER,
  WASTE_SPIKE_CIF_ADDITION,
} from '@/constants/gameBalance'

const makeEvent = (type: DynamicEvent['type'], appliedAtTick = 0, duration = 30): DynamicEvent => ({
  id: `evt-${type}`,
  type,
  severity: 'medium',
  title: '',
  description: '',
  effectDurationTicks: duration,
  appliedAtTick,
})

describe('applyEvents', () => {
  it('returns base rates with no events', () => {
    const rates = applyEvents([], 0)
    expect(rates.laborMultiplier).toBe(1)
    expect(rates.cifWasteAddition).toBe(0)
    expect(rates.speedMultiplier).toBe(1)
    expect(rates.salePriceMultiplier).toBe(1)
    expect(rates.mpCostMultiplier).toBe(1)
  })

  it('applies supplier_crisis multiplier', () => {
    const rates = applyEvents([makeEvent('supplier_crisis')], 5)
    expect(rates.mpCostMultiplier).toBe(MP_COST_CRISIS_MULTIPLIER)
  })

  it('applies demand_surge multiplier', () => {
    const rates = applyEvents([makeEvent('demand_surge')], 5)
    expect(rates.salePriceMultiplier).toBe(DEMAND_SURGE_PRICE_MULTIPLIER)
  })

  it('applies machine_failure multiplier', () => {
    const rates = applyEvents([makeEvent('machine_failure')], 5)
    expect(rates.speedMultiplier).toBe(MACHINE_FAILURE_SPEED_MULTIPLIER)
  })

  it('applies waste_spike addition', () => {
    const rates = applyEvents([makeEvent('waste_spike')], 5)
    expect(rates.cifWasteAddition).toBe(WASTE_SPIKE_CIF_ADDITION)
  })

  it('ignores expired events', () => {
    // event applied at tick 0, duration 10 → expires at tick 10
    const rates = applyEvents([makeEvent('supplier_crisis', 0, 10)], 10)
    expect(rates.mpCostMultiplier).toBe(1)
  })

  it('stacks multiple active events', () => {
    const events = [makeEvent('supplier_crisis'), makeEvent('waste_spike')]
    const rates = applyEvents(events, 5)
    expect(rates.mpCostMultiplier).toBe(MP_COST_CRISIS_MULTIPLIER)
    expect(rates.cifWasteAddition).toBe(WASTE_SPIKE_CIF_ADDITION)
  })
})
