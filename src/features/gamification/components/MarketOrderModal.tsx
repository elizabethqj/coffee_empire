import { useEffect, useState } from 'react'
import { useMarketStore } from '@/store/marketStore'
import { useCostStatementStore } from '@/store/costStatementStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { simulationEngine } from '@/simulation/engine'

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const DECISION_SECONDS = 60 // 1 minute — player needs time to evaluate the offer

export function MarketOrderModal() {
  const { pendingOrder, acceptOrder, rejectOrder } = useMarketStore()
  const statement = useCostStatementStore((s) => s.statement)
  const { addXP } = useGamificationStore()
  const [secondsLeft, setSecondsLeft] = useState(DECISION_SECONDS)

  useEffect(() => {
    if (!pendingOrder) {
      setSecondsLeft(DECISION_SECONDS)
      return
    }
    setSecondsLeft(DECISION_SECONDS)
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          rejectOrder()
          clearInterval(interval)
          return 0
        }
        return s - 1
      })
    }, 1_000)
    return () => clearInterval(interval)
  }, [pendingOrder?.id])

  if (!pendingOrder) return null

  const estimatedCostPerUnit =
    statement.finishedGoodsCost > 0 && statement.salesCost > 0
      ? statement.salesCost / Math.max(1, pendingOrder.quantity)
      : null

  const estimatedMargin =
    estimatedCostPerUnit !== null ? pendingOrder.offerPricePerUnit - estimatedCostPerUnit : null

  function handleAccept() {
    acceptOrder()
    addXP(10)
    simulationEngine.start()
  }

  function handleReject() {
    rejectOrder()
  }

  const timerPct = (secondsLeft / DECISION_SECONDS) * 100

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-lg border border-accent-secondary bg-surface-primary p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <h3 className="text-base font-bold text-text-primary font-mono">PEDIDO DE MERCADO</h3>
          </div>
          <span className="text-sm font-mono text-text-muted tabular-nums">{secondsLeft}s</span>
        </div>

        {/* Countdown bar */}
        <div className="h-1 w-full rounded-full bg-surface-elevated overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-accent-secondary transition-all duration-1000"
            style={{ width: `${timerPct}%` }}
          />
        </div>

        {/* Order details */}
        <div className="rounded border border-border-default bg-surface-card p-4 mb-3 text-sm font-mono space-y-2">
          <div className="flex justify-between">
            <span className="text-text-muted">Cliente</span>
            <span className="text-text-primary font-semibold">{pendingOrder.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Cantidad pedida</span>
            <span className="text-text-primary font-bold text-base">
              {pendingOrder.quantity} bolsas
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Precio ofrecido</span>
            <span className="text-accent-secondary font-bold text-base">
              {fmt(pendingOrder.offerPricePerUnit)}/bolsa
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Tienes tiempo hasta</span>
            <span className="text-text-primary font-semibold">
              {pendingOrder.deadlineTick - pendingOrder.issuedAtTick} ticks
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Bonus si cumples a tiempo</span>
            <span className="text-status-ok font-bold">+10%</span>
          </div>
        </div>

        {/* Cost estimate from current ECPV */}
        {estimatedCostPerUnit !== null && (
          <div className="rounded border border-border-default bg-surface-elevated p-2 mb-4 text-xs font-mono space-y-1">
            <p className="text-text-muted text-[10px] uppercase tracking-wide">Tu ECPV dice…</p>
            <div className="flex justify-between">
              <span className="text-text-muted">Costo/bolsa estimado</span>
              <span className="text-text-primary">{fmt(estimatedCostPerUnit)}</span>
            </div>
            {estimatedMargin !== null && (
              <div className="flex justify-between font-bold">
                <span className="text-text-muted">Margen estimado</span>
                <span className={estimatedMargin > 0 ? 'text-status-ok' : 'text-status-error'}>
                  {fmt(estimatedMargin)}/bolsa
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={handleAccept} className="btn-primary text-xs flex-1 py-2">
            ✓ Aceptar pedido
          </button>
          <button onClick={handleReject} className="btn-secondary text-xs flex-1 py-2">
            ✗ Rechazar
          </button>
        </div>
      </div>
    </div>
  )
}
