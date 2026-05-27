import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { AnalyticsEvent, AnalyticsEventType } from '@/types'

const MIN_WRITE_INTERVAL_MS = 1_000

class AnalyticsService {
  private lastEventAt = 0
  private lastWriteAt = 0

  async track(
    eventType: AnalyticsEventType,
    sessionId: string,
    userId: string,
    tick: number,
    payload: Record<string, unknown> = {}
  ): Promise<void> {
    const now = Date.now()
    const decisionTimeMs = now - this.lastEventAt
    this.lastEventAt = now

    // Throttle Firestore writes to avoid rate limits
    if (now - this.lastWriteAt < MIN_WRITE_INTERVAL_MS) return
    this.lastWriteAt = now

    const event: Omit<AnalyticsEvent, 'id'> = {
      sessionId,
      userId,
      tick,
      eventType,
      decisionTimeMs,
      payload,
    }

    await addDoc(collection(db, 'analytics'), {
      ...event,
      createdAt: serverTimestamp(),
    })
  }
}

export const analyticsService = new AnalyticsService()
