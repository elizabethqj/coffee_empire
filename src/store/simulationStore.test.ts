import { describe, it, expect, beforeEach } from 'vitest'
import { useSimulationStore } from './simulationStore'

describe('simulationStore', () => {
  beforeEach(() => {
    useSimulationStore.setState({ running: false, tick: 0, speed: 1, periodStartTick: 0 })
  })

  it('start sets running to true', () => {
    useSimulationStore.getState().start()
    expect(useSimulationStore.getState().running).toBe(true)
  })

  it('pause sets running to false', () => {
    useSimulationStore.getState().start()
    useSimulationStore.getState().pause()
    expect(useSimulationStore.getState().running).toBe(false)
  })

  it('setSpeed updates speed', () => {
    useSimulationStore.getState().setSpeed(4)
    expect(useSimulationStore.getState().speed).toBe(4)
  })

  it('incrementTick advances tick by 1', () => {
    useSimulationStore.getState().incrementTick()
    expect(useSimulationStore.getState().tick).toBe(1)
  })

  it('incrementTick accumulates across multiple calls', () => {
    useSimulationStore.getState().incrementTick()
    useSimulationStore.getState().incrementTick()
    useSimulationStore.getState().incrementTick()
    expect(useSimulationStore.getState().tick).toBe(3)
  })

  it('startNewPeriod records current tick as period start', () => {
    useSimulationStore.setState({ tick: 42 })
    useSimulationStore.getState().startNewPeriod()
    expect(useSimulationStore.getState().periodStartTick).toBe(42)
  })
})
