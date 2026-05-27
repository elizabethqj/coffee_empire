import type { DynamicEvent } from '@/types'
import {
  MP_COST_CRISIS_MULTIPLIER,
  DEMAND_SURGE_PRICE_MULTIPLIER,
  MACHINE_FAILURE_SPEED_MULTIPLIER,
  WASTE_SPIKE_CIF_ADDITION,
} from '@/constants/gameBalance'

export interface TickRates {
  laborMultiplier: number
  cifWasteAddition: number
  speedMultiplier: number
  salePriceMultiplier: number
  mpCostMultiplier: number
}

const BASE_RATES: TickRates = {
  laborMultiplier: 1,
  cifWasteAddition: 0,
  speedMultiplier: 1,
  salePriceMultiplier: 1,
  mpCostMultiplier: 1,
}

/**
 * Compute effective tick rates by folding active dynamic events onto the base rates.
 * Pure function — no store reads, safe to unit-test in isolation.
 */
export function applyEvents(activeEvents: DynamicEvent[], currentTick: number): TickRates {
  const rates = { ...BASE_RATES }

  for (const event of activeEvents) {
    const expired = currentTick >= event.appliedAtTick + event.effectDurationTicks
    if (expired) continue

    switch (event.type) {
      case 'supplier_crisis':
        rates.mpCostMultiplier *= MP_COST_CRISIS_MULTIPLIER
        break
      case 'demand_surge':
        rates.salePriceMultiplier *= DEMAND_SURGE_PRICE_MULTIPLIER
        break
      case 'machine_failure':
        rates.speedMultiplier *= MACHINE_FAILURE_SPEED_MULTIPLIER
        break
      case 'waste_spike':
        rates.cifWasteAddition += WASTE_SPIKE_CIF_ADDITION
        break
    }
  }

  return rates
}
