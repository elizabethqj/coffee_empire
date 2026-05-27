import { useEffect } from 'react'
import { useProductionStore } from '@/store/productionStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useSimulationStore } from '@/store/simulationStore'
import { analyticsService } from './analyticsService'

/**
 * Subscribes to store changes and fires analytics events for actions that
 * don't originate directly from user-facing hooks (complete_order,
 * event_triggered, panel_opened, ecpv_viewed).
 * Mount once in GamePage.
 */
export function useAnalyticsWatcher() {
  useEffect(() => {
    const unsubOrders = useProductionStore.subscribe((state, prev) => {
      const { user, sessionId } = useAuthStore.getState()
      if (!user || !sessionId) return
      const tick = useSimulationStore.getState().tick

      for (const order of state.orders) {
        const prevOrder = prev.orders.find((p) => p.id === order.id)
        if (order.status === 'completed' && prevOrder?.status === 'active') {
          analyticsService
            .track('complete_order', sessionId, user.uid, tick, {
              recipeId: order.recipeId,
              quantity: order.quantity,
            })
            .catch(console.error)
        }
      }
    })

    const unsubEvents = useGamificationStore.subscribe((state, prev) => {
      const { user, sessionId } = useAuthStore.getState()
      if (!user || !sessionId) return
      const tick = useSimulationStore.getState().tick

      for (const event of state.activeEvents) {
        if (!prev.activeEvents.some((p) => p.id === event.id)) {
          analyticsService
            .track('event_triggered', sessionId, user.uid, tick, {
              eventType: event.type,
              severity: event.severity,
            })
            .catch(console.error)
        }
      }
    })

    const unsubPanel = useUiStore.subscribe((state, prev) => {
      const { user, sessionId } = useAuthStore.getState()
      if (!user || !sessionId) return
      if (!state.activePanel || state.activePanel === prev.activePanel) return
      const tick = useSimulationStore.getState().tick

      analyticsService
        .track('panel_opened', sessionId, user.uid, tick, { panelName: state.activePanel })
        .catch(console.error)

      if (state.activePanel === 'ecpv') {
        analyticsService
          .track('ecpv_viewed', sessionId, user.uid, tick, {})
          .catch(console.error)
      }
    })

    return () => {
      unsubOrders()
      unsubEvents()
      unsubPanel()
    }
  }, [])
}
