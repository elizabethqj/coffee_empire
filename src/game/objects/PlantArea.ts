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
  private pulseTween: Phaser.Tweens.Tween | null = null

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

    this.add([this.diamond, this.capBar, this.nameLabel, this.statusDot, zone])
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
    const barW = 84
    const barH = 4
    const bx = -barW / 2
    const by = H / 2 + 34
    const bgColor = this.theme === 'dark' ? 0x1a1d27 : 0xe2e8f0

    this.capBar.clear()
    this.capBar.fillStyle(bgColor, 1)
    this.capBar.fillRoundedRect(bx, by, barW, barH, 2)

    if (pct > 0) {
      const fillColor = pct > 0.8 ? 0xef4444 : pct > 0.5 ? 0xf59e0b : 0x10b981
      this.capBar.fillStyle(fillColor, 1)
      this.capBar.fillRoundedRect(bx, by, barW * pct, barH, 2)
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

    if (isActive && this.pulseTween) {
      this.stopPulse()
    } else if (!isActive && !this.pulseTween) {
      this.startPulse()
    }
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
