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

function buildQuestionBank(
  statement: ReturnType<typeof useCostStatementStore.getState>['statement']
): Question[] {
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v)

  return [
    {
      id: 'q-available-mp',
      text: `Con un Inv. Inicial de MPD de ${fmt(statement.initialMP)} y compras por ${fmt(statement.purchases)}, ¿cuánto es el Disponible de MPD?`,
      options: [
        fmt(statement.availableMP),
        fmt(statement.materialUsed),
        fmt(statement.purchases),
        fmt(statement.initialMP),
      ],
      correctIndex: 0,
      explanation: `Disponible de MPD = Inv. Inicial + Compras = ${fmt(statement.initialMP)} + ${fmt(statement.purchases)} = ${fmt(statement.availableMP)}`,
    },
    {
      id: 'q-material-used',
      text: `El Disponible de MPD es ${fmt(statement.availableMP)} y el Inv. Final de MPD es ${fmt(statement.finalMP)}. ¿Cuál es el Costo de MPD?`,
      options: [
        fmt(statement.materialUsed),
        fmt(statement.availableMP),
        fmt(statement.purchases - statement.finalMP),
        fmt(statement.materialUsed * 1.1),
      ],
      correctIndex: 0,
      explanation: `Costo de MPD = Disponible − Inv. Final MP = ${fmt(statement.availableMP)} − ${fmt(statement.finalMP)} = ${fmt(statement.materialUsed)}`,
    },
    {
      id: 'q-production-cost',
      text: `Si el Costo de MPD es ${fmt(statement.materialUsed)}, MOD = ${fmt(statement.mod)} y CIF = ${fmt(statement.cif)}, ¿cuál es el Costo de Producción?`,
      options: [
        fmt(statement.productionCost),
        fmt(statement.materialUsed + statement.mod),
        fmt(statement.mod + statement.cif),
        fmt(statement.productionCost + statement.cif),
      ],
      correctIndex: 0,
      explanation: `CP = MPD + MOD + CIF = ${fmt(statement.materialUsed)} + ${fmt(statement.mod)} + ${fmt(statement.cif)} = ${fmt(statement.productionCost)}`,
    },
    {
      id: 'q-available-for-sale',
      text: `El Costo Prod. Terminada es ${fmt(statement.finishedGoodsCost)} y el Inv. Inicial PT es ${fmt(statement.initialPT)}. ¿Cuánto está disponible para la venta?`,
      options: [
        fmt(statement.availableForSale),
        fmt(statement.finishedGoodsCost),
        fmt(statement.salesCost),
        fmt(statement.finishedGoodsCost - statement.initialPT),
      ],
      correctIndex: 0,
      explanation: `Disponible para venta = CPT + Inv. Inicial PT = ${fmt(statement.finishedGoodsCost)} + ${fmt(statement.initialPT)} = ${fmt(statement.availableForSale)}`,
    },
    {
      id: 'q-sales-cost',
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
    {
      id: 'q-conversion-costs',
      text: `¿Cuáles son los Costos de Conversión?`,
      options: ['MOD + CIF', 'MPD + MOD', 'MPD + CIF', 'MPD + MOD + CIF'],
      correctIndex: 0,
      explanation: `Los Costos de Conversión son MOD + CIF. Transforman la materia prima en producto terminado. Los Costos Primos son MPD + MOD.`,
    },
    {
      id: 'q-wip-mpd',
      text: `En una orden de producción al 60% de avance, ¿cuál es el grado de terminación del MPD?`,
      options: ['100%', '60%', '50%', '0%'],
      correctIndex: 0,
      explanation: `El MPD (materia prima) se consume al INICIO de la orden. Su grado de terminación siempre es 100%, independientemente del avance de la orden.`,
    },
    {
      id: 'q-cif-impact',
      text: `Si hay un evento de desperdicio elevado, ¿qué línea del ECPV se ve afectada primero?`,
      options: [
        'CIF (Costos Indirectos de Fabricación)',
        'MPD (Materia Prima Directa)',
        'MOD (Mano de Obra Directa)',
        'Ingresos',
      ],
      correctIndex: 0,
      explanation: `El desperdicio es parte del CIF. Cuando sube, el CIF sube, luego el Costo de Producción sube, y finalmente la Utilidad baja.`,
    },
    {
      id: 'q-mp-price-impact',
      text: `Si compras MPD a un precio más alto que antes, ¿qué línea del ECPV cambia primero?`,
      options: [
        'Compras netas (y por ende el Costo de MPD)',
        'Costo de Ventas directamente',
        'MOD',
        'Utilidad (directamente)',
      ],
      correctIndex: 0,
      explanation: `El precio de compra impacta "Compras netas", luego el "Disponible de MPD", luego el "Costo de MPD", luego el "Costo de Producción", y finalmente la Utilidad.`,
    },
    {
      id: 'q-profit-formula',
      text: `¿Cuál es la fórmula correcta de la Utilidad en el ECPV?`,
      options: [
        'Ingresos − Costo de Ventas',
        'Costo de Producción − Costo de Ventas',
        'Ingresos − Costo de Producción',
        'Ingresos − MPD − MOD − CIF',
      ],
      correctIndex: 0,
      explanation: `Utilidad = Ingresos − Costo de Ventas. El Costo de Ventas ya incluye todos los costos (MPD, MOD, CIF) ajustados por los inventarios.`,
    },
  ]
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

interface AssessmentProps {
  level: number
  onClose: () => void
}

export function Assessment({ level, onClose }: AssessmentProps) {
  const statement = useCostStatementStore((s) => s.statement)
  const { user } = useAuthStore()
  const { tick } = useSimulationStore()
  const { addXP, unlockAchievement, isAchievementUnlocked } = useGamificationStore()

  const [questions] = useState(() => pickRandom(buildQuestionBank(statement), 5))
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctIndex).length / questions.length
    : null

  async function handleSubmit() {
    setSubmitted(true)
    const finalScore =
      questions.filter((q) => answers[q.id] === q.correctIndex).length / questions.length

    if (finalScore >= 0.7) {
      addXP(XP_ASSESSMENT_PASS)
    }

    if (finalScore === 1.0 && !isAchievementUnlocked('ecpv-master')) {
      unlockAchievement('ecpv-master', tick)
    }

    if (user) {
      const { sessionId } = useAuthStore.getState()

      await assessmentService
        .save({ userId: user.uid, level, score: finalScore, completedAtTick: tick })
        .catch(console.error)

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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary font-mono">
          Evaluación — Nivel {level}
        </h3>
        <span className="text-xs text-text-muted font-mono">{questions.length} preguntas</span>
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="questions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
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
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div
              className={`rounded p-4 text-center border ${
                score! >= 0.7
                  ? 'border-status-ok bg-status-ok/10'
                  : 'border-status-error bg-status-error/10'
              }`}
            >
              <p className="text-2xl font-bold font-mono">{(score! * 100).toFixed(0)}%</p>
              <p
                className={`text-sm mt-1 ${score! >= 0.7 ? 'text-status-ok' : 'text-status-error'}`}
              >
                {score! >= 0.7 ? '¡Aprobado! +200 XP' : 'No aprobado (mínimo 70%)'}
              </p>
              {score! === 1.0 && (
                <p className="text-xs text-accent-secondary mt-1 font-mono">
                  🏅 Logro desbloqueado: Maestro ECPV
                </p>
              )}
            </div>

            {questions.map((q) => (
              <div
                key={q.id}
                className={`rounded border p-3 text-xs ${
                  answers[q.id] === q.correctIndex ? 'border-status-ok' : 'border-status-error'
                }`}
              >
                <p className="font-semibold text-text-primary mb-1">
                  {answers[q.id] === q.correctIndex ? '✓ Correcto' : '✗ Incorrecto'}
                </p>
                <p className="text-text-secondary leading-relaxed">{q.explanation}</p>
              </div>
            ))}

            <button onClick={onClose} className="btn-secondary w-full text-xs">
              Cerrar evaluación
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
