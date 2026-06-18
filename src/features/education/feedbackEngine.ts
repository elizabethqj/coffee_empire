import type { CostStatement } from '@/types'

export interface FeedbackMessage {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  body: string
}

interface ActiveEventInfo {
  type: string
  chosenResponseId: 'A' | 'B' | 'C' | null
}

/**
 * Pure function — analyzes the cost statement and returns pedagogical feedback.
 * Called with consecutive snapshots to detect changes.
 */
export function analyzeCostStatement(
  current: CostStatement,
  previous: CostStatement | null,
  activeEvents: ActiveEventInfo[] = []
): FeedbackMessage[] {
  const messages: FeedbackMessage[] = []

  // ── Standard rules ────────────────────────────────────────────────────────

  if (current.profit < 0) {
    messages.push({
      id: 'loss',
      severity: 'critical',
      title: 'Período en pérdida',
      body: `Tu costo de ventas (${fmt(current.salesCost)}) supera tus ingresos (${fmt(current.revenue)}). Revisa los costos de producción o aumenta el precio de venta.`,
    })
  }

  if (current.productionCost > 0) {
    const cifRatio = current.cif / current.productionCost
    if (cifRatio > 0.4) {
      messages.push({
        id: 'high-cif',
        severity: 'warning',
        title: 'CIF elevados',
        body: `Los costos indirectos (CIF) representan el ${(cifRatio * 100).toFixed(0)}% del costo de producción. Considera revisar el mantenimiento y el desperdicio.`,
      })
    }
  }

  if (current.finalPT > 0 && current.revenue === 0) {
    messages.push({
      id: 'no-sales',
      severity: 'warning',
      title: 'Producto terminado sin vender',
      body: `Tienes ${fmt(current.finalPT)} en inventario de PT pero sin ingresos. Recuerda que los costos siguen acumulándose.`,
    })
  }

  if (previous && current.profit > previous.profit && previous.profit <= 0) {
    messages.push({
      id: 'turnaround',
      severity: 'info',
      title: '¡Recuperación!',
      body: `Tu utilidad mejoró de ${fmt(previous.profit)} a ${fmt(current.profit)}. Sigue optimizando.`,
    })
  }

  if (current.materialUsed === 0 && current.purchases === 0) {
    messages.push({
      id: 'idle',
      severity: 'info',
      title: 'Planta inactiva',
      body: 'No se ha consumido materia prima. Crea órdenes de producción para iniciar el flujo de costos.',
    })
  }

  // ── Contextual event rules ─────────────────────────────────────────────────

  const supplierCrisis = activeEvents.find((e) => e.type === 'supplier_crisis')
  if (supplierCrisis && previous && current.materialUsed > previous.materialUsed * 1.15) {
    const diff = current.materialUsed - previous.materialUsed
    if (supplierCrisis.chosenResponseId === 'B') {
      messages.push({
        id: 'event-supplier-absorbed',
        severity: 'info',
        title: 'Impacto de la Crisis en tu ECPV',
        body: `Absorbiste el aumento de precio. Tu Costo de MPD subió ${fmt(diff)} y arrastró el Costo de Producción. Puedes verlo en el ECPV: "Costo de MPD" aumentó.`,
      })
    } else if (supplierCrisis.chosenResponseId === 'A') {
      messages.push({
        id: 'event-supplier-stocked',
        severity: 'info',
        title: 'Compra de cobertura activa',
        body: 'Compraste inventario extra antes de la subida de precios. Tu Disponible de MPD aumentó temporalmente. Si vendes antes de que se agote ese stock, proteges tu margen.',
      })
    }
  }

  const machineFailure = activeEvents.find((e) => e.type === 'machine_failure')
  if (machineFailure && previous) {
    const modIncrease = current.mod > previous.mod * 1.3
    if (modIncrease && machineFailure.chosenResponseId === 'B') {
      messages.push({
        id: 'event-machine-mod',
        severity: 'warning',
        title: 'MOD por unidad más alta',
        body: 'Con la máquina al 50%, produces la misma cantidad pero con más horas-máquina por unidad. Tu MOD total sube aunque la producción no cambie. Esto se refleja en el Costo de Producción.',
      })
    } else if (machineFailure.chosenResponseId === 'A') {
      const cifIncrease = current.cif - (previous?.cif ?? 0)
      if (cifIncrease > 0) {
        messages.push({
          id: 'event-machine-maintenance',
          severity: 'info',
          title: 'CIF de mantenimiento registrado',
          body: `El mantenimiento urgente agregó ${fmt(cifIncrease)} a tus CIF. Este es un costo indirecto de fabricación. Aunque duela ahora, restaura la velocidad de producción y reduce el costo por unidad a largo plazo.`,
        })
      }
    }
  }

  const wasteSpike = activeEvents.find((e) => e.type === 'waste_spike')
  if (wasteSpike && previous && current.cif > previous.cif * 1.2) {
    const cifDiff = current.cif - previous.cif
    messages.push({
      id: 'event-waste-cif',
      severity: 'warning',
      title: 'Desperdicio elevando tus CIF',
      body: `El desperdicio añadió ${fmt(cifDiff)} a tus Costos Indirectos (CIF). El flujo: desperdicio → CIF sube → Costo de Producción sube → Costo de Ventas sube → Utilidad baja. ${
        wasteSpike.chosenResponseId === 'B'
          ? 'Estás absorbiendo el costo. Considera si la opción de parar y revisar hubiera sido más rentable.'
          : ''
      }`,
    })
  }

  const demandSurge = activeEvents.find((e) => e.type === 'demand_surge')
  if (demandSurge && previous && current.revenue > previous.revenue * 1.1) {
    const revDiff = current.revenue - previous.revenue
    messages.push({
      id: 'event-demand-revenue',
      severity: 'info',
      title: 'Aumento de demanda en tus Ingresos',
      body: `Los ingresos subieron ${fmt(revDiff)} gracias al aumento de precio. Observa en el ECPV cómo la Utilidad mejora aunque el Costo de Ventas sea el mismo. Este es el efecto precio — diferente al efecto costo.`,
    })
  }

  // ── Disponible de MPD pedagogy ─────────────────────────────────────────────

  if (current.availableMP > 0 && current.finalMP / current.availableMP > 0.6) {
    messages.push({
      id: 'mp-underused',
      severity: 'info',
      title: 'MPD con baja rotación',
      body: `El ${((current.finalMP / current.availableMP) * 100).toFixed(0)}% de tu Disponible de MPD sigue en inventario final. Considera iniciar más órdenes para convertir ese stock en Costo de MPD y luego en Producto Terminado.`,
    })
  }

  // ── WIP pedagogy ──────────────────────────────────────────────────────────

  if (current.finalWIP > 0 && current.finalWIP > current.productionCost * 0.5) {
    messages.push({
      id: 'high-wip',
      severity: 'warning',
      title: 'Alto inventario WIP',
      body: `Tienes ${fmt(current.finalWIP)} en Producción en Proceso. Este costo no es Costo de Ventas todavía — está "atrapado" hasta que las órdenes se completen. Completa las órdenes pendientes para liberar el flujo.`,
    })
  }

  return messages
}

function fmt(v: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v)
}
