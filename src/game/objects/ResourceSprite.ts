import Phaser from 'phaser'

export type ResourceType = 'mp' | 'wip' | 'pt'

const RESOURCE_COLORS: Record<ResourceType, number> = {
  mp: 0x3b82f6,
  wip: 0xf59e0b,
  pt: 0x10b981,
}

export class ResourceSprite extends Phaser.GameObjects.Arc {
  readonly resourceType: ResourceType

  constructor(scene: Phaser.Scene, x: number, y: number, type: ResourceType) {
    super(scene, x, y, 7, 0, 360, false, RESOURCE_COLORS[type], 1)
    this.resourceType = type
    scene.add.existing(this)
  }
}
