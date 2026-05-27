import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCostStatementStore } from '@/store/costStatementStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { assessmentService } from '@/services/assessmentService'
import { analyticsService } from '@/services/analyticsService'
import { useAuthStore, useSimulationStore } from '@/store'
import { XP_ASSESSMENT_PASS } from '@/constants/gameBalance'

interface Question {
  id: string
  text: string
  options: string[]
  correctIndex: number
  explanation: string
}

function buildQuestions(statement: ReturnType<typeof useCostStatementStore.getState>['statement']): Question[] {
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

  return [
    {
      id: 'q1',
      text: `Con un inventario inicial de MP de ${fmt(statement.initialMP)} y compras por ${fmt(statement.purchases)}, ¿cuál es el Material Utilizado si el inventario final de MP es ${fmt(statement.finalMP)}?`,
      options: [
        fmt(statement.materialUsed),
        fmt(statement.initialMP + statement.purchases),
        fmt(statement.purchases - statement.finalMP),
        fmt(statement.materialUsed * 1.1),
      ],
      correctIndex: 0,
      explanation: `Material Utilizado = Inicial + Compras − Final = ${fmt(statement.initialMP)} + ${fmt(statement.purchases)} − ${fmt(statement.finalMP)} = ${fmt(statement.materialUsed)}`,
    },
    {
      id: 'q2',
      text: `Si el Material Utilizado es ${fmt(statement.materialUsed)}, MOD = ${fmt(statement.mod)} y CIF = ${fmt(statement.cif)}, ¿cuál es el Costo de Producción?`,
      options: [
        fmt(statement.productionCost),
        fmt(statement.materialUsed + statement.mod),
        fmt(statement.mod + statement.cif),
        fmt(statement.productionCost + statement.cif),
      ],
      correctIndex: 0,
      explanation: `Costo de Producción = MPU + MOD + CIF = ${fmt(statement.materialUsed)} + ${fmt(statement.mod)} + ${fmt(statement.cif)} = ${fmt(statement.productionCost)}`,
    },
    {
      id: 'q3',
      text: `El Costo de Ventas del período es ${fmt(statement.salesCost)} y los ingresos son ${fmt(statement.revenue)}. ¿Cuál es la Utilidad?`,
      options: [
        fmt(statement.profit),
        fmt(statement.revenue + statement.salesCost),
        fmt(statement.salesCost),
        fmt(Math.abs(statement.profit)),
      ],
      correctIndex: 0,
      explanation: `Utilidad = Ingresos − Costo de Ventas = ${fmt(statement.revenue)} − ${fmt(statement.salesCost)} = ${fmt(statement.profit)}`,
    },
  ]
}

interface AssessmentProps {
  level: number
  onClose: () => void
}

export function Assessment({ level, onClose }: AssessmentProps) {
  const statement = useCostStatementStore((s) => s.statement)
  const { user } = useAuthStore()
  const { tick } = useSimulationStore()
  const { addXP } = useGamificationStore()

  const [questions] = useState(() => buildQuestions(statement))
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctIndex).length / questions.length
    : null

  async function handleSubmit() {
    setSubmitted(true)
    const finalScore = questions.filter((q) => answers[q.id] === q.correctIndex).length / questions.length

    if (finalScore >= 0.7) {
      addXP(XP_ASSESSMENT_PASS)
    }

    if (user) {
      const { sessionId } = useAuthStore.getState()

      await assessmentService.save({
        userId: user.uid,
        level,
        score: finalScore,
        completedAtTick: tick,
      }).catch(console.error)

      if (sessionId) {
        analyticsService
          .track('level_completed', sessionId, user.uid, tick, {
            level,
            score: finalScore,
            passed: finalScore >= 0.7,
            totalTicks: tick,
          })
          .catch(console.error)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-text-primary font-mono">
        Evaluación — Nivel {level}
      </h3>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {questions.map((q, qi) => (
              <div key={q.id}>
                <p className="text-xs text-text-secondary mb-2 leading-relaxed">
                  <span className="font-bold text-accent-primary mr-1">{qi + 1}.</span>
                  {q.text}
                </p>
                <div className="space-y-1">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                      className={`w-full text-left text-xs rounded px-3 py-1.5 border transition-colors font-mono ${
                        answers[q.id] === oi
                          ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                          : 'border-border-default text-text-muted hover:border-text-muted'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
              className="btn-primary w-full text-xs disabled:opacity-40"
            >
              Enviar respuestas
            </button>
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className={`rounded p-4 text-center border ${score! >= 0.7 ? 'border-status-ok bg-status-ok/10' : 'border-status-error bg-status-error/10'}`}>
              <p className="text-2xl font-bold font-mono">
                {(score! * 100).toFixed(0)}%
              </p>
              <p className={`text-sm mt-1 ${score! >= 0.7 ? 'text-status-ok' : 'text-status-error'}`}>
                {score! >= 0.7 ? '¡Aprobado! +200 XP' : 'No aprobado (mínimo 70%)'}
              </p>
            </div>

            {questions.map((q) => (
              <div key={q.id} className={`rounded border p-3 text-xs ${answers[q.id] === q.correctIndex ? 'border-status-ok' : 'border-status-error'}`}>
                <p className="text-text-secondary mb-1">{q.explanation}</p>
              </div>
            ))}

            <button onClick={onClose} className="btn-secondary w-full text-xs">
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
