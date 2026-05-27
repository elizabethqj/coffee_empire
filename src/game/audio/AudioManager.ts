import type Phaser from 'phaser'

export type SoundKey =
  | 'purchase'
  | 'order_complete'
  | 'sale'
  | 'event_trigger'
  | 'level_up'
  | 'achievement'

const STORAGE_KEY = 'costflow_audio_enabled'

class AudioManagerSingleton {
  private scene: Phaser.Scene | null = null
  private enabled: boolean

  constructor() {
    this.enabled = localStorage.getItem(STORAGE_KEY) !== 'false'
  }

  bind(scene: Phaser.Scene) {
    this.scene = scene
  }

  unbind() {
    this.scene = null
  }

  get isEnabled() {
    return this.enabled
  }

  toggle() {
    this.enabled = !this.enabled
    localStorage.setItem(STORAGE_KEY, String(this.enabled))
    if (!this.enabled) this.scene?.sound.stopAll()
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

  preload(scene: Phaser.Scene) {
    const sounds: Record<SoundKey, string> = {
      purchase: 'sounds/purchase.mp3',
      order_complete: 'sounds/order_complete.mp3',
      sale: 'sounds/sale.mp3',
      event_trigger: 'sounds/event_trigger.mp3',
      level_up: 'sounds/level_up.mp3',
      achievement: 'sounds/achievement.mp3',
    }
    for (const [key, path] of Object.entries(sounds)) {
      if (!scene.cache.audio.exists(key)) {
        scene.load.audio(key, path)
      }
    }
  }
}

export const audioManager = new AudioManagerSingleton()
