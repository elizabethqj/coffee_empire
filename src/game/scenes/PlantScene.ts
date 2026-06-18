import Phaser from 'phaser'
import { PlantArea, type PlantAreaConfig } from '../objects/PlantArea'
import { playResourceFlow } from '../animations/ResourceFlow'
import { gameBridge } from '../GameBridge'
import { audioManager } from '../audio/AudioManager'
import { useUiStore, type Theme } from '@/store/uiStore'
import { PANEL_UNLOCK_LEVEL } from '@/constants/gameBalance'
import type { InventoryItem, ProductionOrder } from '@/types'

const PHASER_COLORS = {
  dark: {
    background: 0x0f1117,
    grid: 0x1a1d27,
    connections: 0x475569,
  },
  light: {
    background: 0xf1f5f9,
    grid: 0xe2e8f0,
    connections: 0x94a3b8,
  },
}

const AREA_CONFIGS: PlantAreaConfig[] = [
  {
    id: 'mp-warehouse',
    label: 'Almacén MP',
    color: 0x3b82f6,
    itemIds: ['green-beans', 'packaging-material'],
  },
  { id: 'roasting', label: 'Tostión', color: 0xf59e0b, itemIds: ['roasted-beans'] },
  { id: 'grinding', label: 'Molido', color: 0xf59e0b, itemIds: ['ground-coffee'] },
  { id: 'packaging', label: 'Empaque', color: 0x8b5cf6, itemIds: [] },
  { id: 'pt-warehouse', label: 'Almacén PT', color: 0x10b981, itemIds: ['bag-200g'] },
]

// Max capacity values per area for the fill bar
const AREA_MAX_CAP: Record<string, number> = {
  'mp-warehouse': 700,
  roasting: 100,
  grinding: 100,
  packaging: 100,
  'pt-warehouse': 300,
}

// CIF cost per tick per area (approx — for the live cost label)
const AREA_COST_PER_TICK: Record<string, number> = {
  roasting: 350,
  grinding: 280,
  packaging: 180,
}

export class PlantScene extends Phaser.Scene {
  private areas: Map<string, PlantArea> = new Map()
  private connections: Phaser.GameObjects.Graphics | null = null
  private bg: Phaser.GameObjects.Graphics | null = null
  private currentTheme: Theme = 'dark'
  private lastOrders: ProductionOrder[] = []
  private activeAreaIds: Set<string> = new Set()

  constructor() {
    super({ key: 'Plant' })
  }

  preload(): void {
    audioManager.preload(this)
  }

  create(): void {
    this.currentTheme = useUiStore.getState().theme
    this.layoutAreas()
    this.drawConnections()
    gameBridge.setScene(this)
    audioManager.bind(this)
    this.createBackground()
  }

  shutdown(): void {
    audioManager.unbind()
    for (const area of this.areas.values()) {
      area.stopContinuousEffects()
    }
  }

  private layoutAreas(): void {
    const { width, height } = this.scale

    const stepX = width * 0.18
    const originX = width * 0.1
    const baseY = height * 0.42

    const yOffsets = [0, 60, -20, 60, 0]

    AREA_CONFIGS.forEach((config, i) => {
      const x = originX + stepX * i
      const y = baseY + yOffsets[i]
      const area = new PlantArea(this, x, y, config)
      this.areas.set(config.id, area)
    })

    this.scale.on('resize', () => this.repositionAreas())
  }

  private repositionAreas(): void {
    const { width, height } = this.scale
    const stepX = width * 0.18
    const originX = width * 0.1
    const baseY = height * 0.42
    const yOffsets = [0, 60, -20, 60, 0]

    let i = 0
    for (const area of this.areas.values()) {
      const x = originX + stepX * i
      const y = baseY + yOffsets[i]
      area.setPosition(x, y)
      area.anchor.set(x, y)
      i++
    }
    this.drawConnections()
  }

  private drawConnections(): void {
    this.connections?.destroy()
    this.connections = this.add.graphics()
    this.connections.setDepth(-1)

    const col = PHASER_COLORS[this.currentTheme].connections
    const areaList = Array.from(this.areas.values())
    for (let i = 0; i < areaList.length - 1; i++) {
      const a = areaList[i].anchor
      const b = areaList[i + 1].anchor

      this.connections.lineStyle(2, col, 0.6)
      this.connections.beginPath()
      this.connections.moveTo(a.x, a.y)
      this.connections.lineTo(b.x, b.y)
      this.connections.strokePath()

      const angle = Phaser.Math.Angle.Between(a.x, a.y, b.x, b.y)
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      this.connections.fillStyle(col, 0.7)
      this.connections.fillTriangle(
        mx + Math.cos(angle) * 10,
        my + Math.sin(angle) * 10,
        mx + Math.cos(angle - 2.4) * 8,
        my + Math.sin(angle - 2.4) * 8,
        mx + Math.cos(angle + 2.4) * 8,
        my + Math.sin(angle + 2.4) * 8
      )
    }
  }

  private createBackground(): void {
    this.bg?.destroy()
    const { width, height } = this.scale
    const colors = PHASER_COLORS[this.currentTheme]
    this.bg = this.add.graphics().setDepth(-2)
    this.bg.fillStyle(colors.background, 1)
    this.bg.fillRect(0, 0, width, height)

    this.bg.lineStyle(1, colors.grid, 0.8)
    const spacing = 40
    for (let x = 0; x < width; x += spacing) {
      this.bg.beginPath()
      this.bg.moveTo(x, 0)
      this.bg.lineTo(x, height)
      this.bg.strokePath()
    }
    for (let y = 0; y < height; y += spacing) {
      this.bg.beginPath()
      this.bg.moveTo(0, y)
      this.bg.lineTo(width, y)
      this.bg.strokePath()
    }
  }

  // ── Public API called by GameBridge ──────────────────────────────────────────

  applyTheme(theme: Theme): void {
    this.currentTheme = theme
    this.createBackground()
    this.drawConnections()
    for (const area of this.areas.values()) {
      area.applyTheme(theme)
    }
  }

  syncLevel(level: number): void {
    for (const [areaId, area] of this.areas) {
      const required = PANEL_UNLOCK_LEVEL[areaId] ?? 1
      area.setLocked(level < required)
    }
  }

  syncInventory(items: Record<string, InventoryItem>): void {
    for (const [areaId, area] of this.areas) {
      const config = AREA_CONFIGS.find((c) => c.id === areaId)!
      const totalQty = config.itemIds.reduce((sum, id) => sum + (items[id]?.quantity ?? 0), 0)
      const maxCap = AREA_MAX_CAP[areaId] ?? 1
      const fillPct = Math.min(1, totalQty / maxCap)

      const hasActiveOrders = this.lastOrders.some(
        (o) => o.status === 'active' && this.recipeMatchesArea(o.recipeId, areaId)
      )
      area.sync(fillPct, hasActiveOrders)
    }
  }

  syncOrders(orders: ProductionOrder[]): void {
    const prevCompleted = this.lastOrders.filter((o) => o.status === 'completed').map((o) => o.id)
    this.lastOrders = orders

    // Determine which areas have active orders
    const nowActive = new Set<string>()
    for (const order of orders) {
      if (order.status !== 'active') continue
      const areaId = this.recipeToAreaId(order.recipeId)
      if (areaId) nowActive.add(areaId)

      // Update live progress + cost label
      const area = this.areas.get(areaId ?? '')
      if (area) {
        area.updateLiveLabel(order.progress, AREA_COST_PER_TICK[areaId ?? ''] ?? 0)
      }
    }

    // Start/stop continuous effects per area
    for (const [areaId, area] of this.areas) {
      if (nowActive.has(areaId) && !this.activeAreaIds.has(areaId)) {
        area.startContinuousEffects()
        audioManager.startAmbient()
      } else if (!nowActive.has(areaId) && this.activeAreaIds.has(areaId)) {
        area.stopContinuousEffects()
        area.updateLiveLabel(0, 0)
      }
    }

    if (nowActive.size === 0 && this.activeAreaIds.size > 0) {
      audioManager.stopAmbient()
    }

    this.activeAreaIds = nowActive

    // Trigger resource flow animation for newly completed orders
    for (const order of orders) {
      if (order.status === 'completed' && !prevCompleted.includes(order.id)) {
        this.animateOrderComplete(order.recipeId)
      }
    }
  }

  showEventAlert(title: string, description: string): void {
    audioManager.play('event_trigger')
    this.scene.get('UI')?.events?.emit('show-alert', title, description)
  }

  /**
   * Animate a cash flow particle (money entering/leaving) from/to an area.
   * type 'debit' → red $ flies out toward top; 'credit' → green $ flies in from top.
   */
  flashCashFlow(type: 'debit' | 'credit', amount: number, areaId: string): void {
    const area = this.areas.get(areaId)
    if (!area) return

    const color = type === 'debit' ? 0xef4444 : 0x10b981
    const label =
      type === 'debit' ? `-$${Math.round(amount / 1000)}k` : `+$${Math.round(amount / 1000)}k`

    const tx = this.add
      .text(area.anchor.x, area.anchor.y - 20, label, {
        fontSize: '11px',
        color: type === 'debit' ? '#ef4444' : '#10b981',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(10)

    const g = this.add.graphics().setDepth(10)
    g.fillStyle(color, 0.9)
    g.fillCircle(area.anchor.x + Phaser.Math.Between(-10, 10), area.anchor.y, 4)

    const dy = type === 'debit' ? -50 : -40

    this.tweens.add({
      targets: [tx, g],
      y: `${dy}`,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => {
        tx.destroy()
        g.destroy()
      },
    })

    if (type === 'debit') {
      audioManager.play('purchase')
    } else {
      audioManager.play('sale')
    }
  }

  /**
   * Pulse-highlight an area (used by onboarding).
   */
  highlightArea(areaId: string, durationMs = 2000): void {
    this.areas.get(areaId)?.flashHighlight(durationMs)
  }

  clearHighlight(): void {
    // flashHighlight is self-expiring — no explicit clear needed
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private recipeMatchesArea(recipeId: string, areaId: string): boolean {
    return this.recipeToAreaId(recipeId) === areaId
  }

  private recipeToAreaId(recipeId: string): string | null {
    const map: Record<string, string> = {
      roasting: 'roasting',
      grinding: 'grinding',
      packaging: 'packaging',
    }
    return map[recipeId] ?? null
  }

  private animateOrderComplete(recipeId: string): void {
    const flowMap: Record<string, [string, string]> = {
      roasting: ['mp-warehouse', 'roasting'],
      grinding: ['roasting', 'grinding'],
      packaging: ['grinding', 'pt-warehouse'],
    }
    const flow = flowMap[recipeId]
    if (!flow) return

    const from = this.areas.get(flow[0])?.anchor
    const to = this.areas.get(flow[1])?.anchor
    if (!from || !to) return

    audioManager.play('order_complete')
    playResourceFlow(this, {
      from: from.clone(),
      to: to.clone(),
      type: recipeId === 'packaging' ? 'pt' : 'wip',
    })
  }
}
