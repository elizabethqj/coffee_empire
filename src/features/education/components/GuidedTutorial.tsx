import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTutorialStore } from '@/store/tutorialStore'
import { useUiStore } from '@/store/uiStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { useProductionStore } from '@/store/productionStore'
import { useFinanceStore } from '@/store/financeStore'
import { useSimulationStore } from '@/store/simulationStore'
import { simulationEngine } from '@/simulation/engine'
import { gameBridge } from '@/game/GameBridge'
import type { PanelId } from '@/store/uiStore'

// ─── Step definitions ─────────────────────────────────────────────────────────

interface TutorialStep {
  title: string
  body: string
  hint?: string // small italic note below the body
  phaserArea?: string // pulse-highlight this Phaser area
  dataTarget?: string // data-tutorial-target value → pointer
  autoOpenPanel?: PanelId // open this panel when entering step
  manualAdvance?: boolean // user must click the button to advance
  sideEffect?: 'pause' | 'speed-4x' | 'speed-1x' | 'start'
}

const STEPS: TutorialStep[] = [
  // 0 — welcome
  {
    title: '☕ Bienvenido a Café Andino S.A.S.',
    body: 'Eres el gerente de una empresa colombiana de café. Tu misión: comprar materias primas, producirlas y venderlas con utilidad.\n\nEste tutorial te guía por tu primer ciclo completo — exactamente lo que el profesor llama el "Estado de Costos de Producción y Ventas" (ECPV).',
    hint: 'La simulación está pausada. Avanza a tu ritmo.',
    manualAdvance: true,
    sideEffect: 'pause',
  },
  // 1 — buy green beans
  {
    title: '1 — Compra Materias Primas',
    body: 'El panel de compras está abierto a la derecha.\n\nSelecciona "Granos de Café Verde", ingresa una cantidad (ej: 3) y presiona Comprar.\n\nEsta transacción debita tu caja y aparece en la línea "Compras de MP" del ECPV.',
    hint: 'Pista: empieza con 3 unidades — suficiente para completar un ciclo.',
    autoOpenPanel: 'mp-warehouse',
    dataTarget: 'buy-btn',
    phaserArea: 'mp-warehouse',
    sideEffect: 'pause',
  },
  // 2 — click roasting area
  {
    title: '2 — Abre el Área de Tostión',
    body: 'Las materias primas están en inventario. Ahora debes transformarlas.\n\nHaz clic en el bloque de "Tostión" que ves brillando en el mapa — es el primer paso de la cadena productiva.',
    phaserArea: 'roasting',
    sideEffect: 'pause',
  },
  // 3 — place roasting order
  {
    title: '3 — Inicia la Orden de Tostión',
    body: 'El panel de Tostión está abierto.\n\nIngresa 3 lotes (o la cantidad de granos que compraste) en el campo resaltado y presiona "Iniciar".\n\nDesde ese momento los granos acumulan MPD (100%), MOD y CIF proporcionalmente al avance.',
    hint: 'MPD = Materia Prima Directa · MOD = Mano de Obra Directa · CIF = Costos Indirectos',
    dataTarget: 'confirm-order-btn',
    sideEffect: 'pause',
  },
  // 4 — wait for production chain
  {
    title: '4 — Observa el Ciclo Completo',
    body: 'La producción está en marcha al 4× de velocidad.\n\nEl sistema encadenó automáticamente Molido → Empaque para que veas el flujo completo. En el juego real, tú decides cuándo y cuánto producir en cada etapa.\n\nObserva los slots del almacén llenarse gradualmente.',
    hint: 'Avanza automáticamente cuando las bolsas de café aparezcan en el almacén de PT.',
    sideEffect: 'speed-4x',
  },
  // 5 — open ECPV
  {
    title: '5 — Lee el ECPV',
    body: 'Ya tienes Producto Terminado. Antes de vender, abre el Estado de Costos.\n\nHaz clic en el botón "ECPV" en la barra superior — verás 13 líneas con todos los costos acumulados: MPD, MOD, CIF, WIP, PT.',
    hint: 'Es el mismo formato del profesor, pero llenado en tiempo real con tus decisiones.',
    dataTarget: 'ecpv-btn',
    sideEffect: 'speed-1x',
  },
  // 6 — sell bags
  {
    title: '6 — Vende tu Café',
    body: 'Ahora cierra el ciclo: vende las bolsas al almacén de Producto Terminado.\n\nIngresa la cantidad y presiona Vender. Esta transacción acredita tu caja y aparece en la línea "Ingresos por Ventas" del ECPV.',
    autoOpenPanel: 'pt-warehouse',
    dataTarget: 'sell-btn',
    phaserArea: 'pt-warehouse',
    sideEffect: 'speed-1x',
  },
  // 7 — complete
  {
    title: '¡Ciclo Completado! 🎉',
    body: 'Acabas de completar tu primer ciclo de producción.\n\nCompra de MP → Producción (WIP) → Venta de PT — eso es exactamente el ECPV. El margen que obtuviste es la Utilidad del período.\n\nDesde aquí puedes repetir el ciclo, aceptar pedidos del mercado y enfrentar eventos de crisis. ¡Suerte!',
    manualAdvance: true,
    sideEffect: 'start',
  },
]

// ─── Phaser area screen-position estimates ────────────────────────────────────
// Based on PlantScene layout: originX=10%, stepX=18%, baseY≈42% of canvas height
// Canvas sits below the 48px header; sidebar ≈ 320px
function getPhaserAreaPos(areaId: string): { x: number; y: number } {
  const headerH = 48
  const sidebarW = 320
  const canvasW = window.innerWidth - sidebarW
  const canvasH = window.innerHeight - headerH

  const map: Record<string, { rx: number; ry: number }> = {
    'mp-warehouse': { rx: 0.1, ry: 0.44 },
    roasting: { rx: 0.28, ry: 0.56 },
    grinding: { rx: 0.46, ry: 0.44 },
    packaging: { rx: 0.64, ry: 0.56 },
    'pt-warehouse': { rx: 0.82, ry: 0.44 },
  }
  const { rx, ry } = map[areaId] ?? { rx: 0.5, ry: 0.5 }
  return { x: canvasW * rx, y: headerH + canvasH * ry }
}

// ─── Tooltip card position ────────────────────────────────────────────────────
// RULE: when a sidebar panel is open (steps 1, 3, 6), the card MUST live in the
// canvas area (left side of screen) so it never overlaps the 320px sidebar.
const CARD_POSITIONS: Record<
  number,
  { left?: string; right?: string; top?: string; bottom?: string; transform?: string }
> = {
  0: { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }, // center — welcome
  1: { left: '3%', top: '20%' }, // canvas top-left — panel open on right
  2: { left: '50%', top: '16%', transform: 'translateX(-50%)' }, // canvas center-top — click roasting area
  3: { left: '3%', top: '20%' }, // canvas top-left — panel open on right
  4: { left: '50%', top: '16%', transform: 'translateX(-50%)' }, // canvas center-top — watch production
  5: { left: '50%', top: '16%', transform: 'translateX(-50%)' }, // canvas center-top — open ECPV
  6: { left: '3%', top: '45%' }, // canvas mid-left — panel open on right
  7: { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }, // center — complete
}

// ─── Animated pointer arrow ───────────────────────────────────────────────────
function PointerArrow({ targetAttr, phaserArea }: { targetAttr?: string; phaserArea?: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    function calculate() {
      if (targetAttr) {
        const el = document.querySelector(`[data-tutorial-target="${targetAttr}"]`)
        if (el) {
          const rect = el.getBoundingClientRect()
          setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 })
          return
        }
      }
      if (phaserArea) {
        const p = getPhaserAreaPos(phaserArea)
        setPos({ x: p.x, y: p.y - 30 })
      }
    }
    calculate()
    const id = setTimeout(calculate, 300) // retry after lazy panels load
    return () => clearTimeout(id)
  }, [targetAttr, phaserArea])

  if (!pos) return null

  return (
    <motion.div
      className="fixed z-[70] pointer-events-none select-none text-2xl"
      style={{ left: pos.x - 12, top: pos.y - 28 }}
      animate={{ y: [-6, 4, -6] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
    >
      👆
    </motion.div>
  )
}

// ─── Completion detection ─────────────────────────────────────────────────────
function useStepCompletion(step: number, cashBaseline: number) {
  const activePanel = useUiStore((s) => s.activePanel)
  const items = useInventoryStore((s) => s.items)
  const orders = useProductionStore((s) => s.orders)
  const cashBalance = useFinanceStore((s) => s.cashBalance)

  const greenBeans = items['green-beans']?.quantity ?? 0
  const bags = items['bag-200g']?.quantity ?? 0
  const hasRoasting = orders.some((o) => o.recipeId === 'roasting' && o.status === 'active')

  switch (step) {
    case 1:
      return greenBeans > 5 // bought at least 1 green bean (initial=5)
    case 2:
      return activePanel === 'roasting' // clicked roasting area
    case 3:
      return hasRoasting // placed roasting order
    case 4:
      return bags > 0 // packaging completed
    case 5:
      return activePanel === 'ecpv' // opened ECPV panel
    case 6:
      return cashBalance > cashBaseline // sold something
    default:
      return false
  }
}

// ─── Auto-chain production (step 4) ──────────────────────────────────────────
function useAutoChain(active: boolean, step: number) {
  const items = useInventoryStore((s) => s.items)
  const orders = useProductionStore((s) => s.orders)
  const createOrder = useProductionStore((s) => s.createOrder)
  const tick = useSimulationStore((s) => s.tick)
  const doneRef = useRef({ grinding: false, packaging: false })

  useEffect(() => {
    if (!active || step !== 4) return

    const roasted = items['roasted-beans']?.quantity ?? 0
    const ground = items['ground-coffee']?.quantity ?? 0
    const bags = items['bag-200g']?.quantity ?? 0

    const hasGrinding = orders.some((o) => o.recipeId === 'grinding')
    const hasPackaging = orders.some((o) => o.recipeId === 'packaging')

    // Auto-place grinding once we have roasted beans
    if (roasted >= 0.85 && !hasGrinding && !doneRef.current.grinding) {
      doneRef.current.grinding = true
      const qty = Math.max(1, Math.floor(roasted / 0.85))
      createOrder('grinding', qty, tick)
    }

    // Auto-place packaging once we have ground coffee
    const packMat = items['packaging-material']?.quantity ?? 0
    if (ground >= 0.8 && !hasPackaging && !doneRef.current.packaging && packMat >= 1) {
      doneRef.current.packaging = true
      const qty = Math.max(1, Math.min(Math.floor(ground / 0.8), Math.floor(packMat)))
      createOrder('packaging', qty, tick)
    }

    // Reset flags when bags appear (cycle done, ready for next)
    if (bags > 0) {
      doneRef.current = { grinding: false, packaging: false }
    }
  }, [items, orders, step, active])
}

// Steps that have the right sidebar panel open — the sidebar must be elevated
// above the dark overlay so inputs are visible and interactive, not darkened.
const PANEL_STEPS = [1, 3, 6]

// Which qty input to auto-focus on each panel step
const QTY_INPUT_BY_STEP: Record<number, string> = {
  1: 'mp-qty-input',
  3: 'order-qty-input',
  6: 'sell-qty-input',
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GuidedTutorial() {
  const { active, step, cashBaseline, nextStep, skipTutorial, setCashBaseline } = useTutorialStore()
  const { setActivePanel } = useUiStore()
  const cashBalance = useFinanceStore((s) => s.cashBalance)
  const prevStepRef = useRef(-1)

  const completed = useStepCompletion(step, cashBaseline)
  useAutoChain(active, step)

  // ── Elevate sidebar above overlay when panel steps require user input ─────
  useEffect(() => {
    const sidebar = document.querySelector('[data-tutorial-panel="sidebar"]') as HTMLElement | null
    if (!sidebar) return

    if (active && PANEL_STEPS.includes(step)) {
      // Raise the sidebar above the z-[45] overlay so it's fully visible and interactive
      sidebar.style.position = 'relative'
      sidebar.style.zIndex = '50'
    } else {
      sidebar.style.position = ''
      sidebar.style.zIndex = ''
    }

    return () => {
      sidebar.style.position = ''
      sidebar.style.zIndex = ''
    }
  }, [step, active])

  // ── Step entry effects ────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || step === prevStepRef.current) return
    prevStepRef.current = step

    const def = STEPS[step]
    if (!def) return

    // Engine control
    if (def.sideEffect === 'pause') simulationEngine.pause()
    if (def.sideEffect === 'speed-4x') {
      simulationEngine.start()
      simulationEngine.setSpeed(4)
    }
    if (def.sideEffect === 'speed-1x') {
      simulationEngine.setSpeed(1)
    }
    if (def.sideEffect === 'start') simulationEngine.start()

    // Auto-open panel
    if (def.autoOpenPanel) setActivePanel(def.autoOpenPanel)

    // Phaser highlight (infinite pulse = -1)
    gameBridge.clearHighlight()
    if (def.phaserArea) gameBridge.highlightArea(def.phaserArea, -1)

    // Cash snapshot when entering sell step
    if (step === 6) setCashBaseline(cashBalance)

    // Auto-focus the qty input so the user can type immediately (no clicking required)
    const qtyTarget = QTY_INPUT_BY_STEP[step]
    if (qtyTarget) {
      // Delay to allow lazy panel to finish rendering
      const tid = setTimeout(() => {
        const el = document.querySelector(
          `[data-tutorial-target="${qtyTarget}"]`
        ) as HTMLInputElement | null
        if (el) {
          el.focus()
          el.select()
        }
      }, 350)
      return () => clearTimeout(tid)
    }
  }, [step, active])

  // ── Auto-advance when step condition is met ───────────────────────────────
  useEffect(() => {
    if (!active || !completed) return
    const def = STEPS[step]
    if (!def || def.manualAdvance) return
    const id = setTimeout(() => nextStep(), 600)
    return () => clearTimeout(id)
  }, [completed, step, active])

  // ── Cleanup on tutorial end ───────────────────────────────────────────────
  useEffect(() => {
    if (!active) gameBridge.clearHighlight()
  }, [active])

  if (!active) return null

  const def = STEPS[step]
  if (!def) return null

  const isLast = step === STEPS.length - 1
  const cardPos = CARD_POSITIONS[step] ?? {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%,-50%)',
  }

  return (
    <>
      {/* ── Dark overlay ── */}
      <div
        className="fixed inset-0 top-12 z-[45] pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.68)' }}
      />

      {/* ── Animated pointer ── */}
      <PointerArrow
        targetAttr={def.dataTarget}
        phaserArea={!def.dataTarget ? def.phaserArea : undefined}
      />

      {/* ── Tooltip card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[65] w-[340px] pointer-events-auto"
          style={cardPos}
        >
          {/* Progress rail */}
          <div className="flex gap-0.5 mb-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                  i < step
                    ? 'bg-accent-primary'
                    : i === step
                      ? 'bg-accent-primary/70'
                      : 'bg-surface-elevated'
                }`}
              />
            ))}
          </div>

          <div className="rounded-xl border-2 border-accent-primary bg-surface-primary shadow-2xl overflow-hidden">
            {/* Completion flash when step done */}
            {completed && !def.manualAdvance && <div className="h-1 bg-status-ok animate-pulse" />}

            <div className="p-5">
              <p className="text-[10px] font-mono text-accent-primary uppercase tracking-widest mb-1.5">
                Paso {step + 1} de {STEPS.length}
              </p>
              <h3 className="text-base font-bold text-text-primary font-mono mb-3 leading-snug">
                {def.title}
              </h3>
              <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line mb-3">
                {def.body}
              </div>
              {def.hint && (
                <p className="text-xs italic text-text-muted border-l-2 border-accent-primary/30 pl-2 mb-4">
                  {def.hint}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={skipTutorial}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors shrink-0"
                >
                  Saltar tutorial
                </button>
                {(def.manualAdvance || isLast) && (
                  <button
                    onClick={isLast ? skipTutorial : nextStep}
                    className="btn-primary text-sm px-5 flex-1"
                  >
                    {isLast ? '¡A jugar! ▶' : 'Siguiente →'}
                  </button>
                )}
                {!def.manualAdvance && !isLast && (
                  <p
                    className={`text-xs font-mono ${completed ? 'text-status-ok' : 'text-text-muted'}`}
                  >
                    {completed ? '✓ Completado — avanzando…' : 'Realiza la acción indicada ↑'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
