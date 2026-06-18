import Phaser from 'phaser'
import { useUiStore, type PanelId, type Theme } from '@/store/uiStore'

export interface PlantAreaConfig {
  id: string
  label: string
  color: number
  itemIds: string[]
}

// Isometric diamond dimensions
const W = 140
const H = 58

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) - amount)
  const g = Math.max(0, ((color >> 8) & 0xff) - amount)
  const b = Math.max(0, (color & 0xff) - amount)
  return (r << 16) | (g << 8) | b
}

export class PlantArea extends Phaser.GameObjects.Container {
  readonly areaId: string
  private readonly areaColor: number
  private theme: Theme = 'dark'
  private lastFillPct = 0
  private locked = false

  private diamond: Phaser.GameObjects.Graphics
  private statusDot: Phaser.GameObjects.Arc
  private nameLabel: Phaser.GameObjects.Text
  private capBar: Phaser.GameObjects.Graphics

  // Live label: shows WIP progress or cost/tick
  private liveLabel: Phaser.GameObjects.Text
  private costLabel: Phaser.GameObjects.Text

  // Particle effects for continuous production
  private particleTimers: Phaser.Time.TimerEvent[] = []
  private pulseTween: Phaser.Tweens.Tween | null = null
  private highlightTween: Phaser.Tweens.Tween | null = null
  private highlightRect: Phaser.GameObjects.Graphics | null = null

  // Screen anchor point for resource sprite path endpoints
  readonly anchor: Phaser.Math.Vector2

  static readonly W = W
  static readonly H = H

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlantAreaConfig) {
    super(scene, x, y)
    this.areaId = config.id
    this.areaColor = config.color
    this.theme = useUiStore.getState().theme
    this.anchor = new Phaser.Math.Vector2(x, y)

    this.diamond = scene.add.graphics()
    this.statusDot = scene.add.arc(0, 0, 5, 0, 360, false, 0xffffff, 1)
    this.nameLabel = scene.add
      .text(0, 0, config.label, {
        fontSize: '10px',
        color: '#0f1117',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 0,
      })
      .setOrigin(0.5, 0.5)
    this.capBar = scene.add.graphics()

    this.liveLabel = scene.add
      .text(0, -H / 2 - 14, '', {
        fontSize: '9px',
        color: '#f59e0b',
        fontFamily: 'monospace',
        backgroundColor: '#0f111780',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setAlpha(0)

    this.costLabel = scene.add
      .text(0, H / 2 + 90, '', {
        fontSize: '8px',
        color: '#ef4444',
        fontFamily: 'monospace',
        backgroundColor: '#0f111780',
        padding: { x: 2, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setAlpha(0)

    this.drawDiamond(false)
    this.drawCapBar(0)

    const zone = scene.add.zone(0, 0, W + 10, H + 10).setInteractive()
    zone.on('pointerdown', () => {
      useUiStore.getState().setActivePanel(config.id as PanelId)
    })
    zone.on('pointerover', () => {
      scene.input.manager.canvas.style.cursor = this.locked ? 'not-allowed' : 'pointer'
      if (!this.locked) this.setAlpha(0.82)
    })
    zone.on('pointerout', () => {
      scene.input.manager.canvas.style.cursor = 'default'
      this.setAlpha(this.locked ? 0.45 : 1)
    })

    this.add([
      this.diamond,
      this.capBar,
      this.nameLabel,
      this.statusDot,
      this.liveLabel,
      this.costLabel,
      zone,
    ])
    scene.add.existing(this)
  }

  private drawDiamond(highlighted: boolean): void {
    const col = highlighted ? 0xffffff : this.areaColor
    const left = darken(col, 50)
    const right = darken(col, 25)
    const depth = 28

    const hw = W / 2
    const hh = H / 2

    this.diamond.clear()

    // Top face
    this.diamond.fillStyle(col, 1)
    this.diamond.fillPoints(
      [
        { x: 0, y: -hh },
        { x: hw, y: 0 },
        { x: 0, y: hh },
        { x: -hw, y: 0 },
      ],
      true
    )

    // Left wall
    this.diamond.fillStyle(left, 1)
    this.diamond.fillPoints(
      [
        { x: -hw, y: 0 },
        { x: 0, y: hh },
        { x: 0, y: hh + depth },
        { x: -hw, y: depth },
      ],
      true
    )

    // Right wall
    this.diamond.fillStyle(right, 1)
    this.diamond.fillPoints(
      [
        { x: 0, y: hh },
        { x: hw, y: 0 },
        { x: hw, y: depth },
        { x: 0, y: hh + depth },
      ],
      true
    )

    // Outline top face
    this.diamond.lineStyle(1, 0x000000, 0.35)
    this.diamond.strokePoints(
      [
        { x: 0, y: -hh },
        { x: hw, y: 0 },
        { x: 0, y: hh },
        { x: -hw, y: 0 },
      ],
      true
    )
  }

  private drawCapBar(pct: number): void {
    this.lastFillPct = pct
    this.capBar.clear()

    // ── Slot grid visualization ───────────────────────────────────────────────
    // Show individual "unit slots": colored = occupied, gray = empty
    // This gives the player an immediate tactile sense of how full the warehouse is
    const totalSlots = 20 // visual slots regardless of maxCapacity
    const filledSlots = Math.round(pct * totalSlots)
    const cols = 5
    const rows = 4
    const slotSize = 8
    const gap = 3
    const gridW = cols * slotSize + (cols - 1) * gap
    const gridH = rows * slotSize + (rows - 1) * gap
    const gx = -gridW / 2
    const gy = H / 2 + 26

    // Dynamic slot color
    let filledColor = 0x10b981
    if (pct > 0.7) filledColor = 0xef4444
    else if (pct > 0.4) filledColor = 0xf59e0b

    const emptyColor = this.theme === 'dark' ? 0x2d3147 : 0xd1d5db

    let slotIdx = 0
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const sx = gx + col * (slotSize + gap)
        const sy = gy + row * (slotSize + gap)
        const filled = slotIdx < filledSlots
        this.capBar.fillStyle(filled ? filledColor : emptyColor, filled ? 0.9 : 0.45)
        this.capBar.fillRoundedRect(sx, sy, slotSize, slotSize, 1.5)
        slotIdx++
      }
    }

    // ── Thin color bar below the slot grid (shows fill level at a glance) ─────
    const by = gy + gridH + 5
    const barW = gridW
    const barH = 2
    const bgColor = this.theme === 'dark' ? 0x1a1d27 : 0xe2e8f0
    this.capBar.fillStyle(bgColor, 1)
    this.capBar.fillRoundedRect(gx, by, barW, barH, 1)
    if (pct > 0) {
      let fillColor = 0x10b981
      if (pct > 0.7) fillColor = 0xef4444
      else if (pct > 0.4) fillColor = 0xf59e0b
      this.capBar.fillStyle(fillColor, 1)
      this.capBar.fillRoundedRect(gx, by, barW * pct, barH, 1)
    }
  }

  applyTheme(theme: Theme): void {
    this.theme = theme
    this.drawCapBar(this.lastFillPct)
  }

  setLocked(locked: boolean): void {
    this.locked = locked
    this.setAlpha(locked ? 0.45 : 1)
  }

  sync(fillPct: number, isActive: boolean): void {
    this.drawCapBar(fillPct)
    this.statusDot.setFillStyle(isActive ? 0x10b981 : 0x475569)

    if (isActive) {
      this.stopPulse()
    } else if (!isActive && !this.pulseTween) {
      this.startPulse()
    }
  }

  updateLiveLabel(progress: number, costPerTick: number): void {
    if (progress > 0) {
      this.liveLabel.setText(
        `${progress.toFixed(0)}% ▸ ${Math.round(((100 - progress) / 100) * 60)}t`
      )
      this.liveLabel.setAlpha(1)
    } else {
      this.liveLabel.setAlpha(0)
    }

    if (costPerTick > 0) {
      const fmt = (n: number) =>
        n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
      this.costLabel.setText(`${fmt(costPerTick)}/tick`)
      this.costLabel.setAlpha(1)
    } else {
      this.costLabel.setAlpha(0)
    }
  }

  startContinuousEffects(): void {
    if (this.particleTimers.length > 0) return
    // Steam/smoke particles using small graphics tweens
    const emitter = this.scene.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => this.spawnSteamParticle(),
    })
    this.particleTimers.push(emitter)
  }

  stopContinuousEffects(): void {
    this.particleTimers.forEach((t) => t.remove())
    this.particleTimers = []
  }

  private spawnSteamParticle(): void {
    if (!this.scene || !this.scene.sys.isActive()) return
    const g = this.scene.add.graphics()
    const ox = this.x + Phaser.Math.Between(-20, 20)
    const oy = this.y - H / 2 - 5

    g.fillStyle(0xffffff, 0.4)
    g.fillCircle(ox, oy, Phaser.Math.Between(2, 4))
    g.setDepth(1)

    this.scene.tweens.add({
      targets: g,
      y: oy - Phaser.Math.Between(20, 40),
      alpha: 0,
      duration: Phaser.Math.Between(600, 1000),
      ease: 'Sine.easeOut',
      onComplete: () => g.destroy(),
    })
  }

  flashHighlight(durationMs = 1500): void {
    if (this.highlightTween) {
      this.highlightTween.stop()
      this.highlightRect?.destroy()
    }

    this.highlightRect = this.scene.add.graphics()
    this.highlightRect.lineStyle(2, 0xfbbf24, 1)
    this.highlightRect.strokeRect(-W / 2, -H / 2, W, H)
    this.highlightRect.setPosition(this.x, this.y)
    this.highlightRect.setDepth(2)

    this.highlightTween = this.scene.tweens.add({
      targets: this.highlightRect,
      alpha: 0,
      duration: durationMs,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.highlightRect?.destroy()
        this.highlightRect = null
        this.highlightTween = null
      },
    })
  }

  private startPulse(): void {
    this.pulseTween = this.scene.tweens.add({
      targets: this.statusDot,
      alpha: 0.2,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private stopPulse(): void {
    if (this.pulseTween) {
      this.pulseTween.stop()
      this.pulseTween = null
      this.statusDot.setAlpha(1)
    }
  }
}
