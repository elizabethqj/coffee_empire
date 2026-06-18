import { useProgressStore } from '@/store/progressStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { useFinanceStore } from '@/store/financeStore'
import { LEVEL_OBJECTIVES } from '@/constants/gameBalance'
import type { GameLevel } from '@/types'

interface Props {
  onAssessment: () => void
  onNextLevel: () => void
}

export function LevelCompleteModal({ onAssessment, onNextLevel }: Props) {
  const { levelCompleted, completedAtTick, awardStars, resetLevel } = useProgressStore()
  const { level, unlockAchievement, isAchievementUnlocked } = useGamificationStore()
  const { cashBalance, initialCash } = useFinanceStore()

  if (!levelCompleted || completedAtTick === null) return null

  const obj = LEVEL_OBJECTIVES[level]
  const earnedStars = awardStars(level, completedAtTick)
  const cashNeverCritical = cashBalance > initialCash * 0.2

  // Unlock relevant achievements
  if (earnedStars === 3 && !isAchievementUnlocked('level-3stars')) {
    unlockAchievement('level-3stars', completedAtTick)
  }
  if (cashNeverCritical && level === 3 && !isAchievementUnlocked('cash-never-critical')) {
    unlockAchievement('cash-never-critical', completedAtTick)
  }
  if (level === 1 && completedAtTick < 80 && !isAchievementUnlocked('speedrun')) {
    unlockAchievement('speedrun', completedAtTick)
  }

  const starDisplay = ['☆', '☆', '☆'].map((_, i) => (i < earnedStars ? '★' : '☆')).join('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-sm rounded-lg border border-accent-primary bg-surface-primary p-6 shadow-2xl">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-lg font-bold text-text-primary font-mono">
            NIVEL {level} COMPLETADO
          </h2>
          <p className="text-3xl mt-2 tracking-widest text-accent-secondary">{starDisplay}</p>
          <p className="text-xs text-text-muted mt-1">
            {earnedStars === 3
              ? '¡Rendimiento perfecto!'
              : earnedStars === 2
                ? 'Muy buen desempeño'
                : 'Objetivo cumplido'}
          </p>
        </div>

        <div className="rounded border border-border-default bg-surface-card p-3 mb-4 text-xs font-mono space-y-1">
          <div className="flex justify-between text-text-muted">
            <span>Objetivo</span>
            <span className="text-status-ok">✓ Cumplido</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Ticks empleados</span>
            <span className="text-text-primary">
              {completedAtTick} / {obj?.maxTicks ?? '—'}
            </span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Caja restante</span>
            <span className={cashNeverCritical ? 'text-status-ok' : 'text-status-warn'}>
              {cashBalance.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>

        {earnedStars < 3 && (
          <p className="text-xs text-text-muted text-center mb-4">
            Para 3 estrellas necesitabas completarlo en {obj?.starThresholds.three} ticks o menos.
            ¡Rejuega para mejorar!
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button onClick={onAssessment} className="btn-secondary text-xs w-full">
            Realizar evaluación del nivel
          </button>
          <button
            onClick={() => {
              resetLevel()
              onNextLevel()
            }}
            className="btn-primary text-xs w-full"
          >
            Continuar al nivel {Math.min(8, level + 1) as GameLevel}
          </button>
        </div>
      </div>
    </div>
  )
}
