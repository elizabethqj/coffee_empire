import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCostStatementStore } from '@/store/costStatementStore'
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

export function FeedbackOverlay() {
  const history = useCostStatementStore((s) => s.history)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const prevRef = useRef<(typeof history)[0] | null>(null)
  const [messages, setMessages] = useState<FeedbackMessage[]>([])

  useEffect(() => {
    if (history.length === 0) return

    const latest = history[history.length - 1]
    const prev = prevRef.current?.statement ?? null

    if (latest !== prevRef.current) {
      prevRef.current = latest
      const msgs = analyzeCostStatement(latest.statement, prev)
      setMessages(msgs)
      setDismissed(new Set())
    }
  }, [history])

  const visible = messages.filter((m) => !dismissed.has(m.id))

  if (visible.length === 0) return null

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
      <AnimatePresence>
        {visible.map((msg) => (
          <FeedbackCard
            key={msg.id}
            msg={msg}
            onDismiss={() => setDismissed((prev) => new Set([...prev, msg.id]))}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
