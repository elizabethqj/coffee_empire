import { useState } from 'react'
import { audioManager } from '@/game/audio/AudioManager'

export function AudioToggle() {
  const [enabled, setEnabled] = useState(audioManager.isEnabled)

  function handleToggle() {
    const next = audioManager.toggle()
    setEnabled(next)
  }

  return (
    <button
      onClick={handleToggle}
      className="rounded px-2 py-1 text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
      aria-label={enabled ? 'Silenciar audio' : 'Activar audio'}
      title={enabled ? 'Audio activado' : 'Audio silenciado'}
    >
      {enabled ? '♪' : '♪̶'}
    </button>
  )
}
