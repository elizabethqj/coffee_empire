// ─── Inventory ───────────────────────────────────────────────────────────────

export type InventoryCategory = 'MP' | 'WIP' | 'PT'

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  quantity: number
  unitCost: number
  maxCapacity: number
}

export interface InventorySnapshot {
  items: Record<string, Pick<InventoryItem, 'quantity' | 'unitCost'>>
  capturedAtTick: number
}

// ─── Production ──────────────────────────────────────────────────────────────

export type ProductionStatus = 'pending' | 'active' | 'completed' | 'paused'

export interface Recipe {
  id: string
  name: string
  mpRequirements: { itemId: string; quantity: number }[]
  laborHoursPerUnit: number
  ticksRequired: number
  outputItem: string
  outputQuantity: number
}

export interface ProductionOrder {
  id: string
  recipeId: string
  quantity: number
  progress: number
  status: ProductionStatus
  accumulatedMPD: number
  accumulatedMOD: number
  accumulatedCIF: number
  startedAtTick: number | null
  completedAtTick: number | null
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export interface CIFBreakdown {
  energy: number
  maintenance: number
  waste: number
}

export interface FinancialState {
  rawMaterialCost: number
  laborCost: number
  cifCost: number
  cifBreakdown: CIFBreakdown
  productionCost: number
  revenue: number
  salesCost: number
  profit: number
}

// ─── ECPV ────────────────────────────────────────────────────────────────────

export interface CostStatement {
  initialMP: number
  purchases: number
  finalMP: number
  materialUsed: number

  mod: number
  cif: number

  productionCost: number

  initialWIP: number
  finalWIP: number

  finishedGoodsCost: number

  initialPT: number
  finalPT: number

  salesCost: number

  revenue: number
  profit: number
}

// ─── Gamification ────────────────────────────────────────────────────────────

export type GameLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type DynamicEventType =
  | 'supplier_crisis'
  | 'demand_surge'
  | 'machine_failure'
  | 'waste_spike'

export interface DynamicEvent {
  id: string
  type: DynamicEventType
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  effectDurationTicks: number
  appliedAtTick: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  unlockedAtTick: number | null
}

export interface PlayerState {
  xp: number
  level: GameLevel
  achievements: Achievement[]
  activeEvents: DynamicEvent[]
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'purchase_mp'
  | 'create_order'
  | 'complete_order'
  | 'sell_pt'
  | 'event_triggered'
  | 'panel_opened'
  | 'ecpv_viewed'
  | 'level_completed'

export interface AnalyticsEvent {
  sessionId: string
  userId: string
  tick: number
  eventType: AnalyticsEventType
  decisionTimeMs: number
  payload: Record<string, unknown>
}

// ─── Session ─────────────────────────────────────────────────────────────────

export type SessionStatus = 'active' | 'completed' | 'abandoned'

export interface GameSession {
  id: string
  userId: string
  level: GameLevel
  status: SessionStatus
  startedAt: number
  completedAt: number | null
  finalScore: number | null
  finalProfit: number | null
  decisionCount: number
}
