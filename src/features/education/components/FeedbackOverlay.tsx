import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCostStatementStore } from '@/store/costStatementStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { analyzeCostStatement, type FeedbackMessage } from '../feedbackEngine'

const SEVERITY_STYLES = {
  info: 'border-accent-secondary text-accent-secondary',
  warning: 'border-status-warn text-status-warn',
  critical: 'border-status-error text-status-error',
}

function FeedbackCard({ msg, onDismiss }: { msg: FeedbackMessage; onDismiss: () => void }) {
  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25 }}
      className={`rounded border bg-surface-card p-3 shadow-lg w-64 ${SEVERITY_STYLES[msg.severity]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold font-mono mb-0.5">{msg.title}</p>
          <p className="text-xs text-text-muted leading-relaxed">{msg.body}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary shrink-0 text-lg leading-none"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </motion.div>
  )
}

const MIN_TICKS_BETWEEN_MESSAGES = 30

export function FeedbackOverlay() {
  const history = useCostStatementStore((s) => s.history)
  const activeEvents = useGamificationStore((s) => s.activeEvents)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const prevRef = useRef<(typeof history)[0] | null>(null)
  const lastMessageTickRef = useRef(0)
  const [currentMsg, setCurrentMsg] = useState<FeedbackMessage | null>(null)

  useEffect(() => {
    if (history.length === 0) return

    const latest = history[history.length - 1]
    const prev = prevRef.current?.statement ?? null
    if (latest === prevRef.current) return

    prevRef.current = latest

    // Throttle: don't show a new message if one was shown recently
    const ticksSinceLast = latest.tick - lastMessageTickRef.current
    if (currentMsg && ticksSinceLast < MIN_TICKS_BETWEEN_MESSAGES) return

    const eventInfo = activeEvents.map((e) => ({
      type: e.type,
      chosenResponseId: e.chosenResponseId,
    }))
    const msgs = analyzeCostStatement(latest.statement, prev, eventInfo).filter(
      (m) => !dismissed.has(m.id)
    )

    // Show only the highest-priority message (critical > warning > info)
    const priority = ['critical', 'warning', 'info'] as const
    const topMsg = priority.flatMap((sev) => msgs.filter((m) => m.severity === sev))[0] ?? null

    if (topMsg && topMsg.id !== currentMsg?.id) {
      setCurrentMsg(topMsg)
      lastMessageTickRef.current = latest.tick
    }
  }, [history, activeEvents])

  if (!currentMsg || dismissed.has(currentMsg.id)) return null

  return (
    <div className="absolute bottom-4 right-4 z-20">
      <AnimatePresence mode="wait">
        <FeedbackCard
          key={currentMsg.id}
          msg={currentMsg}
          onDismiss={() => {
            setDismissed((prev) => new Set([...prev, currentMsg.id]))
            setCurrentMsg(null)
          }}
        />
      </AnimatePresence>
    </div>
  )
}
