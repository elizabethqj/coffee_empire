import { lazy, Suspense, useEffect, useState } from 'react'
import { GameLayout } from '@/layouts/GameLayout'
import { GameCanvas } from '@/game/GameCanvas'
import { useAuthStore, useGamificationStore, useUiStore } from '@/store'
import { useFinanceStore } from '@/store/financeStore'
import { useProgressStore } from '@/store/progressStore'
import { sessionService } from '@/services/sessionService'
import { useAnalyticsWatcher } from '@/services/useAnalyticsWatcher'
import { PANEL_UNLOCK_LEVEL, PANEL_UNLOCK_DESCRIPTION } from '@/constants/gameBalance'

const ECPVFlow = lazy(() =>
  import('@/features/cost-statement/components/ECPVFlow').then((m) => ({ default: m.ECPVFlow }))
)
const Assessment = lazy(() =>
  import('@/features/education/components/Assessment').then((m) => ({ default: m.Assessment }))
)
const FeedbackOverlay = lazy(() =>
  import('@/features/education/components/FeedbackOverlay').then((m) => ({
    default: m.FeedbackOverlay,
  }))
)
const LevelUpModal = lazy(() =>
  import('@/features/gamification/components/LevelUpModal').then((m) => ({
    default: m.LevelUpModal,
  }))
)
const AchievementToast = lazy(() =>
  import('@/features/gamification/components/AchievementToast').then((m) => ({
    default: m.AchievementToast,
  }))
)
const AchievementsPanel = lazy(() =>
  import('@/features/gamification/components/AchievementsPanel').then((m) => ({
    default: m.AchievementsPanel,
  }))
)
const EventResponseCard = lazy(() =>
  import('@/features/gamification/components/EventResponseCard').then((m) => ({
    default: m.EventResponseCard,
  }))
)
const PurchaseMPPanel = lazy(() =>
  import('@/features/inventory/components/PurchaseMPPanel').then((m) => ({
    default: m.PurchaseMPPanel,
  }))
)
const ProductionOrderPanel = lazy(() =>
  import('@/features/production/components/ProductionOrderPanel').then((m) => ({
    default: m.ProductionOrderPanel,
  }))
)
const SellPTPanel = lazy(() =>
  import('@/features/finance/components/SellPTPanel').then((m) => ({ default: m.SellPTPanel }))
)
const LiveKPIPanel = lazy(() =>
  import('@/features/finance/components/LiveKPIPanel').then((m) => ({ default: m.LiveKPIPanel }))
)
const LiquidityModal = lazy(() =>
  import('@/features/gamification/components/LiquidityModal').then((m) => ({
    default: m.LiquidityModal,
  }))
)
const MarketOrderModal = lazy(() =>
  import('@/features/gamification/components/MarketOrderModal').then((m) => ({
    default: m.MarketOrderModal,
  }))
)
const EventDecisionModal = lazy(() =>
  import('@/features/gamification/components/EventDecisionModal').then((m) => ({
    default: m.EventDecisionModal,
  }))
)
const LevelCompleteModal = lazy(() =>
  import('@/features/gamification/components/LevelCompleteModal').then((m) => ({
    default: m.LevelCompleteModal,
  }))
)
const GuidedTutorial = lazy(() =>
  import('@/features/education/components/GuidedTutorial').then((m) => ({
    default: m.GuidedTutorial,
  }))
)

function PanelSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <span className="font-mono text-xs text-text-muted animate-pulse">Cargando…</span>
    </div>
  )
}

const PANEL_TITLES: Record<string, string> = {
  'mp-warehouse': 'Almacén de MP',
  roasting: 'Tostión',
  grinding: 'Molido',
  packaging: 'Empaque',
  'pt-warehouse': 'Almacén de PT',
  ecpv: 'Estado de Costos',
  finance: 'Finanzas',
}

function LockedPanel({ panelId }: { panelId: string }) {
  const requiredLevel = PANEL_UNLOCK_LEVEL[panelId] ?? 1
  const description = PANEL_UNLOCK_DESCRIPTION[panelId]
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="text-4xl select-none">⚿</span>
      <p className="text-sm font-bold text-text-primary font-mono">Área bloqueada</p>
      {description && (
        <p className="text-xs text-text-secondary leading-relaxed max-w-[200px]">{description}</p>
      )}
      <div className="rounded-md border border-accent-primary/40 bg-accent-primary/5 px-4 py-2 mt-1">
        <p className="text-xs text-text-muted">Requiere</p>
        <p className="text-lg font-bold font-mono text-accent-primary">Nivel {requiredLevel}</p>
      </div>
      <p className="text-xs text-text-muted">
        Supera la evaluación del nivel anterior para desbloquear.
      </p>
    </div>
  )
}

function PanelContent({ panelId }: { panelId: string }) {
  const { level } = useGamificationStore()
  const [showAssessment, setShowAssessment] = useState(false)

  if (level < (PANEL_UNLOCK_LEVEL[panelId] ?? 1)) {
    return <LockedPanel panelId={panelId} />
  }

  if (panelId === 'ecpv') {
    return (
      <div className="flex flex-col gap-4">
        <Suspense fallback={<PanelSpinner />}>
          <ECPVFlow />
          {!showAssessment ? (
            <button
              onClick={() => setShowAssessment(true)}
              className="btn-secondary text-xs w-full"
            >
              Realizar evaluación del nivel
            </button>
          ) : (
            <Assessment level={level} onClose={() => setShowAssessment(false)} />
          )}
        </Suspense>
      </div>
    )
  }

  if (panelId === 'mp-warehouse') {
    return (
      <Suspense fallback={<PanelSpinner />}>
        <PurchaseMPPanel />
      </Suspense>
    )
  }

  if (panelId === 'roasting' || panelId === 'grinding' || panelId === 'packaging') {
    return (
      <Suspense fallback={<PanelSpinner />}>
        <ProductionOrderPanel areaId={panelId} />
      </Suspense>
    )
  }

  if (panelId === 'pt-warehouse') {
    return (
      <Suspense fallback={<PanelSpinner />}>
        <SellPTPanel />
        <div className="mt-4">
          <LiveKPIPanel />
        </div>
      </Suspense>
    )
  }

  if (panelId === 'finance') {
    return (
      <Suspense fallback={<PanelSpinner />}>
        <EventResponseCard />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<PanelSpinner />}>
      <AchievementsPanel />
    </Suspense>
  )
}

// ── Panel sidebar — sibling of the canvas, not an overlay ───────────────────
function PanelSidebar() {
  const { activePanel, closePanel } = useUiStore()
  if (!activePanel) return null

  return (
    <aside
      data-tutorial-panel="sidebar"
      className="w-72 xl:w-80 shrink-0 flex flex-col border-l border-border-default bg-surface-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default shrink-0">
        <h2 className="text-sm font-bold text-text-primary font-mono truncate">
          {PANEL_TITLES[activePanel] ?? activePanel}
        </h2>
        <button
          onClick={closePanel}
          className="ml-2 shrink-0 text-text-muted hover:text-text-primary transition-colors text-xl leading-none"
          aria-label="Cerrar panel"
        >
          ×
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <PanelContent panelId={activePanel} />
      </div>
    </aside>
  )
}

export function GamePage() {
  const { user, setSessionId } = useAuthStore()
  const { level } = useGamificationStore()
  const { initCash } = useFinanceStore()
  const { resetLevel } = useProgressStore()
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)

  useAnalyticsWatcher()

  useEffect(() => {
    if (!user) return
    sessionService.createSession(user.uid, 1).then(setSessionId).catch(console.error)
    initCash(1)
    resetLevel()
  }, [user, setSessionId])

  return (
    <GameLayout>
      {/* ── Main row: canvas + optional side panel ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area — fills remaining space, Phaser RESIZE adapts automatically */}
        <div className="relative flex-1 min-w-0 overflow-hidden">
          <GameCanvas />
          {/* FeedbackOverlay is positioned inside the canvas area, never behind the panel */}
          <Suspense fallback={null}>
            <FeedbackOverlay />
          </Suspense>
        </div>

        {/* Side panel — opens as a column, canvas shrinks to make room */}
        <PanelSidebar />
      </div>

      {/* ── Floating notifications — fixed/viewport, always above everything ── */}
      <Suspense fallback={null}>
        <LevelUpModal />
      </Suspense>
      <Suspense fallback={null}>
        <AchievementToast />
      </Suspense>
      <Suspense fallback={null}>
        <GuidedTutorial />
      </Suspense>
      <Suspense fallback={null}>
        <LiquidityModal />
      </Suspense>
      <Suspense fallback={null}>
        <MarketOrderModal />
      </Suspense>
      <Suspense fallback={null}>
        <EventDecisionModal />
      </Suspense>
      <Suspense fallback={null}>
        <LevelCompleteModal
          onAssessment={() => setShowAssessmentModal(true)}
          onNextLevel={() => {
            initCash(Math.min(8, level + 1) as typeof level)
            resetLevel()
          }}
        />
      </Suspense>
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-surface-primary rounded-lg border border-border-default p-5 overflow-y-auto max-h-[90vh]">
            <Suspense fallback={<PanelSpinner />}>
              <Assessment level={level} onClose={() => setShowAssessmentModal(false)} />
            </Suspense>
          </div>
        </div>
      )}
    </GameLayout>
  )
}
