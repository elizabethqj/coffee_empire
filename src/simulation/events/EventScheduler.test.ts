import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventScheduler } from './EventScheduler'

describe('EventScheduler', () => {
  let scheduler: EventScheduler

  beforeEach(() => {
    scheduler = new EventScheduler()
  })

  it('returns null when probability check fails', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1) // always above 0.05 threshold
    expect(scheduler.roll(0)).toBeNull()
    vi.restoreAllMocks()
  })

  it('returns a DynamicEvent when roll fires', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // always below 0.05
    const event = scheduler.roll(10)
    expect(event).not.toBeNull()
    expect(event?.appliedAtTick).toBe(10)
    expect(event?.effectDurationTicks).toBeGreaterThan(0)
    vi.restoreAllMocks()
  })

  it('does not return same event type twice while still active', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = scheduler.roll(0)
    expect(first).not.toBeNull()
    // Roll several more times — same type should not reappear
    for (let i = 0; i < 10; i++) {
      const next = scheduler.roll(i)
      if (next) expect(next.type).not.toBe(first!.type)
    }
    vi.restoreAllMocks()
  })

  it('returns null when all 4 event types are active', () => {
    const mockValues = [0, 0, 0, 0, 0]
    let callCount = 0
    vi.spyOn(Math, 'random').mockImplementation(() => mockValues[callCount++ % mockValues.length])

    scheduler.roll(0) // supplier_crisis
    scheduler.roll(1) // demand_surge
    scheduler.roll(2) // machine_failure
    scheduler.roll(3) // waste_spike
    // All types active now
    const result = scheduler.roll(4)
    expect(result).toBeNull()
    vi.restoreAllMocks()
  })

  it('expireEvents removes types from the active set allowing re-roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const event = scheduler.roll(0)!
    // Expire the event after its duration
    scheduler.expireEvents([event], event.appliedAtTick + event.effectDurationTicks)
    // Should be rollable again
    const next = scheduler.roll(100)
    expect(next?.type).toBe(event.type)
    vi.restoreAllMocks()
  })

  it('reset clears all active types', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    scheduler.roll(0)
    scheduler.reset()
    const afterReset = scheduler.roll(1)
    expect(afterReset).not.toBeNull()
    vi.restoreAllMocks()
  })
})
