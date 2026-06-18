import { useFinanceStore } from '@/store/financeStore'
import { useCostStatementStore } from '@/store/costStatementStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export function LiquidityModal() {
  const { isBankrupt, clearBankruptcy, creditCash } = useFinanceStore()
  const statement = useCostStatementStore((s) => s.statement)
  const { items } = useInventoryStore()
  const { addXP, unlockAchievement } = useGamificationStore()
  const { sessionId } = useAuthStore()
  const navigate = useNavigate()

  if (!isBankrupt) return null

  const ptItem = Object.values(items).find((i) => i.category === 'PT' && i.quantity > 0)
  const canSell = ptItem && ptItem.quantity > 0

  function handleSellPT() {
    if (!ptItem) return
    const revenue = ptItem.quantity * ptItem.unitCost * 1.1
    creditCash(revenue)
    clearBankruptcy()
    // unlock comeback-kid
    unlockAchievement('comeback-kid', 0)
    addXP(50)
  }

  function handleEnd() {
    navigate(sessionId ? `/results/${sessionId}` : '/game')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-lg border border-status-error bg-surface-primary p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <h2 className="text-lg font-bold text-status-error font-mono">CRISIS DE LIQUIDEZ</h2>
            <p className="text-xs text-text-muted">La caja llegó a $0 con producción activa</p>
          </div>
        </div>

        {/* Mini-ECPV del momento */}
        <div className="rounded border border-border-default bg-surface-card p-3 mb-4 space-y-1 text-xs font-mono">
          <p className="text-text-muted uppercase tracking-wide text-[10px] mb-2">
            Estado actual de costos
          </p>
          <div className="flex justify-between">
            <span className="text-text-muted">Costo de Producción</span>
            <span>{fmt(statement.productionCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Costo de Ventas</span>
            <span>{fmt(statement.salesCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Ingresos</span>
            <span className="text-status-ok">{fmt(statement.revenue)}</span>
          </div>
          <div className="flex justify-between border-t border-border-default pt-1 font-bold">
            <span>Utilidad / Pérdida</span>
            <span className={statement.profit >= 0 ? 'text-status-ok' : 'text-status-error'}>
              {fmt(statement.profit)}
            </span>
          </div>
        </div>

        <p className="text-xs text-text-secondary mb-5 leading-relaxed">
          Sin caja no hay producción. Esto ocurre cuando los costos acumulados (MOD + CIF) superan
          los ingresos del período. Revisa tu ECPV: ¿el Costo de Ventas supera los Ingresos?
        </p>

        <div className="flex flex-col gap-2">
          {canSell && (
            <button onClick={handleSellPT} className="btn-primary text-sm w-full">
              Liquidar inventario de PT (+{fmt(ptItem!.quantity * ptItem!.unitCost * 1.1)})
            </button>
          )}
          <button onClick={handleEnd} className="btn-secondary text-sm w-full">
            Ver resultados de la sesión
          </button>
        </div>
      </div>
    </div>
  )
}
