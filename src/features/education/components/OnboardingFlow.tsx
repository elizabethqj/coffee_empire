import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore } from '@/store/uiStore'
import { gameBridge } from '@/game/GameBridge'
import { simulationEngine } from '@/simulation/engine'

interface Step {
  title: string
  body: string
  highlightArea: string | null
  // Position of tooltip relative to viewport: 'left'|'center'|'right' × 'top'|'bottom'
  tooltipAlign: 'left' | 'center' | 'right'
  tooltipVert: 'top' | 'bottom'
}

// Positions match the Phaser layout: originX=10%, stepX=18%, baseY≈42% of canvas
// Canvas sits below the 48px header. Tooltip placed near each area with offset so it doesn't overlap.
const STEPS: Step[] = [
  {
    title: '1 — Almacén de Materias Primas',
    body: 'Aquí están tus materias primas: granos de café verde y material de empaque.\n\nComo en los ejemplos del profesor: sin MP no hay producción. Haz clic en esta área para comprar.',
    highlightArea: 'mp-warehouse',
    tooltipAlign: 'left',
    tooltipVert: 'bottom',
  },
  {
    title: '2 — Tostión (Producción en Proceso)',
    body: 'Al iniciar una orden de tostión, los granos salen del almacén y entran al proceso.\n\nDesde ese momento acumulan MPD (100%), MOD y CIF. Esto es tu WIP (Producción en Proceso del ECPV).',
    highlightArea: 'roasting',
    tooltipAlign: 'left',
    tooltipVert: 'top',
  },
  {
    title: '3 — Almacén de Producto Terminado',
    body: 'Cuando tostión, molido y empaque terminan, tienes "Café Andino 200g": tu Producto Terminado.\n\nLo que no vendas hoy es el Inventario Final de PT en el ECPV.',
    highlightArea: 'pt-warehouse',
    tooltipAlign: 'right',
    tooltipVert: 'bottom',
  },
  {
    title: '4 — Capital de Trabajo (Caja)',
    body: 'El saldo en la barra superior es tu capital de trabajo.\n\nCada compra de MP lo reduce. Cada venta de PT lo recupera. Si llegas a $0 con órdenes activas, la producción se detiene.',
    highlightArea: null,
    tooltipAlign: 'center',
    tooltipVert: 'top',
  },
  {
    title: '5 — ECPV en Tiempo Real',
    body: 'El botón "ECPV" en la barra abre el Estado de Costos — exactamente el formato del profesor.\n\nSe actualiza con cada compra, producción y venta. Úsalo para entender si estás ganando o perdiendo.',
    highlightArea: null,
    tooltipAlign: 'center',
    tooltipVert: 'top',
  },
]

// CSS positions for each tooltip (relative to viewport)
// Tuned for a typical game layout: header 48px, canvas fills the rest
const TOOLTIP_POSITIONS: Record<
  number,
  { left?: string; right?: string; top?: string; bottom?: string }
> = {
  0: { left: '2%', top: '55%' }, // mp-warehouse: left side, below area
  1: { left: '18%', bottom: '15%' }, // roasting: center-left, above area
  2: { right: '2%', top: '55%' }, // pt-warehouse: right side, below area
  3: { left: '50%', top: '15%' }, // cash: center top
  4: { left: '50%', top: '15%' }, // ecpv: center top
}

export function OnboardingFlow() {
  const { onboardingStep, setOnboardingStep, finishOnboarding } = useUiStore()
  const hasStartedRef = useRef(false)

  const step =
    onboardingStep !== null && onboardingStep < STEPS.length ? STEPS[onboardingStep] : null

  useEffect(() => {
    if (onboardingStep === 0 && !hasStartedRef.current) {
      hasStartedRef.current = true
      simulationEngine.pause()
    }
  }, [onboardingStep])

  useEffect(() => {
    if (step?.highlightArea) {
      gameBridge.highlightArea(step.highlightArea, 4000)
    }
  }, [onboardingStep])

  function handleNext() {
    if (onboardingStep === null) return
    if (onboardingStep < STEPS.length - 1) {
      setOnboardingStep(onboardingStep + 1)
    } else {
      finishOnboarding()
      simulationEngine.start()
    }
  }

  function handleSkip() {
    finishOnboarding()
    simulationEngine.start()
  }

  if (onboardingStep === null || step === null) return null

  const isLast = onboardingStep === STEPS.length - 1
  const pos = TOOLTIP_POSITIONS[onboardingStep] ?? { left: '50%', top: '50%' }
  const isCenter = pos.left === '50%'

  return (
    <>
      {/* Dark overlay — covers canvas, not the header */}
      <div
        className="fixed inset-0 top-12 z-40 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.62)' }}
      />

      {/* Tooltip card — positioned near the highlighted component */}
      <AnimatePresence mode="wait">
        <motion.div
          key={onboardingStep}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className="fixed z-50 w-[320px] pointer-events-auto"
          style={{
            ...pos,
            transform: isCenter ? 'translateX(-50%)' : undefined,
          }}
        >
          <div className="rounded-lg border-2 border-accent-primary bg-surface-primary shadow-2xl overflow-hidden">
            {/* Progress bar at top */}
            <div className="flex h-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 transition-colors duration-300 ${
                    i <= onboardingStep ? 'bg-accent-primary' : 'bg-surface-elevated'
                  }`}
                />
              ))}
            </div>

            <div className="p-4">
              {/* Step label */}
              <p className="text-[10px] font-mono text-accent-primary uppercase tracking-widest mb-1">
                Paso {onboardingStep + 1} de {STEPS.length}
              </p>

              <h3 className="text-base font-bold text-text-primary font-mono mb-3 leading-tight">
                {step.title}
              </h3>

              {/* Body text — white space preserved for line breaks */}
              <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line mb-4">
                {step.body}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleSkip}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors shrink-0"
                >
                  Saltar tutorial
                </button>
                <button onClick={handleNext} className="btn-primary text-sm px-5 flex-1">
                  {isLast ? '¡A producir! ▶' : 'Siguiente →'}
                </button>
              </div>
            </div>
          </div>

          {/* Arrow pointer toward the highlighted element (simple triangle) */}
          {step.highlightArea && (
            <div
              className={`absolute w-0 h-0 border-l-[10px] border-r-[10px] border-l-transparent border-r-transparent ${
                pos.top
                  ? 'border-b-[12px] border-b-accent-primary -top-3 left-8'
                  : 'border-t-[12px] border-t-accent-primary -bottom-3 left-8'
              }`}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
