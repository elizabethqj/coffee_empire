import type { InventoryItem, Recipe, GameLevel, Achievement, LevelObjective } from '@/types'

// ─── Simulation ───────────────────────────────────────────────────────────────

export const TICK_INTERVAL_MS = 2_000 // 1 tick = 2 seconds at 1× — gives player time to read and decide

// ─── Inventory ───────────────────────────────────────────────────────────────

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'green-beans',
    name: 'Granos de Café Verde',
    category: 'MP',
    quantity: 5, // start small — player buys more as needed
    unitCost: 2_500,
    maxCapacity: 20, // 20 slots visible on canvas
  },
  {
    id: 'packaging-material',
    name: 'Material de Empaque',
    category: 'MP',
    quantity: 8,
    unitCost: 800,
    maxCapacity: 20,
  },
  {
    id: 'roasted-beans',
    name: 'Granos Tostados',
    category: 'WIP',
    quantity: 0,
    unitCost: 0,
    maxCapacity: 15,
  },
  {
    id: 'ground-coffee',
    name: 'Café Molido',
    category: 'WIP',
    quantity: 0,
    unitCost: 0,
    maxCapacity: 15,
  },
  {
    id: 'bag-200g',
    name: 'Café Andino 200g',
    category: 'PT',
    quantity: 0,
    unitCost: 0,
    maxCapacity: 20, // small — player sees exactly how many bolsas tiene
  },
]

// ─── Recipes ─────────────────────────────────────────────────────────────────

export const RECIPES: Recipe[] = [
  {
    id: 'roasting',
    name: 'Tostión',
    mpRequirements: [{ itemId: 'green-beans', quantity: 1 }],
    laborHoursPerUnit: 0.25,
    ticksRequired: 15,
    outputItem: 'roasted-beans',
    outputQuantity: 0.85,
  },
  {
    id: 'grinding',
    name: 'Molido',
    mpRequirements: [{ itemId: 'roasted-beans', quantity: 0.85 }],
    laborHoursPerUnit: 0.1,
    ticksRequired: 10,
    outputItem: 'ground-coffee',
    outputQuantity: 0.8,
  },
  {
    id: 'packaging',
    name: 'Empaque',
    mpRequirements: [
      { itemId: 'ground-coffee', quantity: 0.8 },
      { itemId: 'packaging-material', quantity: 1 },
    ],
    laborHoursPerUnit: 0.15,
    ticksRequired: 8,
    outputItem: 'bag-200g',
    outputQuantity: 4,
  },
]

// ─── Cost Rates (COP per tick) ────────────────────────────────────────────────

export const LABOR_COST_PER_TICK = 2_000
export const ENERGY_CIF_PER_TICK = 800
export const MAINTENANCE_CIF_PER_TICK = 300
export const WASTE_CIF_PER_TICK = 0

// ─── Prices ───────────────────────────────────────────────────────────────────

export const UNIT_SELLING_PRICE = 8_500

// ─── XP ──────────────────────────────────────────────────────────────────────

export const XP_PURCHASE_MP = 10 // Comprar materia prima
export const XP_CREATE_ORDER = 15 // Crear una orden de producción
export const XP_COMPLETE_ORDER = 50 // Orden completada por la simulación
export const XP_PROFITABLE_SALE = 25 // Venta con margen positivo
export const XP_ASSESSMENT_PASS = 200 // Evaluación aprobada (≥ 70%)

// Thresholds calibrated to realistic gameplay tempo:
//   ~3 cycles (buy→produce→sell) per level, assessment gives 200 XP boost.
export const XP_LEVEL_THRESHOLD: Record<GameLevel, number> = {
  1: 0,
  2: 150, // ~3 compras + 1 orden completada
  3: 400, // ~5 ciclos — desbloquea ECPV
  4: 800, // ECPV + evaluación aprobada
  5: 1_400,
  6: 2_200,
  7: 3_200,
  8: 4_500,
}

// ─── Cash / Capital de Trabajo ────────────────────────────────────────────────

export const INITIAL_CASH_BY_LEVEL: Record<GameLevel, number> = {
  1: 800_000,
  2: 600_000,
  3: 450_000,
  4: 350_000,
  5: 280_000,
  6: 280_000,
  7: 280_000,
  8: 280_000,
}

export const CASH_CRITICAL_PCT = 0.2

// ─── Achievements ─────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // Bronce — primeras acciones
  {
    id: 'first-purchase',
    title: 'Primeros Granos',
    description: 'Compra materia prima por primera vez',
    unlockedAtTick: null,
  },
  {
    id: 'first-order',
    title: 'A Producción',
    description: 'Crea tu primera orden de producción',
    unlockedAtTick: null,
  },
  {
    id: 'first-sale',
    title: 'Primera Venta',
    description: 'Completa tu primera venta de producto terminado',
    unlockedAtTick: null,
  },
  {
    id: 'first-market-order',
    title: 'Primer Pedido',
    description: 'Acepta tu primer pedido de mercado',
    unlockedAtTick: null,
  },
  {
    id: 'first-event-decision',
    title: 'Gestor de Crisis',
    description: 'Toma una decisión ante un evento de producción',
    unlockedAtTick: null,
  },
  // Plata — eficiencia
  {
    id: 'profit-margin-20',
    title: 'Rentable',
    description: 'Logra un margen de utilidad superior al 20%',
    unlockedAtTick: null,
  },
  {
    id: 'cost-per-unit-under-6k',
    title: 'Productor Eficiente',
    description: 'Reduce el costo por bolsa por debajo de $6.000',
    unlockedAtTick: null,
  },
  {
    id: 'three-consecutive-orders',
    title: 'Confiable',
    description: 'Cumple 3 pedidos de mercado consecutivos sin fallar',
    unlockedAtTick: null,
  },
  {
    id: 'zero-waste',
    title: 'Cero Desperdicios',
    description: 'Completa un período sin eventos de desperdicio',
    unlockedAtTick: null,
  },
  {
    id: 'no-overstock',
    title: 'Inventario Ágil',
    description: 'Nunca superes el 70% de capacidad de PT en una sesión',
    unlockedAtTick: null,
  },
  // Oro — maestría
  {
    id: 'level-3stars',
    title: 'Perfeccionista',
    description: 'Obtén 3 estrellas en cualquier nivel',
    unlockedAtTick: null,
  },
  {
    id: 'survived-3-events',
    title: 'Crisis Manager',
    description: 'Sobrevive 3 eventos en una sesión con utilidad positiva',
    unlockedAtTick: null,
  },
  {
    id: 'cash-never-critical',
    title: 'Flujo Sano',
    description: 'Completa el nivel 3 sin que la caja llegue a nivel crítico',
    unlockedAtTick: null,
  },
  {
    id: 'market-order-express',
    title: 'Entrega Express',
    description: 'Cumple un pedido de mercado usando solo el 60% del plazo',
    unlockedAtTick: null,
  },
  {
    id: 'ecpv-master',
    title: 'Maestro ECPV',
    description: 'Obtén 100% en una evaluación',
    unlockedAtTick: null,
  },
  // Platino — experto
  {
    id: 'all-levels-complete',
    title: 'Graduado Café Andino',
    description: 'Completa todos los niveles del juego',
    unlockedAtTick: null,
  },
  {
    id: 'leaderboard-top3',
    title: 'Élite',
    description: 'Llega al top 3 del leaderboard en cualquier nivel',
    unlockedAtTick: null,
  },
  {
    id: 'perfect-run',
    title: 'Sesión Perfecta',
    description: '3 estrellas + 0 crisis de caja + evaluación 100%',
    unlockedAtTick: null,
  },
  // Secretos
  {
    id: 'comeback-kid',
    title: '???',
    description: 'Logro secreto',
    secret: true,
    unlockedAtTick: null,
  },
  {
    id: 'speedrun',
    title: '???',
    description: 'Logro secreto',
    secret: true,
    unlockedAtTick: null,
  },
]

// ─── Level Gates ─────────────────────────────────────────────────────────────

export const PANEL_UNLOCK_LEVEL: Record<string, number> = {
  'mp-warehouse': 1,
  'pt-warehouse': 1,
  roasting: 1,
  grinding: 1,
  packaging: 1,
  ecpv: 3,
  finance: 4,
}

export const PANEL_UNLOCK_DESCRIPTION: Record<string, string> = {
  ecpv: 'Estado de Costos de Producción y Ventas — visible cuando ya operas el proceso',
  finance: 'Gestión de eventos dinámicos — análisis avanzado',
}

// ─── Dynamic Events ───────────────────────────────────────────────────────────

// Low probability + min-tick guard = events feel rare and meaningful, not spammy
export const EVENT_PROBABILITY_PER_TICK = 0.008 // ~1 event per 125 ticks on average
export const EVENT_MIN_START_TICK = 120 // no events in the first 2 minutes (1× speed)
export const EVENT_MIN_COOLDOWN_TICKS = 100 // at least 100 ticks between events

export const MP_COST_CRISIS_MULTIPLIER = 1.3
export const DEMAND_SURGE_PRICE_MULTIPLIER = 1.2
export const MACHINE_FAILURE_SPEED_MULTIPLIER = 0.5
export const WASTE_SPIKE_CIF_ADDITION = 500

// ─── Market Orders ────────────────────────────────────────────────────────────

// Market orders appear much less often — one every 3-5 minutes at 1× speed
export const MARKET_ORDER_INTERVAL_BY_LEVEL: Record<GameLevel, number> = {
  1: 250,
  2: 200,
  3: 170,
  4: 140,
  5: 120,
  6: 100,
  7: 85,
  8: 70,
}
// Market orders start only after the player has had time to learn the basics
export const MARKET_ORDER_MIN_START_TICK = 180

export const MARKET_CLIENTS = [
  'Supermercados La 14',
  'Tienda D1',
  'Éxito Café',
  'Restaurante El Patio',
  'Cafetería Universidad',
  'Hotel Dann Carlton',
]

export const MARKET_ORDER_BONUS_MULTIPLIER = 1.1
export const MARKET_ORDER_PENALTY_TICKS = 30
export const MARKET_ORDER_PENALTY_PCT = 0.1

// ─── Level Objectives ────────────────────────────────────────────────────────

export const LEVEL_OBJECTIVES: Record<GameLevel, LevelObjective> = {
  1: {
    level: 1,
    description: 'Vende 5 bolsas con utilidad positiva',
    detail: 'Produce y vende tu primera producción de café',
    maxTicks: 400,
    starThresholds: { two: 280, three: 200 },
  },
  2: {
    level: 2,
    description: 'Vende 10 bolsas, costo/bolsa < $7.500',
    detail: 'Controla el costo unitario de producción',
    maxTicks: 500,
    starThresholds: { two: 350, three: 260 },
  },
  3: {
    level: 3,
    description: 'ECPV completo con todos los campos positivos',
    detail: 'Genera un ciclo completo: MP → WIP → PT → Venta',
    maxTicks: 500,
    starThresholds: { two: 360, three: 280 },
  },
  4: {
    level: 4,
    description: 'Cumple 2 pedidos de mercado sin fallar ninguno',
    detail: 'Planifica la producción contra la demanda del mercado',
    maxTicks: 500,
    starThresholds: { two: 350, three: 280 },
  },
  5: {
    level: 5,
    description: 'Mantén CIF/CP por debajo del 30% durante 50 ticks',
    detail: 'Gestiona la proporción de costos indirectos',
    maxTicks: 500,
    starThresholds: { two: 380, three: 300 },
  },
  6: {
    level: 6,
    description: 'Completa 3 órdenes con WIP activo simultáneo',
    detail: 'Trabaja con múltiples órdenes en producción',
    maxTicks: 500,
    starThresholds: { two: 400, three: 320 },
  },
  7: {
    level: 7,
    description: 'Mantén utilidad positiva 60 ticks consecutivos',
    detail: 'Sostén rentabilidad período a período',
    maxTicks: 600,
    starThresholds: { two: 450, three: 350 },
  },
  8: {
    level: 8,
    description: 'Supera el promedio del leaderboard en utilidad',
    detail: 'Optimización estratégica avanzada',
    maxTicks: 600,
    starThresholds: { two: 500, three: 400 },
  },
}
