import type { CostStatement } from '@/types'

export interface FeedbackMessage {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  body: string
}

/**
 * Pure function — analyzes the cost statement and returns pedagogical feedback.
 * Called with consecutive snapshots to detect changes.
 */
export function analyzeCostStatement(
  current: CostStatement,
  previous: CostStatement | null
): FeedbackMessage[] {
  const messages: FeedbackMessage[] = []

  // Loss scenario
  if (current.profit < 0) {
    messages.push({
      id: 'loss',
      severity: 'critical',
      title: 'Período en pérdida',
      body: `Tu costo de ventas (${fmt(current.salesCost)}) supera tus ingresos (${fmt(current.revenue)}). Revisa los costos de producción o aumenta el precio de venta.`,
    })
  }

  // High CIF ratio
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

  // Inventory build-up (no sales)
  if (current.finalPT > 0 && current.revenue === 0) {
    messages.push({
      id: 'no-sales',
      severity: 'warning',
      title: 'Producto terminado sin vender',
      body: `Tienes ${fmt(current.finalPT)} en inventario de PT pero sin ingresos. Recuerda que los costos siguen acumulándose.`,
    })
  }

  // Positive improvement
  if (previous && current.profit > previous.profit && previous.profit <= 0) {
    messages.push({
      id: 'turnaround',
      severity: 'info',
      title: '¡Recuperación!',
      body: `Tu utilidad mejoró de ${fmt(previous.profit)} a ${fmt(current.profit)}. Sigue optimizando.`,
    })
  }

  // No raw material used (idle plant)
  if (current.materialUsed === 0 && current.purchases === 0) {
    messages.push({
      id: 'idle',
      severity: 'info',
      title: 'Planta inactiva',
      body: 'No se ha consumido materia prima. Crea órdenes de producción para iniciar el flujo de costos.',
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
