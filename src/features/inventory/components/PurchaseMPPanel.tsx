import { useState } from 'react'
import { useInventoryStore } from '@/store/inventoryStore'
import { usePurchaseMP } from '../hooks/usePurchaseMP'
import { INITIAL_INVENTORY } from '@/constants/gameBalance'

const MP_ITEMS = INITIAL_INVENTORY.filter((i) => i.category === 'MP')

const DEFAULT_PRICES: Record<string, number> = {
  'green-beans': 2_500,
  'packaging-material': 800,
}

function fmt(n: number) {
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

export function PurchaseMPPanel() {
  const items = useInventoryStore((s) => s.items)
  const purchaseMP = usePurchaseMP()

  const [selectedId, setSelectedId] = useState(MP_ITEMS[0].id)
  const [qty, setQty] = useState(10)
  const [unitCost, setUnitCost] = useState(DEFAULT_PRICES[MP_ITEMS[0].id])
  const [feedback, setFeedback] = useState<string | null>(null)

  const selected = items[selectedId]
  const space = selected ? selected.maxCapacity - selected.quantity : 0
  const total = qty * unitCost

  function handleSelect(id: string) {
    setSelectedId(id)
    setUnitCost(DEFAULT_PRICES[id] ?? 0)
    setFeedback(null)
  }

  function handleBuy() {
    if (qty <= 0 || qty > space) {
      setFeedback(
        qty <= 0
          ? 'Cantidad debe ser mayor a 0.'
          : `Capacidad disponible: ${space.toFixed(1)} unidades.`
      )
      return
    }
    const result = purchaseMP(selectedId, qty, unitCost)
    if (result.error) {
      setFeedback(result.error)
      return
    }
    setFeedback(`✓ Compra registrada: ${qty} u. por ${fmt(total)}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stock table */}
      <div className="rounded-md border border-border-default overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-surface-elevated">
            <tr>
              <th className="px-3 py-2 text-left text-text-muted font-medium">Artículo</th>
              <th className="px-3 py-2 text-right text-text-muted font-medium">Existencias</th>
              <th className="px-3 py-2 text-right text-text-muted font-medium">Capacidad</th>
              <th className="px-3 py-2 text-right text-text-muted font-medium">Costo/u</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {MP_ITEMS.map((def) => {
              const item = items[def.id]
              const pct = item ? item.quantity / item.maxCapacity : 0
              return (
                <tr key={def.id} className="bg-surface-secondary">
                  <td className="px-3 py-2 text-text-primary">{def.name}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={pct > 0.9 ? 'text-status-error' : 'text-text-primary'}>
                      {item?.quantity.toFixed(1) ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-text-muted">{def.maxCapacity}</td>
                  <td className="px-3 py-2 text-right text-text-muted">
                    {fmt(item?.unitCost ?? def.unitCost)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Purchase form */}
      <div className="flex flex-col gap-3 rounded-md border border-border-default p-3">
        <p className="text-xs font-semibold text-text-primary">Nueva compra</p>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Ítem</label>
          <select
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
            className="rounded border border-border-default bg-surface-secondary px-2 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
          >
            {MP_ITEMS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Cantidad</label>
            <input
              type="number"
              min={1}
              max={space}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="rounded border border-border-default bg-surface-secondary px-2 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Precio/u (COP)</label>
            <input
              type="number"
              min={1}
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="rounded border border-border-default bg-surface-secondary px-2 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Total</span>
          <span className="font-mono text-accent-primary font-semibold">{fmt(total)}</span>
        </div>

        {feedback && (
          <p
            className={`text-xs rounded px-2 py-1 ${feedback.startsWith('✓') ? 'text-status-success bg-status-success/10' : 'text-status-error bg-status-error/10'}`}
          >
            {feedback}
          </p>
        )}

        <button onClick={handleBuy} className="btn-primary text-xs">
          Comprar
        </button>
      </div>
    </div>
  )
}
