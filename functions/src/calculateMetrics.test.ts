import { describe, it, expect } from 'vitest'
import { aggregate, type SessionMetrics } from './metricsAggregator'

const makeSession = (overrides: Partial<SessionMetrics> = {}): SessionMetrics => ({
  sessionId: 'session-1',
  level: 1,
  finalProfit: 50_000,
  finalScore: 0.85,
  decisionCount: 10,
  durationTicks: 120,
  ...overrides,
})

describe('aggregate', () => {
  it('returns zeros for empty input', () => {
    const result = aggregate([])
    expect(result.sessionCount).toBe(0)
    expect(result.avgProfit).toBe(0)
    expect(result.avgScore).toBe(0)
  })

  it('computes sessionCount correctly', () => {
    const result = aggregate([makeSession(), makeSession({ sessionId: 's2' })])
    expect(result.sessionCount).toBe(2)
  })

  it('computes avgProfit as arithmetic mean', () => {
    const result = aggregate([
      makeSession({ finalProfit: 40_000 }),
      makeSession({ finalProfit: 60_000 }),
    ])
    expect(result.avgProfit).toBe(50_000)
  })

  it('computes avgScore as arithmetic mean', () => {
    const result = aggregate([
      makeSession({ finalScore: 0.7 }),
      makeSession({ finalScore: 0.9 }),
    ])
    expect(result.avgScore).toBeCloseTo(0.8)
  })

  it('excludes null finalProfit from average', () => {
    const result = aggregate([
      makeSession({ finalProfit: 100_000 }),
      makeSession({ finalProfit: null }),
    ])
    expect(result.avgProfit).toBe(100_000)
  })

  it('bestProfit returns the maximum profit', () => {
    const result = aggregate([
      makeSession({ finalProfit: 20_000 }),
      makeSession({ finalProfit: 80_000 }),
      makeSession({ finalProfit: 50_000 }),
    ])
    expect(result.bestProfit).toBe(80_000)
  })

  it('bestScore returns the maximum score', () => {
    const result = aggregate([
      makeSession({ finalScore: 0.7 }),
      makeSession({ finalScore: 1.0 }),
    ])
    expect(result.bestScore).toBe(1.0)
  })

  it('avgDecisions rounds correctly', () => {
    const result = aggregate([
      makeSession({ decisionCount: 10 }),
      makeSession({ decisionCount: 20 }),
    ])
    expect(result.avgDecisions).toBe(15)
  })
})
