import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'

interface AnalyticsEvent {
  sessionId: string
  userId: string
  tick: number
  eventType: string
  decisionTimeMs: number
  payload: Record<string, unknown>
  createdAt: admin.firestore.Timestamp
}

interface ExportRequest {
  sessionId: string
}

/**
 * Queries all analytics events for a session, converts to CSV, and returns the CSV string.
 * In production this would upload to Cloud Storage and return a signed URL.
 */
export const exportResults = onCall<ExportRequest>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required')
    }

    const { sessionId } = request.data
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required')
    }

    const db = admin.firestore()

    // Verify ownership
    const sessionSnap = await db.collection('sessions').doc(sessionId).get()
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found')
    }
    if (sessionSnap.data()?.userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Access denied')
    }

    // Fetch analytics events
    const eventsSnap = await db
      .collection('analytics')
      .where('sessionId', '==', sessionId)
      .orderBy('tick', 'asc')
      .get()

    const events = eventsSnap.docs.map((d) => d.data() as AnalyticsEvent)

    const csv = buildCsv(events)
    return { csv, eventCount: events.length }
  }
)

function buildCsv(events: AnalyticsEvent[]): string {
  const headers = ['tick', 'eventType', 'decisionTimeMs', 'payload']
  const rows = events.map((e) => [
    e.tick,
    e.eventType,
    e.decisionTimeMs,
    JSON.stringify(e.payload),
  ])
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}
