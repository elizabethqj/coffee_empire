import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'

interface AssessmentRecord {
  userId: string
  level: number
  score: number
  completedAtTick: number
}

class AssessmentService {
  async save(record: AssessmentRecord): Promise<void> {
    await addDoc(collection(db, 'assessments'), {
      ...record,
      createdAt: serverTimestamp(),
    })
  }
}

export const assessmentService = new AssessmentService()
