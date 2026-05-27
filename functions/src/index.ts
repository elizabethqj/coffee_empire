import * as admin from 'firebase-admin'

admin.initializeApp()

export { exportResults } from './exportResults'
export { calculateMetrics } from './calculateMetrics'
