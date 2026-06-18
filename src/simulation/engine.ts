import { useSimulationStore } from '@/store/simulationStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useCostStatementStore } from '@/store/costStatementStore'
import { useFinanceStore } from '@/store/financeStore'
import { useMarketStore } from '@/store/marketStore'
import { useProgressStore } from '@/store/progressStore'
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
    const {
      activeEvents,
      triggerEvent,
      expireEvents,
      setPendingEventDecision,
      pendingEventDecision,
    } = useGamificationStore.getState()
    const { isBankrupt } = useFinanceStore.getState()
    const { level } = useGamificationStore.getState()

    // Pause if bankrupt
    if (isBankrupt) {
      this.pause()
      return
    }

    // Pause if there is an event awaiting a player decision
    if (pendingEventDecision !== null) {
      return
    }

    // Step 1: compute effective rates from active events
    const rates = applyEvents(activeEvents, currentTick)

    // Step 2: expire events whose duration has passed
    this.scheduler.expireEvents(activeEvents, currentTick)
    expireEvents(currentTick)

    // Step 3: maybe fire a new event
    const newEvent = this.scheduler.roll(currentTick)
    if (newEvent) {
      triggerEvent(newEvent)
      // Pause and prompt the player to decide
      setPendingEventDecision(newEvent)
      return
    }

    // Step 4: tick pipeline
    consumeMP()
    progressProduction()
    accumulateCosts({
      laborMultiplier: rates.laborMultiplier,
      cifWasteAddition: rates.cifWasteAddition,
    })
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

    // Step 9: check market orders
    const marketStore = useMarketStore.getState()
    if (marketStore.shouldGenerate(currentTick + 1, level)) {
      marketStore.generateOrder(currentTick + 1, level)
    }
    // Expire accepted orders that missed their deadline
    for (const order of marketStore.acceptedOrders) {
      if (order.status === 'accepted' && currentTick + 1 >= order.deadlineTick) {
        useMarketStore.setState((s) => ({
          acceptedOrders: s.acceptedOrders.map((o) =>
            o.id === order.id ? { ...o, status: 'failed' as const } : o
          ),
        }))
        useFinanceStore.getState().setReputationPenalty(currentTick + 1 + 30)
      }
    }

    // Step 10: check level objective
    const progressStore = useProgressStore.getState()
    if (!progressStore.levelCompleted) {
      progressStore.checkObjective(currentTick + 1, level)
    }
  }
}

export const simulationEngine = new SimulationEngine()
