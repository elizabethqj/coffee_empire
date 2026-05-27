import type { DynamicEvent, DynamicEventType } from '@/types'
import { EVENT_PROBABILITY_PER_TICK } from '@/constants/gameBalance'

const EVENT_TEMPLATES: Omit<DynamicEvent, 'id' | 'appliedAtTick'>[] = [
  {
    type: 'supplier_crisis',
    severity: 'high',
    title: 'Crisis de Proveedores',
    description: 'El precio de las materias primas sube un 30% por escasez regional.',
    effectDurationTicks: 30,
  },
  {
    type: 'demand_surge',
    severity: 'medium',
    title: 'Aumento de Demanda',
    description: 'Una campaña viral incrementa el precio de venta un 20%.',
    effectDurationTicks: 20,
  },
  {
    type: 'machine_failure',
    severity: 'high',
    title: 'Falla de Máquina',
    description: 'La tostadora principal opera al 50% de velocidad.',
    effectDurationTicks: 25,
  },
  {
    type: 'waste_spike',
    severity: 'medium',
    title: 'Desperdicio Elevado',
    description: 'Un lote defectuoso añade $500 COP en desperdicio por tick.',
    effectDurationTicks: 15,
  },
]

let _nextEventId = 1

export class EventScheduler {
  private activeTypes = new Set<DynamicEventType>()

  /**
   * Returns a new event if the probability roll fires and the type isn't already active,
   * otherwise returns null. Call once per tick.
   */
  roll(currentTick: number): DynamicEvent | null {
    if (Math.random() > EVENT_PROBABILITY_PER_TICK) return null

    const available = EVENT_TEMPLATES.filter((t) => !this.activeTypes.has(t.type))
    if (available.length === 0) return null

    const template = available[Math.floor(Math.random() * available.length)]
    this.activeTypes.add(template.type)

    return {
      ...template,
      id: `event-${_nextEventId++}`,
      appliedAtTick: currentTick,
    }
  }

  expireEvents(activeEvents: DynamicEvent[], currentTick: number): void {
    for (const event of activeEvents) {
      if (currentTick >= event.appliedAtTick + event.effectDurationTicks) {
        this.activeTypes.delete(event.type)
      }
    }
  }

  reset(): void {
    this.activeTypes.clear()
    _nextEventId = 1
  }
}
