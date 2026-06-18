import type { DynamicEvent, DynamicEventType } from '@/types'
import {
  EVENT_PROBABILITY_PER_TICK,
  EVENT_MIN_START_TICK,
  EVENT_MIN_COOLDOWN_TICKS,
} from '@/constants/gameBalance'

type EventTemplate = Omit<DynamicEvent, 'id' | 'appliedAtTick' | 'chosenResponseId'>

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: 'supplier_crisis',
    severity: 'high',
    title: 'Crisis de Proveedores',
    description:
      'El precio de las materias primas sube un 30% por escasez regional. Esto impactará tu Costo de MPD y el Costo de Producción.',
    pedagogicalNote:
      'El Costo de MPD es el primer elemento del Costo de Producción. Cuando sube, arrastra todo el ECPV hacia abajo.',
    effectDurationTicks: 30,
    responses: [
      {
        id: 'A',
        label: 'Stockear ahora',
        description:
          'Compra 30 unidades adicionales de café verde al precio actual antes de que suba.',
        costLabel: 'Usa $75.000 de caja inmediato',
        pedagogicalHint:
          'Comprar anticipado es una decisión de capital de trabajo. Aumenta tus Compras en el ECPV y protege tu MPD futuro.',
        effect: { cashDebitOnce: 75_000, reduceDurationTo: 8 },
      },
      {
        id: 'B',
        label: 'Absorber el costo',
        description: 'Continúa normal. El MPD subirá 30% y lo verás en el ECPV.',
        costLabel: 'MPD +30% en ECPV',
        pedagogicalHint:
          'La variación del MPD impacta directamente el Costo de Producción y baja la Utilidad.',
        effect: {},
      },
      {
        id: 'C',
        label: 'Pausar producción',
        description:
          'Espera 12 ticks a que pase la crisis. Sin producción ni costos por ese período.',
        costLabel: 'Sin costos, sin ingresos por 12 ticks',
        pedagogicalHint:
          'Pausar elimina el MOD y CIF por ese período (¿o los costos fijos continúan?). Este es el costo de oportunidad.',
        effect: { speedMultiplier: 0, reduceDurationTo: 12 },
      },
    ],
  },
  {
    type: 'demand_surge',
    severity: 'medium',
    title: 'Aumento de Demanda',
    description:
      'Una campaña viral incrementa el precio de venta potencial un 20%. Hay clientes dispuestos a pagar más.',
    pedagogicalNote:
      'Los ingresos son el precio × cantidad vendida. Más precio mejora la Utilidad sin cambiar el Costo de Ventas.',
    effectDurationTicks: 20,
    responses: [
      {
        id: 'A',
        label: 'Acelerar producción',
        description:
          'Produce más rápido consumiendo más energía. Captura el precio alto vendiendo más.',
        costLabel: '+$500/tick en CIF (energía)',
        pedagogicalHint:
          'Acelerar sube el CIF. ¿El margen adicional compensa el costo extra de energía?',
        effect: { cifWasteAddition: 500, priceMultiplier: 1.2 },
      },
      {
        id: 'B',
        label: 'Vender al precio mayor',
        description: 'Vende lo que tengas al 20% más sin cambiar nada en producción.',
        costLabel: 'Solo mejora el precio de venta',
        pedagogicalHint:
          'Ingresos sube sin cambiar el Costo de Ventas → Utilidad mejora. Visible directamente en el ECPV.',
        effect: { priceMultiplier: 1.2 },
      },
      {
        id: 'C',
        label: 'Ignorar la oportunidad',
        description: 'Sigue con el precio base. Dejas pasar el margen extra.',
        costLabel: 'Sin cambios, pierdes el margen extra',
        pedagogicalHint:
          'Costo de oportunidad: la utilidad que podrías haber tenido pero no tomaste.',
        effect: {},
      },
    ],
  },
  {
    type: 'machine_failure',
    severity: 'high',
    title: 'Falla de Máquina',
    description: 'La tostadora principal opera al 50% de velocidad. La producción se ralentiza.',
    pedagogicalNote:
      'Con menos velocidad, la MOD por unidad producida sube: mismo costo de mano de obra, menos output.',
    effectDurationTicks: 25,
    responses: [
      {
        id: 'A',
        label: 'Mantenimiento urgente',
        description:
          'Paga $80.000 de CIF ahora para reparar. Vuelve al 100% de velocidad en 5 ticks.',
        costLabel: '-$80.000 de caja, resuelve en 5 ticks',
        pedagogicalHint:
          'El costo de mantenimiento es parte del CIF. Invertir en mantenimiento puede mejorar la eficiencia total.',
        effect: { cashDebitOnce: 80_000, reduceDurationTo: 5 },
      },
      {
        id: 'B',
        label: 'Operar al 50%',
        description: 'Continúa con la producción reducida. Cada bolsa acumula más MOD relativo.',
        costLabel: 'Velocidad 50%, MOD/unidad sube',
        pedagogicalHint:
          'La MOD por unidad sube cuando el rendimiento baja. Es la relación entre costos fijos y unidades producidas.',
        effect: { laborMultiplier: 1.5 },
      },
      {
        id: 'C',
        label: 'Tercerizar la tostición',
        description:
          'Paga a un proveedor externo para tostar. Cuesta 15% más en MPD pero mantiene velocidad.',
        costLabel: '+15% MPD, velocidad normal',
        pedagogicalHint:
          'La decisión "hacer vs. comprar": ¿sale más barato producir o contratar a otro?',
        effect: { laborMultiplier: 1.0 },
      },
    ],
  },
  {
    type: 'waste_spike',
    severity: 'medium',
    title: 'Desperdicio Elevado',
    description: 'Un lote defectuoso añade $500 COP extra en desperdicio por tick.',
    pedagogicalNote:
      'El desperdicio es parte del CIF. Cuando sube, el Costo de Producción sube y la Utilidad baja.',
    effectDurationTicks: 15,
    responses: [
      {
        id: 'A',
        label: 'Parar y revisar equipos',
        description:
          'Detén la producción 10 ticks para inspección. Elimina el desperdicio completamente.',
        costLabel: '-10 ticks sin producción',
        pedagogicalHint:
          'El costo de calidad: parar cuesta tiempo, pero el desperdicio continuo puede costar más en ECPV.',
        effect: { speedMultiplier: 0, reduceDurationTo: 10 },
      },
      {
        id: 'B',
        label: 'Absorber el desperdicio',
        description: 'Sigue produciendo con el CIF elevado. Lo ves en el ECPV como mayor CIF.',
        costLabel: '+$500 CIF/tick, visible en ECPV',
        pedagogicalHint:
          'El desperdicio sube el CIF → sube el Costo de Producción → baja la Utilidad. Es la consecuencia directa.',
        effect: { cifWasteAddition: 500 },
      },
      {
        id: 'C',
        label: 'Cambiar proveedor de empaque',
        description: 'Demora 8 ticks en hacer el cambio, luego el desperdicio desaparece.',
        costLabel: '-8 ticks de transición',
        pedagogicalHint:
          'Las decisiones de proveeduría afectan el CIF. La inversión en calidad reduce los costos a futuro.',
        effect: { cifWasteAddition: 250, reduceDurationTo: 8 },
      },
    ],
  },
]

let _nextEventId = 1

export class EventScheduler {
  private activeTypes = new Set<DynamicEventType>()
  private lastEventTick = 0

  roll(currentTick: number): DynamicEvent | null {
    // Don't fire events in the learning phase or too close together
    if (currentTick < EVENT_MIN_START_TICK) return null
    if (currentTick - this.lastEventTick < EVENT_MIN_COOLDOWN_TICKS) return null
    if (Math.random() > EVENT_PROBABILITY_PER_TICK) return null

    const available = EVENT_TEMPLATES.filter((t) => !this.activeTypes.has(t.type))
    if (available.length === 0) return null

    const template = available[Math.floor(Math.random() * available.length)]
    this.activeTypes.add(template.type)

    this.lastEventTick = currentTick
    return {
      ...template,
      id: `event-${_nextEventId++}`,
      appliedAtTick: currentTick,
      chosenResponseId: null,
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
    this.lastEventTick = 0
    _nextEventId = 1
  }
}
