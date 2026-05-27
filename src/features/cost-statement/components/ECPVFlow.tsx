import { useEffect, useRef } from 'react'
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

interface FlowNodeProps {
  label: string
  value: number
  formula: string
  explanation: string
  highlight?: 'ok' | 'warn' | 'error' | 'neutral'
  isLast?: boolean
}

function FlowNode({ label, value, formula, explanation, highlight = 'neutral', isLast }: FlowNodeProps) {
  const valueRef = useAnimatedNumber(value)

  const borderColor = {
    ok: 'border-status-ok',
    warn: 'border-status-warn',
    error: 'border-status-error',
    neutral: 'border-border-default',
  }[highlight]

  const textColor = {
    ok: 'text-status-ok',
    warn: 'text-status-warn',
    error: 'text-status-error',
    neutral: 'text-text-primary',
  }[highlight]

  return (
    <div className="flex flex-col items-center">
      <FormulaTooltip formula={formula} explanation={explanation}>
        <div
          className={`w-full rounded border ${borderColor} bg-surface-primary px-3 py-2 transition-colors duration-300`}
        >
          <p className="text-xs text-text-muted mb-0.5 font-mono uppercase tracking-wider">{label}</p>
          <p className={`text-sm font-bold font-mono tabular-nums ${textColor}`}>
            <span ref={valueRef}>{formatCOP(value)}</span>
          </p>
        </div>
      </FormulaTooltip>

      {!isLast && (
        <div className="h-5 w-px bg-border-default relative">
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border-default" />
        </div>
      )}
    </div>
  )
}

export function ECPVFlow() {
  const s = useCostStatementStore((state) => state.statement)

  const profitHighlight = s.profit > 0 ? 'ok' : s.profit === 0 ? 'warn' : 'error'

  return (
    <div className="flex flex-col gap-0">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 font-mono">
        Estado de Costos (ECPV)
      </h3>

      {/* MP Section */}
      <div className="rounded border border-border-default bg-surface-card p-2 mb-2 space-y-1.5">
        <p className="text-xs text-text-muted font-mono uppercase">Materia Prima</p>
        <div className="grid grid-cols-3 gap-1 text-xs font-mono">
          <div>
            <span className="text-text-muted">Inicial</span>
            <p className="text-text-primary">{formatCOP(s.initialMP)}</p>
          </div>
          <div>
            <span className="text-text-muted">+ Compras</span>
            <p className="text-text-primary">{formatCOP(s.purchases)}</p>
          </div>
          <div>
            <span className="text-text-muted">− Final</span>
            <p className="text-text-primary">{formatCOP(s.finalMP)}</p>
          </div>
        </div>
        <FlowNode
          label="Material Utilizado"
          value={s.materialUsed}
          formula="Inicial + Compras − Final MP"
          explanation="Costo de materia prima efectivamente consumida en el período de producción."
          highlight="neutral"
        />
      </div>

      <div className="h-4 flex items-center justify-center text-text-muted text-xs">↓ + MOD + CIF</div>

      {/* Cost of Production */}
      <div className="rounded border border-border-default bg-surface-card p-2 mb-2 space-y-1.5">
        <div className="grid grid-cols-2 gap-1 text-xs font-mono">
          <div>
            <span className="text-text-muted">MOD</span>
            <p className="text-text-primary">{formatCOP(s.mod)}</p>
          </div>
          <div>
            <span className="text-text-muted">CIF</span>
            <p className="text-text-primary">{formatCOP(s.cif)}</p>
          </div>
        </div>
        <FlowNode
          label="Costo de Producción"
          value={s.productionCost}
          formula="MPU + MOD + CIF"
          explanation="Suma de todos los costos incurridos durante el proceso productivo."
          highlight="neutral"
        />
      </div>

      <div className="h-4 flex items-center justify-center text-text-muted text-xs">↓ ± WIP</div>

      {/* WIP / Finished Goods */}
      <FlowNode
        label="Costo Prod. Terminada"
        value={s.finishedGoodsCost}
        formula="WIP Inicial + CP − WIP Final"
        explanation="Costo de los bienes completamente terminados durante el período."
      />

      <div className="h-4 flex items-center justify-center text-text-muted text-xs">↓ ± PT</div>

      {/* Sales Cost */}
      <FlowNode
        label="Costo de Ventas"
        value={s.salesCost}
        formula="PT Inicial + CPT − PT Final"
        explanation="Costo de los productos efectivamente vendidos en el período."
        highlight={s.salesCost > s.revenue ? 'error' : 'neutral'}
      />

      <div className="h-4 flex items-center justify-center text-text-muted text-xs">↓ vs Ingresos</div>

      {/* Profit */}
      <FlowNode
        label="Utilidad / Pérdida"
        value={s.profit}
        formula="Ingresos − Costo de Ventas"
        explanation="Resultado neto del período. Positivo = utilidad, negativo = pérdida."
        highlight={profitHighlight}
        isLast
      />

      {/* Revenue context */}
      <div className="mt-2 flex justify-between text-xs font-mono border-t border-border-default pt-2">
        <span className="text-text-muted">Ingresos del período</span>
        <span className="text-text-primary">{formatCOP(s.revenue)}</span>
      </div>

      {/* Trend chart */}
      <div className="mt-4">
        <p className="text-xs text-text-muted uppercase font-mono tracking-wider mb-2">Tendencia</p>
        <CostTrendChart />
      </div>
    </div>
  )
}
