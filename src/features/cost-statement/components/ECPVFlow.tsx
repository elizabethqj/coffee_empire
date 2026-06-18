import { useEffect, useRef, type ReactNode } from 'react'
import { animate } from 'framer-motion'
import { useCostStatementStore } from '@/store/costStatementStore'
import { FormulaTooltip } from './FormulaTooltip'
import { CostTrendChart } from './CostTrendChart'

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatCOP(value: number): string {
  return COP.format(value)
}

function useAnimatedNumber(value: number) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(value)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const from = prevValue.current
    prevValue.current = value

    const controls = animate(from, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate(v) {
        el.textContent = formatCOP(v)
      },
    })

    return () => controls.stop()
  }, [value])

  return ref
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, first = false }: { label: string; first?: boolean }) {
  return (
    <p
      className={`text-[10px] font-mono uppercase tracking-widest text-text-muted px-2 pt-2 pb-0.5 ${
        first ? '' : 'border-t border-border-default'
      }`}
    >
      {label}
    </p>
  )
}

interface RowProps {
  operator?: string
  label: string
  value: number
  badge?: string
  formula?: string
  explanation?: string
}

function ECPVRow({ operator, label, value, badge, formula, explanation }: RowProps) {
  const ref = useAnimatedNumber(value)

  const inner = (
    <div className="flex items-center justify-between py-1 px-2 text-xs font-mono text-text-muted">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="w-4 shrink-0 text-text-muted/50">{operator ?? ''}</span>
        <span className="truncate">{label}</span>
        {badge && (
          <span className="text-[9px] px-1 rounded bg-surface-primary border border-border-default text-text-muted/70 shrink-0 leading-4">
            {badge}
          </span>
        )}
      </div>
      <span className="tabular-nums shrink-0 ml-2 text-text-primary">
        <span ref={ref}>{formatCOP(value)}</span>
      </span>
    </div>
  )

  if (formula && explanation) {
    return (
      <FormulaTooltip formula={formula} explanation={explanation}>
        {inner}
      </FormulaTooltip>
    )
  }
  return inner
}

interface SubtotalProps {
  operator?: string
  label: string
  value: number
  formula: string
  explanation: string
  highlight?: 'ok' | 'warn' | 'error' | 'neutral'
  large?: boolean
}

function ECPVSubtotal({
  operator = '=',
  label,
  value,
  formula,
  explanation,
  highlight = 'neutral',
  large = false,
}: SubtotalProps) {
  const ref = useAnimatedNumber(value)

  const textColor = {
    ok: 'text-status-ok',
    warn: 'text-status-warn',
    error: 'text-status-error',
    neutral: 'text-text-primary',
  }[highlight]

  const inner = (
    <div
      className={`flex items-center justify-between border-t border-border-default px-2 py-1.5 font-mono font-bold ${
        large ? 'text-sm' : 'text-xs'
      } ${textColor}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="w-4 shrink-0 font-normal text-text-muted/50">{operator}</span>
        <span className="truncate">{label}</span>
      </div>
      <span className="tabular-nums shrink-0 ml-2">
        <span ref={ref}>{formatCOP(value)}</span>
      </span>
    </div>
  )

  return (
    <FormulaTooltip formula={formula} explanation={explanation}>
      {inner as ReactNode}
    </FormulaTooltip>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ECPVFlow() {
  const s = useCostStatementStore((state) => state.statement)

  const profitHighlight = s.profit > 0 ? 'ok' : s.profit === 0 ? 'warn' : 'error'
  const salesHighlight = s.salesCost > s.revenue ? 'error' : 'neutral'

  return (
    <div className="flex flex-col gap-0">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 font-mono">
        Estado de Costos (ECPV)
      </h3>

      <div className="rounded border border-border-default bg-surface-card overflow-hidden">
        {/* ── Materia Prima Directa ──────────────────────────── */}
        <SectionHeader label="Materia Prima Directa" first />
        <ECPVRow label="Inv. Inicial MPD" value={s.initialMP} />
        <ECPVRow operator="+" label="Compras netas" value={s.purchases} />
        <ECPVSubtotal
          label="Disponible de MPD"
          value={s.availableMP}
          formula="Inv. Inicial + Compras"
          explanation="Total de materia prima que estuvo disponible durante el período (antes de consumir)."
        />
        <ECPVRow operator="−" label="Inv. Final MPD" value={s.finalMP} />
        <ECPVSubtotal
          label="Costo de MPD"
          value={s.materialUsed}
          formula="Disponible de MPD − Inv. Final MPD"
          explanation="Costo de la materia prima directa efectivamente consumida en la producción del período."
        />

        {/* ── Costos de Conversión ──────────────────────────── */}
        <SectionHeader label="Costos de Conversión" />
        <ECPVRow
          operator="+"
          label="MOD"
          value={s.mod}
          badge="Costos primos"
          formula="Mano de Obra Directa"
          explanation="Costo de la mano de obra directamente aplicada al proceso. Junto con el MPD forma los 'Costos primos'."
        />
        <ECPVRow
          operator="+"
          label="CIF"
          value={s.cif}
          formula="Costos Indirectos de Fabricación"
          explanation="Energía + mantenimiento + desperdicios. Costos indirectos del proceso productivo."
        />
        <ECPVSubtotal
          label="Costo de Producción"
          value={s.productionCost}
          formula="MPD + MOD + CIF"
          explanation="Suma total de los tres elementos del costo: materia prima, mano de obra y costos indirectos del período."
          large
        />

        {/* ── Producción en Proceso ────────────────────────── */}
        <SectionHeader label="Producción en Proceso (WIP)" />
        <ECPVRow operator="+" label="Inv. Inicial PP" value={s.initialWIP} />
        <ECPVRow operator="−" label="Inv. Final PP" value={s.finalWIP} />
        <ECPVSubtotal
          label="Costo Prod. Terminada"
          value={s.finishedGoodsCost}
          formula="PP Inicial + Costo de Prod. − PP Final"
          explanation="Costo de los productos que completaron todo el proceso productivo. Ajusta el costo por el WIP que quedó en proceso."
        />

        {/* ── Producto Terminado ───────────────────────────── */}
        <SectionHeader label="Producto Terminado" />
        <ECPVRow operator="+" label="Inv. Inicial PT" value={s.initialPT} />
        <ECPVSubtotal
          label="Disponible para la venta"
          value={s.availableForSale}
          formula="Costo Prod. Terminada + Inv. Inicial PT"
          explanation="Total de productos terminados disponibles para vender en el período: los producidos más los que venían del período anterior."
        />
        <ECPVRow operator="−" label="Inv. Final PT" value={s.finalPT} />
        <ECPVSubtotal
          label="Costo de Ventas"
          value={s.salesCost}
          formula="Disponible para la venta − Inv. Final PT"
          explanation="Costo de los productos efectivamente vendidos en el período."
          highlight={salesHighlight}
          large
        />

        {/* ── Resultado del Período ────────────────────────── */}
        <SectionHeader label="Resultado del Período" />
        <ECPVRow label="Ingresos" value={s.revenue} />
        <ECPVSubtotal
          label="Utilidad / Pérdida"
          value={s.profit}
          formula="Ingresos − Costo de Ventas"
          explanation="Resultado neto del período. Positivo = utilidad, negativo = pérdida operacional."
          highlight={profitHighlight}
          large
        />
      </div>

      {/* Trend chart */}
      <div className="mt-4">
        <p className="text-xs text-text-muted uppercase font-mono tracking-wider mb-2">Tendencia</p>
        <CostTrendChart />
      </div>
    </div>
  )
}
