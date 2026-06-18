import { useProgressStore } from '@/store/progressStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { LEVEL_OBJECTIVES } from '@/constants/gameBalance'
import { useMarketStore } from '@/store/marketStore'
import { useCostStatementStore } from '@/store/costStatementStore'

export function ObjectiveHUD() {
  const { levelCompleted, objectiveSalesCount } = useProgressStore()
  const { level } = useGamificationStore()
  const { acceptedOrders } = useMarketStore()
  const statement = useCostStatementStore((s) => s.statement)

  const obj = LEVEL_OBJECTIVES[level]
  if (!obj || levelCompleted) return null

  let progressLabel = ''
  let progressPct = 0

  switch (level) {
    case 1:
      progressLabel = `${objectiveSalesCount} / 10 bolsas`
      progressPct = Math.min(100, (objectiveSalesCount / 10) * 100)
      break
    case 2:
      progressLabel = `${objectiveSalesCount} / 20 bolsas`
      progressPct = Math.min(100, (objectiveSalesCount / 20) * 100)
      break
    case 3: {
      const fields = [
        statement.materialUsed > 0,
        statement.productionCost > 0,
        statement.finishedGoodsCost > 0,
        statement.salesCost > 0,
        statement.profit > 0,
      ].filter(Boolean).length
      progressLabel = `${fields} / 5 campos del ECPV`
      progressPct = (fields / 5) * 100
      break
    }
    case 4: {
      const fulfilled = acceptedOrders.filter((o) => o.status === 'fulfilled').length
      progressLabel = `${fulfilled} / 2 pedidos cumplidos`
      progressPct = Math.min(100, (fulfilled / 2) * 100)
      break
    }
    default:
      progressLabel = obj.description
      progressPct = 0
  }

  return (
    <div className="hidden md:flex items-center gap-2 text-xs font-mono max-w-[240px]">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-[10px] text-text-muted uppercase tracking-wide truncate">
          Objetivo Niv.{level}
        </span>
        <span className="text-text-primary truncate text-[11px]">{progressLabel}</span>
        <div className="h-1 w-full rounded-full bg-surface-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-secondary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
