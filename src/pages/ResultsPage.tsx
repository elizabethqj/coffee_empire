import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { GameLayout } from '@/layouts/GameLayout'
import { useAuthStore } from '@/store'
import { Leaderboard } from '@/features/gamification/components/Leaderboard'

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

export function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    if (!sessionId || !user) return
    setExporting(true)
    setError(null)

    try {
      const functions = getFunctions()
      const exportFn = httpsCallable<{ sessionId: string }, ExportResponse>(functions, 'exportResults')
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
        {/* Results summary */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary font-mono">
                Resultados de la Sesión
              </h2>
              <p className="text-sm text-text-muted mt-1 font-mono">{sessionId}</p>
            </div>

            <div className="panel p-6 space-y-4">
              <p className="text-sm text-text-secondary">
                Sesión completada. Descarga el reporte de analítica para revisar el desempeño completo.
              </p>

              {error && (
                <p className="text-xs text-status-error font-mono">{error}</p>
              )}

              <button
                onClick={handleExport}
                disabled={exporting || exported || !sessionId}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {exporting ? 'Exportando…' : exported ? '✓ CSV descargado' : 'Descargar CSV de analítica'}
              </button>
            </div>

            <button
              onClick={() => navigate('/game')}
              className="btn-secondary text-sm"
            >
              Nueva sesión
            </button>
          </div>
        </div>

        {/* Leaderboard sidebar */}
        <div className="w-72 border-l border-border-default overflow-y-auto p-4">
          <Leaderboard level={1} />
        </div>
      </div>
    </GameLayout>
  )
}
