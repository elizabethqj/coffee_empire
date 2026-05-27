import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' })
  }

  preload(): void {
    // All textures are generated programmatically — no external asset files needed.
    // This keeps the project self-contained during development.
    this.createPlaceholderTextures()
  }

  create(): void {
    this.scene.start('Plant')
    this.scene.launch('UI')
  }

  private createPlaceholderTextures(): void {
    // A small dot texture for particles (reserved for future assets)
    const g = this.add.graphics()
    g.fillStyle(0xffffff, 1)
    g.fillCircle(4, 4, 4)
    g.generateTexture('particle-dot', 8, 8)
    g.destroy()
  }
}
