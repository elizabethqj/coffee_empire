import { useInventoryStore } from '@/store/inventoryStore'
import { useProductionStore } from '@/store/productionStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useUiStore } from '@/store/uiStore'
import type { PlantScene } from './scenes/PlantScene'

class GameBridge {
  private scene: PlantScene | null = null
  private unsubscribers: (() => void)[] = []

  setScene(scene: PlantScene): void {
    this.scene = scene
    this.bindStores()
    scene.syncLevel(useGamificationStore.getState().level)
  }

  clearScene(): void {
    this.unsubscribers.forEach((unsub) => unsub())
    this.unsubscribers = []
    this.scene = null
  }

  /** Animate a cash flow particle on the canvas (call from React after debit/credit). */
  flashCashFlow(type: 'debit' | 'credit', amount: number, areaId: string): void {
    this.scene?.flashCashFlow(type, amount, areaId)
  }

  /** Pulse-highlight an area for onboarding. */
  highlightArea(areaId: string, durationMs = 2000): void {
    this.scene?.highlightArea(areaId, durationMs)
  }

  clearHighlight(): void {
    this.scene?.clearHighlight()
  }

  private bindStores(): void {
    this.unsubscribers.push(
      useInventoryStore.subscribe((state) => {
        this.scene?.syncInventory(state.items)
      }),
      useProductionStore.subscribe((state) => {
        this.scene?.syncOrders(state.orders)
      }),
      useGamificationStore.subscribe((state, prev) => {
        if (state.activeEvents !== prev.activeEvents) {
          const newEvent = state.activeEvents.find(
            (e) => !prev.activeEvents.some((p) => p.id === e.id)
          )
          if (newEvent) this.scene?.showEventAlert(newEvent.title, newEvent.description)
        }
      }),
      useUiStore.subscribe((state, prev) => {
        if (state.theme !== prev.theme) {
          this.scene?.applyTheme(state.theme)
        }
      }),
      useGamificationStore.subscribe((state, prev) => {
        if (state.level !== prev.level) {
          this.scene?.syncLevel(state.level)
        }
      })
    )
  }
}

export const gameBridge = new GameBridge()
