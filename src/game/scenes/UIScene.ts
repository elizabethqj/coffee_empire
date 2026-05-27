import Phaser from 'phaser'

interface AlertEntry {
  container: Phaser.GameObjects.Container
  expireAt: number
}

const ALERT_DURATION_MS = 5_000

export class UIScene extends Phaser.Scene {
  private alerts: AlertEntry[] = []

  constructor() {
    super({ key: 'UI' })
  }

  create(): void {
    // Listen for alerts emitted by PlantScene
    this.events.on('show-alert', (title: string, description: string) => {
      this.showAlert(title, description)
    })
  }

  update(): void {
    const now = Date.now()
    this.alerts = this.alerts.filter((entry) => {
      if (now > entry.expireAt) {
        this.tweens.add({
          targets: entry.container,
          alpha: 0,
          y: entry.container.y - 20,
          duration: 300,
          onComplete: () => entry.container.destroy(),
        })
        return false
      }
      return true
    })
  }

  private showAlert(title: string, description: string): void {
    const { width } = this.scale
    const startY = 20 + this.alerts.length * 90

    const bg = this.add.graphics()
    bg.fillStyle(0x22263a, 0.95)
    bg.fillRoundedRect(0, 0, 260, 72, 8)
    bg.lineStyle(1, 0xf59e0b, 0.8)
    bg.strokeRoundedRect(0, 0, 260, 72, 8)

    const titleText = this.add.text(10, 10, title, {
      fontSize: '12px',
      color: '#f59e0b',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    })

    const descText = this.add.text(10, 30, description, {
      fontSize: '10px',
      color: '#94a3b8',
      fontFamily: 'monospace',
      wordWrap: { width: 240 },
    })

    const container = this.add.container(width - 280, startY, [bg, titleText, descText])
    container.setAlpha(0)

    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 250,
      ease: 'Sine.easeOut',
    })

    this.alerts.push({ container, expireAt: Date.now() + ALERT_DURATION_MS })
  }
}
