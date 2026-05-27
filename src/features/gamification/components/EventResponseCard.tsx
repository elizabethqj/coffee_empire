import { motion, AnimatePresence } from 'framer-motion'
import { useGamificationStore } from '@/store/gamificationStore'
import { useSimulationStore } from '@/store/simulationStore'

const SEVERITY_COLOR = {
  low: 'border-accent-secondary text-accent-secondary',
  medium: 'border-status-warn text-status-warn',
  high: 'border-status-error text-status-error',
}

const SEVERITY_LABEL = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

export function EventResponseCard() {
  const activeEvents = useGamificationStore((s) => s.activeEvents)
  const resolveEvent = useGamificationStore((s) => s.resolveEvent)
  const { tick } = useSimulationStore()

  if (activeEvents.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest font-mono">
        Eventos Activos ({activeEvents.length})
      </h3>

      <AnimatePresence>
        {activeEvents.map((event) => {
          const remaining = event.appliedAtTick + event.effectDurationTicks - tick
          const pct = Math.max(0, remaining / event.effectDurationTicks)

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded border bg-surface-primary p-3 ${SEVERITY_COLOR[event.severity]}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="text-xs font-bold font-mono">{event.title}</p>
                  <span className="text-xs opacity-70">
                    Severidad: {SEVERITY_LABEL[event.severity]}
                  </span>
                </div>
                <button
                  onClick={() => resolveEvent(event.id)}
                  className="text-text-muted hover:text-status-error text-lg leading-none shrink-0"
                  title="Descartar evento"
                >
                  ×
                </button>
              </div>

              <p className="text-xs text-text-muted leading-relaxed mb-2">
                {event.description}
              </p>

              {/* Duration bar */}
              <div className="h-1 rounded-full bg-surface-card overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${pct * 100}%`,
                    backgroundColor: event.severity === 'high' ? '#EF4444' : '#F59E0B',
                  }}
                />
              </div>
              <p className="text-xs text-text-muted/60 font-mono mt-1">
                {remaining} ticks restantes
              </p>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
