import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventScheduler } from './EventScheduler'
import { EVENT_MIN_START_TICK, EVENT_MIN_COOLDOWN_TICKS } from '@/constants/gameBalance'

// Tests use ticks past the min-start threshold so the scheduler can fire
const START = EVENT_MIN_START_TICK + 1
const STEP = EVENT_MIN_COOLDOWN_TICKS + 1

describe('EventScheduler', () => {
  let scheduler: EventScheduler

  beforeEach(() => {
    scheduler = new EventScheduler()
  })

  it('returns null when probability check fails', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1) // always above threshold
    expect(scheduler.roll(START)).toBeNull()
    vi.restoreAllMocks()
  })

  it('returns null before EVENT_MIN_START_TICK regardless of probability', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // would fire if tick were high enough
    expect(scheduler.roll(0)).toBeNull()
    expect(scheduler.roll(EVENT_MIN_START_TICK - 1)).toBeNull()
    vi.restoreAllMocks()
  })

  it('returns a DynamicEvent when roll fires past the min-start tick', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const event = scheduler.roll(START)
    expect(event).not.toBeNull()
    expect(event?.appliedAtTick).toBe(START)
    expect(event?.effectDurationTicks).toBeGreaterThan(0)
    vi.restoreAllMocks()
  })

  it('respects cooldown — returns null if called too soon after last event', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    scheduler.roll(START) // fires, sets lastEventTick = START
    const tooSoon = scheduler.roll(START + 1) // only 1 tick later — within cooldown
    expect(tooSoon).toBeNull()
    vi.restoreAllMocks()
  })

  it('does not return same event type twice while still active', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = scheduler.roll(START)
    expect(first).not.toBeNull()
    // Roll several more times past cooldown — same type should not reappear
    for (let i = 1; i <= 10; i++) {
      const next = scheduler.roll(START + i * STEP)
      if (next) expect(next.type).not.toBe(first!.type)
    }
    vi.restoreAllMocks()
  })

  it('returns null when all 4 event types are active', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    scheduler.roll(START)
    scheduler.roll(START + STEP)
    scheduler.roll(START + STEP * 2)
    scheduler.roll(START + STEP * 3)
    // All types active now
    const result = scheduler.roll(START + STEP * 4)
    expect(result).toBeNull()
    vi.restoreAllMocks()
  })

  it('expireEvents removes types from the active set allowing re-roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const event = scheduler.roll(START)!
    // Expire the event after its duration
    scheduler.expireEvents([event], event.appliedAtTick + event.effectDurationTicks)
    // Should be rollable again once cooldown passes
    const next = scheduler.roll(START + STEP)
    expect(next?.type).toBe(event.type)
    vi.restoreAllMocks()
  })

  it('reset clears all active types and cooldown', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    scheduler.roll(START)
    scheduler.reset()
    const afterReset = scheduler.roll(START) // cooldown reset too
    expect(afterReset).not.toBeNull()
    vi.restoreAllMocks()
  })
})
