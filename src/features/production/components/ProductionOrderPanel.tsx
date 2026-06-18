import { useState } from 'react'
import { useInventoryStore } from '@/store/inventoryStore'
import { useProductionStore } from '@/store/productionStore'
import { useSimulationStore } from '@/store/simulationStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useAuthStore } from '@/store/authStore'
import { analyticsService } from '@/services/analyticsService'
import { RECIPES, XP_CREATE_ORDER } from '@/constants/gameBalance'
import type { Recipe } from '@/types'

const AREA_RECIPE: Record<string, string> = {
  roasting: 'roasting',
  grinding: 'grinding',
  packaging: 'packaging',
}

function fmt(n: number) {
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-elevated overflow-hidden">
      <div
        className="h-full rounded-full bg-accent-primary transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

interface Props {
  areaId: string
}

export function ProductionOrderPanel({ areaId }: Props) {
  const recipeId = AREA_RECIPE[areaId]
  const recipe = RECIPES.find((r) => r.id === recipeId)

  const items = useInventoryStore((s) => s.items)
  const orders = useProductionStore((s) => s.orders)
  const createOrder = useProductionStore((s) => s.createOrder)
  const tick = useSimulationStore((s) => s.tick)
  const { addXP } = useGamificationStore()
  const { user, sessionId } = useAuthStore()

  const [qty, setQty] = useState(5)
  const [feedback, setFeedback] = useState<string | null>(null)

  const areaOrders = orders.filter((o) => o.recipeId === recipeId)
  const activeOrders = areaOrders.filter((o) => o.status === 'active')
  const completedOrders = areaOrders.filter((o) => o.status === 'completed')

  if (!recipe) {
    return <p className="text-xs text-text-muted">Receta no encontrada para esta área.</p>
  }

  function canFulfill(r: Recipe, quantity: number): { ok: boolean; missing: string[] } {
    const missing: string[] = []
    for (const req of r.mpRequirements) {
      const available = items[req.itemId]?.quantity ?? 0
      const needed = req.quantity * quantity
      if (available < needed) {
        missing.push(
          `${req.itemId}: necesitas ${needed.toFixed(1)}, tienes ${available.toFixed(1)}`
        )
      }
    }
    return { ok: missing.length === 0, missing }
  }

  function handleCreate() {
    if (qty <= 0) {
      setFeedback('Cantidad debe ser mayor a 0.')
      return
    }
    const { ok, missing } = canFulfill(recipe!, qty)
    if (!ok) {
      setFeedback(missing.join(' · '))
      return
    }

    createOrder(recipe!.id, qty, tick)
    addXP(XP_CREATE_ORDER)

    if (user && sessionId) {
      analyticsService
        .track('create_order', sessionId, user.uid, tick, { recipeId, qty })
        .catch(console.error)
    }

    setFeedback(`✓ Orden creada: ${qty} unidades de ${recipe!.name}`)
    setQty(5)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Recipe info */}
      <div className="rounded-md border border-border-default p-3 text-xs flex flex-col gap-2">
        <p className="font-semibold text-text-primary">{recipe.name}</p>
        <div className="flex flex-col gap-1 text-text-muted">
          <span>
            Duración: <span className="text-text-primary">{recipe.ticksRequired} ticks / lote</span>
          </span>
          <span>
            Salida:{' '}
            <span className="text-text-primary">
              {recipe.outputQuantity} {items[recipe.outputItem]?.name ?? recipe.outputItem}
            </span>{' '}
            por unidad
          </span>
        </div>
        <div className="mt-1">
          <p className="text-text-muted mb-1">Materiales requeridos:</p>
          {recipe.mpRequirements.map((req) => {
            const have = items[req.itemId]?.quantity ?? 0
            const need = req.quantity * qty
            const ok = have >= need
            return (
              <div key={req.itemId} className="flex justify-between">
                <span className="text-text-muted">{items[req.itemId]?.name ?? req.itemId}</span>
                <span className={ok ? 'text-status-success' : 'text-status-error'}>
                  {have.toFixed(1)} / {need.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Create order form */}
      <div className="flex flex-col gap-3 rounded-md border border-border-default p-3">
        <p className="text-xs font-semibold text-text-primary">Nueva orden</p>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-text-muted">Cantidad (lotes)</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => {
                setQty(Number(e.target.value))
                setFeedback(null)
              }}
              data-tutorial-target="order-qty-input"
              className="rounded border border-border-default bg-surface-secondary px-2 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
            />
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary text-xs self-end px-4 py-1.5"
            data-tutorial-target="confirm-order-btn"
          >
            Iniciar
          </button>
        </div>
        {feedback && (
          <p
            className={`text-xs rounded px-2 py-1 ${feedback.startsWith('✓') ? 'text-status-success bg-status-success/10' : 'text-status-error bg-status-error/10'}`}
          >
            {feedback}
          </p>
        )}
      </div>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-text-primary">
            En producción ({activeOrders.length})
          </p>
          {activeOrders.map((o) => (
            <div
              key={o.id}
              className="rounded-md border border-border-default p-3 flex flex-col gap-2"
            >
              <div className="flex justify-between text-xs">
                <span className="text-text-muted font-mono">{o.id}</span>
                <span className="text-accent-primary font-semibold">{o.progress.toFixed(0)}%</span>
              </div>
              <ProgressBar value={o.progress} />
              {/* WIP cost breakdown — grado de terminación por elemento */}
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-text-muted">
                    <th className="text-left font-normal py-0.5">Elemento</th>
                    <th className="text-right font-normal">Acumulado</th>
                    <th className="text-right font-normal pl-2">G.T.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr title="MPD se consume completamente al iniciar la orden (100% desde el tick 1)">
                    <td className="text-text-muted py-0.5">MPD</td>
                    <td className="text-right text-text-primary">{fmt(o.accumulatedMPD)}</td>
                    <td className="text-right text-status-ok pl-2">100%</td>
                  </tr>
                  <tr>
                    <td className="text-text-muted py-0.5">MOD</td>
                    <td className="text-right text-text-primary">{fmt(o.accumulatedMOD)}</td>
                    <td className="text-right text-accent-primary pl-2">
                      {o.progress.toFixed(0)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="text-text-muted py-0.5">CIF</td>
                    <td className="text-right text-text-primary">{fmt(o.accumulatedCIF)}</td>
                    <td className="text-right text-accent-primary pl-2">
                      {o.progress.toFixed(0)}%
                    </td>
                  </tr>
                  <tr className="border-t border-border-default">
                    <td className="text-text-muted font-bold pt-1">Total WIP</td>
                    <td className="text-right text-text-primary font-bold pt-1">
                      {fmt(o.accumulatedMPD + o.accumulatedMOD + o.accumulatedCIF)}
                    </td>
                    <td className="pl-2" />
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Completed count */}
      {completedOrders.length > 0 && (
        <p className="text-xs text-text-muted text-center">
          {completedOrders.length} orden(es) completada(s) esta sesión
        </p>
      )}
    </div>
  )
}
