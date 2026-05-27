import { useState } from 'react'
import { useInventoryStore } from '@/store/inventoryStore'
import { useFinanceStore } from '@/store/financeStore'
import { useSellPT } from '../hooks/useSellPT'
import { INITIAL_INVENTORY, UNIT_SELLING_PRICE } from '@/constants/gameBalance'

const PT_ITEMS = INITIAL_INVENTORY.filter((i) => i.category === 'PT')

function fmt(n: number) {
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

export function SellPTPanel() {
  const items = useInventoryStore((s) => s.items)
  const financeState = useFinanceStore((s) => s.state)
  const sellPT = useSellPT()

  const [selectedId, setSelectedId] = useState(PT_ITEMS[0].id)
  const [qty, setQty] = useState(1)
  const [unitPrice, setUnitPrice] = useState(UNIT_SELLING_PRICE)
  const [feedback, setFeedback] = useState<string | null>(null)

  const selected = items[selectedId]
  const available = selected?.quantity ?? 0
  const unitCost = selected?.unitCost ?? 0
  const margin = unitPrice - unitCost
  const totalRevenue = qty * unitPrice
  const totalProfit = qty * margin

  function handleSell() {
    if (qty <= 0) { setFeedback('Cantidad debe ser mayor a 0.'); return }
    if (qty > available) { setFeedback(`Stock insuficiente. Disponible: ${available.toFixed(1)}`); return }
    sellPT(selectedId, qty, unitPrice)
    setFeedback(`✓ Venta registrada: ${qty} u. por ${fmt(totalRevenue)}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* PT stock */}
      <div className="rounded-md border border-border-default overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-surface-elevated">
            <tr>
              <th className="px-3 py-2 text-left text-text-muted font-medium">Producto</th>
              <th className="px-3 py-2 text-right text-text-muted font-medium">Existencias</th>
              <th className="px-3 py-2 text-right text-text-muted font-medium">Costo/u</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {PT_ITEMS.map((def) => {
              const item = items[def.id]
              return (
                <tr key={def.id} className="bg-surface-secondary">
                  <td className="px-3 py-2 text-text-primary">{def.name}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={!item || item.quantity === 0 ? 'text-text-muted' : 'text-text-primary'}>
                      {item?.quantity.toFixed(1) ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-text-muted">
                    {item?.unitCost ? fmt(item.unitCost) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Finance summary */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Ingresos', value: financeState.revenue },
          { label: 'Utilidad', value: financeState.profit },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-md border border-border-default bg-surface-secondary p-2 text-center">
            <p className="text-xs text-text-muted">{label}</p>
            <p className={`text-sm font-bold font-mono mt-0.5 ${value >= 0 ? 'text-status-success' : 'text-status-error'}`}>
              {fmt(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Sell form */}
      <div className="flex flex-col gap-3 rounded-md border border-border-default p-3">
        <p className="text-xs font-semibold text-text-primary">Nueva venta</p>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Producto</label>
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setFeedback(null) }}
            className="rounded border border-border-default bg-surface-secondary px-2 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
          >
            {PT_ITEMS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Cantidad</label>
            <input
              type="number"
              min={1}
              max={Math.floor(available)}
              value={qty}
              onChange={(e) => { setQty(Number(e.target.value)); setFeedback(null) }}
              className="rounded border border-border-default bg-surface-secondary px-2 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Precio/u (COP)</label>
            <input
              type="number"
              min={1}
              value={unitPrice}
              onChange={(e) => { setUnitPrice(Number(e.target.value)); setFeedback(null) }}
              className="rounded border border-border-default bg-surface-secondary px-2 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>Margen/u</span>
            <span className={`font-mono ${margin >= 0 ? 'text-status-success' : 'text-status-error'}`}>
              {fmt(margin)}
            </span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Ingreso total</span>
            <span className="font-mono text-accent-primary font-semibold">{fmt(totalRevenue)}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Utilidad estimada</span>
            <span className={`font-mono font-semibold ${totalProfit >= 0 ? 'text-status-success' : 'text-status-error'}`}>
              {fmt(totalProfit)}
            </span>
          </div>
        </div>

        {feedback && (
          <p className={`text-xs rounded px-2 py-1 ${feedback.startsWith('✓') ? 'text-status-success bg-status-success/10' : 'text-status-error bg-status-error/10'}`}>
            {feedback}
          </p>
        )}

        <button
          onClick={handleSell}
          disabled={available === 0}
          className="btn-primary text-xs disabled:opacity-40"
        >
          {available === 0 ? 'Sin stock' : 'Vender'}
        </button>
      </div>
    </div>
  )
}
