import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { GameLayout } from '@/layouts/GameLayout'
import { useAuthStore } from '@/store'
import { useGamificationStore } from '@/store/gamificationStore'
import { useFinanceStore } from '@/store/financeStore'
import { useCostStatementStore } from '@/store/costStatementStore'
import { useProgressStore } from '@/store/progressStore'
import { useSimulationStore } from '@/store/simulationStore'
import { Leaderboard } from '@/features/gamification/components/Leaderboard'
import { LEVEL_OBJECTIVES } from '@/constants/gameBalance'
import type { ConceptMastery } from '@/types'

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

interface ExportResponse {
  csv: string
  eventCount: number
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function StarDisplay({ stars }: { stars: 0 | 1 | 2 | 3 }) {
  return (
    <span className="text-2xl tracking-widest">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= stars ? 'text-accent-secondary' : 'text-text-muted'}>
          {i <= stars ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

function ECPVSummary() {
  const s = useCostStatementStore((state) => state.statement)

  const rows: { op?: string; label: string; value: number; bold?: boolean; large?: boolean }[] = [
    { label: 'Inv. Inicial MPD', value: s.initialMP },
    { op: '+', label: 'Compras netas', value: s.purchases },
    { op: '=', label: 'Disponible de MPD', value: s.availableMP, bold: true },
    { op: '−', label: 'Inv. Final MPD', value: s.finalMP },
    { op: '=', label: 'Costo de MPD', value: s.materialUsed, bold: true },
    { op: '+', label: 'MOD', value: s.mod },
    { op: '+', label: 'CIF', value: s.cif },
    { op: '=', label: 'Costo de Producción', value: s.productionCost, bold: true, large: true },
    { op: '+', label: 'Inv. Inicial PP', value: s.initialWIP },
    { op: '−', label: 'Inv. Final PP', value: s.finalWIP },
    { op: '=', label: 'Costo Prod. Terminada', value: s.finishedGoodsCost, bold: true },
    { op: '+', label: 'Inv. Inicial PT', value: s.initialPT },
    { op: '=', label: 'Disponible para venta', value: s.availableForSale, bold: true },
    { op: '−', label: 'Inv. Final PT', value: s.finalPT },
    { op: '=', label: 'Costo de Ventas', value: s.salesCost, bold: true, large: true },
    { label: 'Ingresos', value: s.revenue },
    { op: '=', label: 'Utilidad / Pérdida', value: s.profit, bold: true, large: true },
  ]

  return (
    <div className="rounded border border-border-default bg-surface-card overflow-hidden">
      <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted px-3 py-2 border-b border-border-default">
        ECPV Final
      </p>
      {rows.map((row, i) => (
        <div
          key={i}
          className={`flex justify-between items-center px-3 py-1 text-xs font-mono ${
            row.bold ? 'border-t border-border-default font-bold' : ''
          } ${row.large ? 'text-sm' : ''} ${
            row.label === 'Utilidad / Pérdida'
              ? s.profit >= 0
                ? 'text-status-ok'
                : 'text-status-error'
              : row.bold
                ? 'text-text-primary'
                : 'text-text-muted'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-4 text-text-muted/50 font-normal">{row.op ?? ''}</span>
            <span>{row.label}</span>
          </div>
          <span className="tabular-nums">{fmt(row.value)}</span>
        </div>
      ))}
    </div>
  )
}

function buildConceptMastery(
  statement: ReturnType<typeof useCostStatementStore.getState>['statement']
): ConceptMastery[] {
  return [
    {
      concept: 'costo-mpd',
      label: 'Costo de MPD',
      status: statement.materialUsed > 0 ? 'ok' : 'missing',
      note:
        statement.materialUsed > 0 ? 'Calculado correctamente' : 'No hubo compras ni consumo de MP',
    },
    {
      concept: 'costos-conversion',
      label: 'Costos de Conversión (MOD + CIF)',
      status:
        statement.mod > 0 && statement.cif > 0 ? 'ok' : statement.mod > 0 ? 'pending' : 'missing',
      note:
        statement.mod > 0 && statement.cif > 0
          ? 'MOD y CIF separados y acumulados'
          : statement.mod > 0
            ? 'Solo MOD — sin CIF acumulado'
            : 'Sin producción activa',
    },
    {
      concept: 'wip',
      label: 'WIP y grado de terminación',
      status: statement.initialWIP > 0 || statement.finalWIP > 0 ? 'ok' : 'pending',
      note:
        statement.finalWIP > 0
          ? 'WIP activo al cierre del período'
          : 'Sin órdenes en proceso al cierre — visible en el siguiente nivel',
    },
    {
      concept: 'costo-ventas',
      label: 'Costo de Ventas',
      status: statement.salesCost > 0 ? 'ok' : 'missing',
      note:
        statement.salesCost > 0 ? 'Calculado desde el flujo completo' : 'No se realizaron ventas',
    },
    {
      concept: 'utilidad',
      label: 'Utilidad / Pérdida',
      status: statement.revenue > 0 ? (statement.profit > 0 ? 'ok' : 'pending') : 'missing',
      note:
        statement.profit > 0
          ? 'Sesión rentable'
          : statement.revenue > 0
            ? 'Ventas sin utilidad — revisa costos'
            : 'Sin ingresos registrados',
    },
  ]
}

const STATUS_ICON: Record<string, string> = { ok: '✅', pending: '⚠️', missing: '❌' }
const STATUS_COLOR: Record<string, string> = {
  ok: 'text-status-ok',
  pending: 'text-status-warn',
  missing: 'text-text-muted',
}

export function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { level } = useGamificationStore()
  const { cashBalance } = useFinanceStore()
  const statement = useCostStatementStore((s) => s.statement)
  const { stars, completedAtTick } = useProgressStore()
  const { tick } = useSimulationStore()
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const levelStars = stars[level] ?? 0
  const obj = LEVEL_OBJECTIVES[level]
  const conceptMastery = buildConceptMastery(statement)
  const margin =
    statement.revenue > 0
      ? ((statement.revenue - statement.salesCost) / statement.revenue) * 100
      : 0

  async function handleExport() {
    if (!sessionId || !user) return
    setExporting(true)
    setError(null)
    try {
      const functions = getFunctions()
      const exportFn = httpsCallable<{ sessionId: string }, ExportResponse>(
        functions,
        'exportResults'
      )
      const result = await exportFn({ sessionId })
      downloadCsv(result.data.csv, `session-${sessionId}.csv`)
      setExported(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <GameLayout>
      <div className="flex flex-1 overflow-hidden">
        {/* ── Main results area ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary font-mono">
                Resultados — Nivel {level}
              </h2>
              <p className="text-xs text-text-muted font-mono mt-0.5">{sessionId}</p>
            </div>
            <StarDisplay stars={levelStars} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ── Financial summary ─────────────────────────────────── */}
            <div className="rounded border border-border-default bg-surface-card p-4 space-y-3">
              <p className="text-xs font-mono uppercase text-text-muted tracking-wide">
                Desempeño Financiero
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <p className="text-text-muted">Utilidad</p>
                  <p
                    className={`font-bold text-lg ${statement.profit > 0 ? 'text-status-ok' : 'text-status-error'}`}
                  >
                    {fmt(statement.profit)}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">Margen</p>
                  <p
                    className={`font-bold text-lg ${margin > 0 ? 'text-status-ok' : 'text-status-error'}`}
                  >
                    {margin.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">Ingresos</p>
                  <p className="text-text-primary font-semibold">{fmt(statement.revenue)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Costo de Ventas</p>
                  <p className="text-text-primary font-semibold">{fmt(statement.salesCost)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Caja final</p>
                  <p className="text-text-primary font-semibold">{fmt(cashBalance)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Ticks totales</p>
                  <p className="text-text-primary font-semibold">
                    {completedAtTick ?? tick} / {obj?.maxTicks ?? '—'}
                  </p>
                </div>
              </div>

              {obj && (
                <div className="border-t border-border-default pt-2 text-xs font-mono text-text-muted">
                  <p className="mb-1">Objetivo del nivel</p>
                  <p className="text-text-secondary">{obj.description}</p>
                </div>
              )}
            </div>

            {/* ── ECPV final ────────────────────────────────────────── */}
            <ECPVSummary />
          </div>

          {/* ── Concept mastery ───────────────────────────────────────── */}
          <div className="rounded border border-border-default bg-surface-card p-4">
            <p className="text-xs font-mono uppercase text-text-muted tracking-wide mb-3">
              Conceptos de esta sesión
            </p>
            <div className="space-y-2">
              {conceptMastery.map((c) => (
                <div key={c.concept} className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 mt-0.5">{STATUS_ICON[c.status]}</span>
                  <div>
                    <span className={`font-semibold font-mono ${STATUS_COLOR[c.status]}`}>
                      {c.label}
                    </span>
                    <span className="text-text-muted ml-2">— {c.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Actions ───────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/game')} className="btn-primary text-sm">
              🔄 Rejugar nivel {level}
            </button>
            <button onClick={() => navigate('/game')} className="btn-secondary text-sm">
              → Nueva sesión
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || exported || !sessionId}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {exporting ? 'Exportando…' : exported ? '✓ CSV descargado' : '↓ Descargar CSV'}
            </button>
          </div>

          {error && <p className="text-xs text-status-error font-mono">{error}</p>}
        </div>

        {/* ── Leaderboard sidebar ───────────────────────────────────── */}
        <div className="w-64 xl:w-72 border-l border-border-default overflow-y-auto p-4 shrink-0">
          <Leaderboard level={level} />
        </div>
      </div>
    </GameLayout>
  )
}
