import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PlantScene } from './scenes/PlantScene'
import { UIScene } from './scenes/UIScene'

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0F1117',
    scene: [BootScene, PlantScene, UIScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
    },
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
    input: {
      mouse: { preventDefaultDown: false },
    },
  }
}
