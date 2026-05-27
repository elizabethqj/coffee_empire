import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { GameLevel } from '@/types'

class UserService {
  async createOrUpdateUser(
    uid: string,
    email: string,
    displayName: string
  ): Promise<void> {
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      await setDoc(ref, {
        email,
        displayName,
        currentLevel: 1 satisfies GameLevel,
        totalXP: 0,
        createdAt: serverTimestamp(),
      })
    }
  }

  async updateProgress(uid: string, level: GameLevel, totalXP: number): Promise<void> {
    await setDoc(
      doc(db, 'users', uid),
      { currentLevel: level, totalXP },
      { merge: true }
    )
  }
}

export const userService = new UserService()
