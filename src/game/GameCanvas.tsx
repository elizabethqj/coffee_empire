import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createGameConfig } from './config'
import { gameBridge } from './GameBridge'

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const config = createGameConfig(containerRef.current)
    gameRef.current = new Phaser.Game(config)

    return () => {
      gameBridge.clearScene()
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden"
      aria-label="Planta de producción — Café Andino S.A.S."
    />
  )
}
