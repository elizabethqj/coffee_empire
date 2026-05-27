import { useSimulationStore } from '@/store/simulationStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useCostStatementStore } from '@/store/costStatementStore'
import { TICK_INTERVAL_MS } from '@/constants/gameBalance'
import { consumeMP } from './steps/consumeMP'
import { progressProduction } from './steps/progressProduction'
import { accumulateCosts } from './steps/accumulateCosts'
import { completeOrders } from './steps/completeOrders'
import { applyEvents } from './steps/applyEvents'
import { EventScheduler } from './events/EventScheduler'
import { checkAchievements } from './gamification/achievementTracker'

class SimulationEngine {
  private timerId: ReturnType<typeof setInterval> | null = null
  private scheduler = new EventScheduler()

  start(): void {
    if (this.timerId !== null) return
    useSimulationStore.getState().start()
    this.schedule()
  }

  pause(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    useSimulationStore.getState().pause()
  }

  setSpeed(speed: 1 | 2 | 4): void {
    useSimulationStore.getState().setSpeed(speed)
    if (this.timerId !== null) {
      this.pause()
      this.start()
    }
  }

  reset(): void {
    this.pause()
    this.scheduler.reset()
  }

  private schedule(): void {
    const { speed } = useSimulationStore.getState()
    const interval = TICK_INTERVAL_MS / speed
    this.timerId = setInterval(() => this.tick(), interval)
  }

  private tick(): void {
    const simState = useSimulationStore.getState()
    if (!simState.running) return

    const currentTick = simState.tick
    const { activeEvents, triggerEvent, expireEvents } = useGamificationStore.getState()

    // Step 1: compute effective rates from active events
    const rates = applyEvents(activeEvents, currentTick)

    // Step 2: expire events whose duration has passed
    this.scheduler.expireEvents(activeEvents, currentTick)
    expireEvents(currentTick)

    // Step 3: maybe fire a new event
    const newEvent = this.scheduler.roll(currentTick)
    if (newEvent) triggerEvent(newEvent)

    // Step 4: tick pipeline
    consumeMP()
    progressProduction()
    accumulateCosts({ laborMultiplier: rates.laborMultiplier, cifWasteAddition: rates.cifWasteAddition })
    completeOrders(currentTick)

    // Step 5: recalculate ECPV statement
    useCostStatementStore.getState().recalculate()

    // Step 6: advance tick counter
    simState.incrementTick()

    // Step 7: check achievements
    checkAchievements(currentTick + 1)

    // Step 8: snapshot history every 10 ticks for trend chart
    if ((currentTick + 1) % 10 === 0) {
      useCostStatementStore.getState().snapshotHistory(currentTick + 1)
    }
  }
}

export const simulationEngine = new SimulationEngine()
