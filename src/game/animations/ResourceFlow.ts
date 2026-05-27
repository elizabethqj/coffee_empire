import Phaser from 'phaser'
import { ResourceSprite, type ResourceType } from '../objects/ResourceSprite'

export interface FlowOptions {
  from: Phaser.Math.Vector2
  to: Phaser.Math.Vector2
  type: ResourceType
  onComplete?: () => void
}

/**
 * Spawns a ResourceSprite at `from`, tweens it to `to`, then destroys it.
 */
export function playResourceFlow(scene: Phaser.Scene, opts: FlowOptions): void {
  const sprite = new ResourceSprite(scene, opts.from.x, opts.from.y, opts.type)

  scene.tweens.add({
    targets: sprite,
    x: opts.to.x,
    y: opts.to.y,
    duration: 1_200,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      sprite.destroy()
      opts.onComplete?.()
    },
  })
}
