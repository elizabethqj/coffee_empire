import type { InventoryItem, Recipe, GameLevel, Achievement } from '@/types'

// ─── Simulation ───────────────────────────────────────────────────────────────

export const TICK_INTERVAL_MS = 1_000

// ─── Inventory ───────────────────────────────────────────────────────────────

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'green-beans',
    name: 'Granos de Café Verde',
    category: 'MP',
    quantity: 50,
    unitCost: 2_500,
    maxCapacity: 200,
  },
  {
    id: 'packaging-material',
    name: 'Material de Empaque',
    category: 'MP',
    quantity: 100,
    unitCost: 800,
    maxCapacity: 500,
  },
  {
    id: 'roasted-beans',
    name: 'Granos Tostados',
    category: 'WIP',
    quantity: 0,
    unitCost: 0,
    maxCapacity: 100,
  },
  {
    id: 'ground-coffee',
    name: 'Café Molido',
    category: 'WIP',
    quantity: 0,
    unitCost: 0,
    maxCapacity: 100,
  },
  {
    id: 'bag-200g',
    name: 'Café Andino 200g',
    category: 'PT',
    quantity: 0,
    unitCost: 0,
    maxCapacity: 300,
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

export const XP_PURCHASE_MP      = 10   // Comprar materia prima
export const XP_CREATE_ORDER     = 15   // Crear una orden de producción
export const XP_COMPLETE_ORDER   = 50   // Orden completada por la simulación
export const XP_PROFITABLE_SALE  = 25   // Venta con margen positivo
export const XP_ASSESSMENT_PASS  = 200  // Evaluación aprobada (≥ 70%)

// Thresholds calibrated to realistic gameplay tempo:
//   ~3 cycles (buy→produce→sell) per level, assessment gives 200 XP boost.
export const XP_LEVEL_THRESHOLD: Record<GameLevel, number> = {
  1: 0,
  2: 150,    // ~3 compras + 1 orden completada
  3: 400,    // ~5 ciclos — desbloquea ECPV
  4: 800,    // ECPV + evaluación aprobada
  5: 1_400,
  6: 2_200,
  7: 3_200,
  8: 4_500,
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
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
    id: 'ecpv-master',
    title: 'Maestro ECPV',
    description: 'Obtén 100% en una evaluación de nivel 7',
    unlockedAtTick: null,
  },
  {
    id: 'zero-waste',
    title: 'Cero Desperdicios',
    description: 'Completa un período sin eventos de desperdicio',
    unlockedAtTick: null,
  },
]

// ─── Level Gates ─────────────────────────────────────────────────────────────
// The gate is on information complexity, not on process access.
// All warehouse/production areas are open from level 1 so the student
// can run the full buy→produce→sell loop immediately.

export const PANEL_UNLOCK_LEVEL: Record<string, number> = {
  'mp-warehouse': 1,   // Nivel 1 — siempre disponible
  'pt-warehouse': 1,   // Nivel 1 — siempre disponible
  'roasting':     1,   // Nivel 1 — proceso completo desde el inicio
  'grinding':     1,   // Nivel 1
  'packaging':    1,   // Nivel 1
  'ecpv':         3,   // Nivel 3 — estado de costos (después de operar el proceso)
  'finance':      4,   // Nivel 4 — respuesta a eventos dinámicos
}

export const PANEL_UNLOCK_DESCRIPTION: Record<string, string> = {
  'ecpv':    'Estado de Costos de Producción y Ventas — visible cuando ya operas el proceso',
  'finance': 'Gestión de eventos dinámicos — análisis avanzado',
}

// ─── Dynamic Events ───────────────────────────────────────────────────────────

export const EVENT_PROBABILITY_PER_TICK = 0.05

export const MP_COST_CRISIS_MULTIPLIER = 1.3
export const DEMAND_SURGE_PRICE_MULTIPLIER = 1.2
export const MACHINE_FAILURE_SPEED_MULTIPLIER = 0.5
export const WASTE_SPIKE_CIF_ADDITION = 500
