import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { GameLevel, SessionStatus } from '@/types'

class SessionService {
  private readonly col = () => collection(db, 'sessions')

  async createSession(userId: string, level: GameLevel): Promise<string> {
    const ref = await addDoc(this.col(), {
      userId,
      level,
      status: 'active' satisfies SessionStatus,
      startedAt: serverTimestamp(),
      completedAt: null,
      finalScore: null,
      finalProfit: null,
      decisionCount: 0,
    })
    return ref.id
  }

  async completeSession(
    sessionId: string,
    finalScore: number,
    finalProfit: number
  ): Promise<void> {
    await updateDoc(doc(db, 'sessions', sessionId), {
      status: 'completed' satisfies SessionStatus,
      completedAt: serverTimestamp(),
      finalScore,
      finalProfit,
    })
  }

  async incrementDecisionCount(sessionId: string): Promise<void> {
    const ref = doc(db, 'sessions', sessionId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    await updateDoc(ref, {
      decisionCount: (snap.data().decisionCount as number) + 1,
    })
  }
}

export const sessionService = new SessionService()
