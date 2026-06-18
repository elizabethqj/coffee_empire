import type Phaser from 'phaser'

export type SoundKey =
  | 'purchase'
  | 'order_complete'
  | 'sale'
  | 'event_trigger'
  | 'level_up'
  | 'achievement'
  | 'factory_ambient'
  | 'market_order'
  | 'order_fulfilled'
  | 'order_failed'
  | 'cash_critical'

const STORAGE_KEY = 'costflow_audio_enabled'

const SOUND_PATHS: Record<SoundKey, string> = {
  purchase: 'sounds/purchase.mp3',
  order_complete: 'sounds/order_complete.mp3',
  sale: 'sounds/sale.mp3',
  event_trigger: 'sounds/event_trigger.mp3',
  level_up: 'sounds/level_up.mp3',
  achievement: 'sounds/achievement.mp3',
  factory_ambient: 'sounds/factory_ambient.mp3',
  market_order: 'sounds/market_order.mp3',
  order_fulfilled: 'sounds/order_fulfilled.mp3',
  order_failed: 'sounds/order_failed.mp3',
  cash_critical: 'sounds/cash_critical.mp3',
}

class AudioManagerSingleton {
  private scene: Phaser.Scene | null = null
  private enabled: boolean
  private ambientSound: Phaser.Sound.BaseSound | null = null
  private ambientPlaying = false

  constructor() {
    this.enabled = localStorage.getItem(STORAGE_KEY) !== 'false'
  }

  bind(scene: Phaser.Scene) {
    this.scene = scene
  }

  unbind() {
    this.stopAmbient()
    this.scene = null
  }

  get isEnabled() {
    return this.enabled
  }

  toggle() {
    this.enabled = !this.enabled
    localStorage.setItem(STORAGE_KEY, String(this.enabled))
    if (!this.enabled) {
      this.scene?.sound.stopAll()
      this.ambientPlaying = false
      this.ambientSound = null
    }
    return this.enabled
  }

  play(key: SoundKey) {
    if (!this.enabled || !this.scene) return
    try {
      this.scene.sound.play(key, { volume: 0.45 })
    } catch {
      // Sound not loaded — no-op; assets are optional in dev
    }
  }

  startAmbient() {
    if (!this.enabled || !this.scene || this.ambientPlaying) return
    try {
      if (!this.ambientSound) {
        this.ambientSound = this.scene.sound.add('factory_ambient', {
          loop: true,
          volume: 0.18,
        })
      }
      this.ambientSound.play()
      this.ambientPlaying = true
    } catch {
      // Asset optional
    }
  }

  stopAmbient() {
    if (this.ambientPlaying && this.ambientSound) {
      try {
        this.ambientSound.stop()
      } catch {
        /* no-op */
      }
      this.ambientPlaying = false
    }
  }

  playMarketOrder() {
    this.play('market_order')
  }

  playOrderFulfilled() {
    this.play('order_fulfilled')
  }

  playOrderFailed() {
    this.play('order_failed')
  }

  playCashCritical() {
    this.play('cash_critical')
  }

  preload(scene: Phaser.Scene) {
    for (const [key, path] of Object.entries(SOUND_PATHS) as [SoundKey, string][]) {
      if (!scene.cache.audio.exists(key)) {
        scene.load.audio(key, path)
      }
    }
  }
}

export const audioManager = new AudioManagerSingleton()
