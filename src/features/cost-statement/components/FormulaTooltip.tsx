import { useState, type ReactNode } from 'react'

interface FormulaTooltipProps {
  formula: string
  explanation: string
  children: ReactNode
}

export function FormulaTooltip({ formula, explanation, children }: FormulaTooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div className="absolute left-full ml-2 top-0 z-50 w-56 rounded bg-surface-primary border border-border-default p-3 shadow-xl pointer-events-none">
          <p className="text-xs font-mono text-accent-primary mb-1">{formula}</p>
          <p className="text-xs text-text-muted leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  )
}
