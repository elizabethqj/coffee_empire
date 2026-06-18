import { useCostStatementStore } from '@/store/costStatementStore'
import { useFinanceStore } from '@/store/financeStore'
import { UNIT_SELLING_PRICE, CASH_CRITICAL_PCT } from '@/constants/gameBalance'

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export function LiveKPIPanel() {
  const statement = useCostStatementStore((s) => s.statement)
  const { cashBalance, initialCash } = useFinanceStore()

  const cashPct = initialCash > 0 ? cashBalance / initialCash : 1
  const isCritical = cashPct <= CASH_CRITICAL_PCT

  // Estimated cost per bag based on current ECPV
  const estimatedSalesUnits = Math.max(
    1,
    statement.salesCost > 0 ? Math.round(statement.salesCost / UNIT_SELLING_PRICE) : 1
  )
  const costPerUnit = statement.salesCost > 0 ? statement.salesCost / estimatedSalesUnits : null
  const marginPerUnit = costPerUnit !== null ? UNIT_SELLING_PRICE - costPerUnit : null
  const marginPct =
    costPerUnit !== null && costPerUnit > 0
      ? ((UNIT_SELLING_PRICE - costPerUnit) / UNIT_SELLING_PRICE) * 100
      : null

  return (
    <div className="rounded border border-border-default bg-surface-card p-2 text-xs font-mono space-y-2">
      <p className="text-[10px] text-text-muted uppercase tracking-wide">Estado en tiempo real</p>

      {/* Cost per unit */}
      <div>
        <p className="text-text-muted text-[10px]">Costo/bolsa estimado</p>
        {costPerUnit !== null ? (
          <p className="text-text-primary font-bold text-sm">{fmt(costPerUnit)}</p>
        ) : (
          <p className="text-text-muted">— sin ventas aún</p>
        )}
      </div>

      {/* Margin if sold now */}
      <div>
        <p className="text-text-muted text-[10px]">Margen si vendes ahora</p>
        {marginPerUnit !== null ? (
          <p
            className={`font-bold text-sm ${marginPerUnit > 0 ? 'text-status-ok' : 'text-status-error'}`}
          >
            {fmt(marginPerUnit)}
            {marginPct !== null && (
              <span className="text-xs font-normal ml-1">({marginPct.toFixed(1)}%)</span>
            )}
          </p>
        ) : (
          <p className="text-text-muted">—</p>
        )}
      </div>

      {/* Cash */}
      <div>
        <p className="text-text-muted text-[10px]">Caja disponible</p>
        <p
          className={`font-bold text-sm ${isCritical ? 'text-status-error' : 'text-text-primary'}`}
        >
          {fmt(cashBalance)}
        </p>
        <div className="h-1 w-full rounded-full bg-surface-elevated overflow-hidden mt-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-status-error animate-pulse' : 'bg-accent-primary'}`}
            style={{ width: `${Math.min(100, cashPct * 100).toFixed(0)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
