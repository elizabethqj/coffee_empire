export interface SessionMetrics {
  sessionId: string
  level: number
  finalProfit: number | null
  finalScore: number | null
  decisionCount: number
  durationTicks: number | null
}

export interface AggregatedMetrics {
  sessionCount: number
  avgProfit: number
  avgScore: number
  avgDecisions: number
  bestProfit: number
  bestScore: number
}

export function aggregate(sessions: SessionMetrics[]): AggregatedMetrics {
  if (sessions.length === 0) {
    return { sessionCount: 0, avgProfit: 0, avgScore: 0, avgDecisions: 0, bestProfit: 0, bestScore: 0 }
  }

  const withProfit = sessions.filter((s) => s.finalProfit !== null)
  const withScore = sessions.filter((s) => s.finalScore !== null)

  return {
    sessionCount: sessions.length,
    avgProfit: avg(withProfit.map((s) => s.finalProfit as number)),
    avgScore: avg(withScore.map((s) => s.finalScore as number)),
    avgDecisions: avg(sessions.map((s) => s.decisionCount)),
    bestProfit: Math.max(0, ...withProfit.map((s) => s.finalProfit as number)),
    bestScore: Math.max(0, ...withScore.map((s) => s.finalScore as number)),
  }
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
