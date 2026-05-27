import { useCallback } from 'react'
import { useInventoryStore } from '@/store/inventoryStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useAuthStore } from '@/store/authStore'
import { useSimulationStore } from '@/store/simulationStore'
import { analyticsService } from '@/services/analyticsService'
import { audioManager } from '@/game/audio/AudioManager'
import { XP_PURCHASE_MP } from '@/constants/gameBalance'

export function usePurchaseMP() {
  const { purchaseMP } = useInventoryStore()
  const { addXP } = useGamificationStore()
  const { user, sessionId } = useAuthStore()
  const { tick } = useSimulationStore()

  return useCallback(
    (itemId: string, quantity: number, unitCost: number) => {
      purchaseMP(itemId, quantity, unitCost)
      addXP(XP_PURCHASE_MP)
      audioManager.play('purchase')

      if (user && sessionId) {
        analyticsService
          .track('purchase_mp', sessionId, user.uid, tick, {
            itemId,
            quantity,
            unitCost,
            totalCost: quantity * unitCost,
          })
          .catch(console.error)
      }
    },
    [purchaseMP, addXP, user, sessionId, tick]
  )
}
