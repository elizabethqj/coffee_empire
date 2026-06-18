import { useCallback } from 'react'
import { useInventoryStore } from '@/store/inventoryStore'
import { useFinanceStore } from '@/store/financeStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useProgressStore } from '@/store/progressStore'
import { useAuthStore } from '@/store/authStore'
import { useSimulationStore } from '@/store/simulationStore'
import { analyticsService } from '@/services/analyticsService'
import { audioManager } from '@/game/audio/AudioManager'
import { XP_PROFITABLE_SALE, UNIT_SELLING_PRICE } from '@/constants/gameBalance'

export function useSellPT() {
  const { updateQuantity, items } = useInventoryStore()
  const { recordSale, creditCash } = useFinanceStore()
  const { addXP } = useGamificationStore()
  const { recordSaleForObjective } = useProgressStore()
  const { user, sessionId } = useAuthStore()
  const { tick } = useSimulationStore()

  return useCallback(
    (itemId: string, quantity: number, unitPrice = UNIT_SELLING_PRICE) => {
      const item = items[itemId]
      if (!item || item.quantity < quantity) return

      const unitCost = item.unitCost
      updateQuantity(itemId, -quantity)
      recordSale(quantity, unitPrice, unitCost)
      creditCash(quantity * unitPrice)

      for (let i = 0; i < quantity; i++) recordSaleForObjective()

      const profit = quantity * (unitPrice - unitCost)
      if (profit > 0) addXP(XP_PROFITABLE_SALE)
      audioManager.play('sale')

      if (user && sessionId) {
        analyticsService
          .track('sell_pt', sessionId, user.uid, tick, {
            itemId,
            quantity,
            unitPrice,
            profit,
          })
          .catch(console.error)
      }
    },
    [
      updateQuantity,
      recordSale,
      creditCash,
      recordSaleForObjective,
      addXP,
      items,
      user,
      sessionId,
      tick,
    ]
  )
}
