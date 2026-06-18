import { useCallback } from 'react'
import { useInventoryStore } from '@/store/inventoryStore'
import { useFinanceStore } from '@/store/financeStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useAuthStore } from '@/store/authStore'
import { useSimulationStore } from '@/store/simulationStore'
import { analyticsService } from '@/services/analyticsService'
import { audioManager } from '@/game/audio/AudioManager'
import { XP_PURCHASE_MP } from '@/constants/gameBalance'

export function usePurchaseMP() {
  const { purchaseMP } = useInventoryStore()
  const { debitCash, cashBalance } = useFinanceStore()
  const { addXP } = useGamificationStore()
  const { user, sessionId } = useAuthStore()
  const { tick } = useSimulationStore()

  return useCallback(
    (itemId: string, quantity: number, unitCost: number): { error?: string } => {
      const total = quantity * unitCost
      if (total > cashBalance) {
        return {
          error: `Caja insuficiente. Tienes ${cashBalance.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}, necesitas ${total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}.`,
        }
      }

      purchaseMP(itemId, quantity, unitCost)
      debitCash(total)
      addXP(XP_PURCHASE_MP)
      audioManager.play('purchase')

      if (user && sessionId) {
        analyticsService
          .track('purchase_mp', sessionId, user.uid, tick, {
            itemId,
            quantity,
            unitCost,
            totalCost: total,
          })
          .catch(console.error)
      }
      return {}
    },
    [purchaseMP, debitCash, cashBalance, addXP, user, sessionId, tick]
  )
}
