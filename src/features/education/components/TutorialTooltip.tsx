import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface TutorialTooltipProps {
  tip: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactNode
}

export function TutorialTooltip({ tip, position = 'top', children }: TutorialTooltipProps) {
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  if (dismissed) return <>{children}</>

  const posClass = {
    top: 'bottom-full mb-2 left-0',
    bottom: 'top-full mt-2 left-0',
    left: 'right-full mr-2 top-0',
    right: 'left-full ml-2 top-0',
  }[position]

  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-52 ${posClass}`}
          >
            <div className="rounded border border-accent-primary bg-surface-primary p-3 shadow-xl">
              <p className="text-xs text-text-secondary leading-relaxed">{tip}</p>
              <button
                onClick={(e) => { e.stopPropagation(); setDismissed(true) }}
                className="mt-2 text-xs text-accent-primary hover:underline"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
