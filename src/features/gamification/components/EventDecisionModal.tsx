import { useEffect, useState } from 'react'
import { useGamificationStore } from '@/store/gamificationStore'
import { useFinanceStore } from '@/store/financeStore'
import { useCostStatementStore } from '@/store/costStatementStore'
import { simulationEngine } from '@/simulation/engine'
import type { EventResponse } from '@/types'

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const DECISION_SECONDS = 120 // 2 minutes — player needs time to read and think

const SEVERITY_COLOR: Record<string, string> = {
  low: 'border-status-warn text-status-warn',
  medium: 'border-status-warn text-status-warn',
  high: 'border-status-error text-status-error',
}

export function EventDecisionModal() {
  const { pendingEventDecision, resolveEventWithResponse } = useGamificationStore()
  const { debitCash } = useFinanceStore()
  const statement = useCostStatementStore((s) => s.statement)
  const [secondsLeft, setSecondsLeft] = useState(DECISION_SECONDS)
  const [chosen, setChosen] = useState<'A' | 'B' | 'C' | null>(null)
  const [showOutcome, setShowOutcome] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState<EventResponse | null>(null)

  useEffect(() => {
    if (!pendingEventDecision) {
      setSecondsLeft(DECISION_SECONDS)
      setChosen(null)
      setShowOutcome(false)
      setSelectedResponse(null)
      return
    }
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // Auto-select option B (absorb) if time runs out
          handleChoose('B')
          clearInterval(interval)
          return 0
        }
        return s - 1
      })
    }, 1_000)
    return () => clearInterval(interval)
  }, [pendingEventDecision?.id])

  if (!pendingEventDecision) return null

  const event = pendingEventDecision
  const timerPct = (secondsLeft / DECISION_SECONDS) * 100
  const severityClass = SEVERITY_COLOR[event.severity] ?? 'border-status-warn text-status-warn'

  function handleChoose(responseId: 'A' | 'B' | 'C') {
    const response = event.responses.find((r) => r.id === responseId)
    if (!response) return

    setChosen(responseId)
    setSelectedResponse(response)
    setShowOutcome(true)

    if (response.effect.cashDebitOnce) {
      debitCash(response.effect.cashDebitOnce)
    }

    resolveEventWithResponse(event.id, responseId)
  }

  function handleContinue() {
    simulationEngine.start()
  }

  if (showOutcome && selectedResponse) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
        <div className="w-full max-w-sm rounded-lg border border-border-default bg-surface-primary p-5 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✓</span>
            <h3 className="text-sm font-bold text-text-primary font-mono">DECISIÓN TOMADA</h3>
          </div>

          <div className="rounded border border-accent-primary/30 bg-accent-primary/5 p-3 mb-3 text-xs">
            <p className="font-bold text-accent-primary mb-1">Elegiste: {selectedResponse.label}</p>
            <p className="text-text-muted">{selectedResponse.costLabel}</p>
          </div>

          <div className="rounded border border-border-default bg-surface-card p-3 mb-4 text-xs text-text-secondary leading-relaxed">
            <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1">
              Por qué importa en el ECPV
            </p>
            {selectedResponse.pedagogicalHint}
          </div>

          <button onClick={handleContinue} className="btn-primary text-xs w-full">
            Continuar producción
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg border border-border-default bg-surface-primary p-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-mono">{event.title}</h3>
              <span
                className={`text-xs font-mono uppercase border rounded px-1.5 py-0.5 ${severityClass}`}
              >
                {event.severity === 'high' ? 'Alta' : 'Media'} severidad
              </span>
            </div>
          </div>
          <span className="text-sm font-mono text-text-muted shrink-0 ml-2 tabular-nums">
            {secondsLeft}s
          </span>
        </div>

        {/* Countdown */}
        <div className="h-1.5 w-full rounded-full bg-surface-elevated overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-status-warn transition-all duration-1000"
            style={{ width: `${timerPct}%` }}
          />
        </div>

        <p className="text-sm text-text-secondary mb-4 leading-relaxed">{event.description}</p>

        {/* ECPV impact preview */}
        <div className="rounded border border-border-default bg-surface-card p-3 mb-4 text-sm font-mono space-y-1">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            Situación actual en tu ECPV
          </p>
          <div className="flex justify-between">
            <span className="text-text-muted">Costo de Producción</span>
            <span className="text-text-primary font-bold">{fmt(statement.productionCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Utilidad</span>
            <span
              className={`font-bold ${statement.profit >= 0 ? 'text-status-ok' : 'text-status-error'}`}
            >
              {fmt(statement.profit)}
            </span>
          </div>
        </div>

        {/* Response options */}
        <p className="text-sm font-semibold text-text-primary mb-3">¿Cómo respondes?</p>
        <div className="flex flex-col gap-3">
          {event.responses.map((r) => (
            <button
              key={r.id}
              onClick={() => handleChoose(r.id)}
              disabled={chosen !== null}
              className="text-left rounded border border-border-default bg-surface-card hover:border-accent-primary hover:bg-accent-primary/5 transition-colors p-4 disabled:opacity-40"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-bold font-mono text-accent-primary bg-accent-primary/10 rounded px-2 py-0.5">
                  {r.id}
                </span>
                <span className="text-sm font-bold text-text-primary">{r.label}</span>
              </div>
              <p className="text-sm text-text-muted ml-8 mb-1.5 leading-relaxed">{r.description}</p>
              <p className="text-sm font-mono text-status-warn ml-8 font-semibold">{r.costLabel}</p>
            </button>
          ))}
        </div>

        <p className="text-xs text-text-muted mt-3 text-center font-mono">
          Si el tiempo expira, se aplica la opción B automáticamente
        </p>
      </div>
    </div>
  )
}
