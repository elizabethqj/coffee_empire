import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { aggregate } from './metricsAggregator'
import type { SessionMetrics } from './metricsAggregator'

interface MetricsRequest {
  userId: string
}

/**
 * Aggregates performance metrics across all completed sessions for a user.
 */
export const calculateMetrics = onCall<MetricsRequest>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required')
    }

    const targetUserId = request.data.userId
    if (targetUserId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Access denied')
    }

    const db = admin.firestore()
    const sessionsSnap = await db
      .collection('sessions')
      .where('userId', '==', targetUserId)
      .where('status', '==', 'completed')
      .get()

    const sessions: SessionMetrics[] = sessionsSnap.docs.map((d) => {
      const data = d.data()
      return {
        sessionId: d.id,
        level: data.level as number,
        finalProfit: data.finalProfit as number | null,
        finalScore: data.finalScore as number | null,
        decisionCount: data.decisionCount as number,
        durationTicks: null,
      }
    })

    return { sessions, aggregated: aggregate(sessions) }
  }
)
