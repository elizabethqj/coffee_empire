import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGamificationStore } from '@/store/gamificationStore'
import { audioManager } from '@/game/audio/AudioManager'

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  2: 'Inventarios desbloqueados — gestiona capacidad y rotación de stock.',
  3: 'Órdenes de producción — crea tu primera tostión de café.',
  4: 'Costos directos completos — rastrea MPD y MOD con detalle.',
  5: 'Costos indirectos (CIF) — energía, mantenimiento y desperdicios.',
  6: 'WIP completo — acumula costos por orden durante la producción.',
  7: 'ECPV completo — analiza el Estado de Costos período por período.',
  8: 'Optimización estratégica — eventos dinámicos y tabla de líderes.',
}

export function LevelUpModal() {
  const level = useGamificationStore((s) => s.level)
  const [showLevel, setShowLevel] = useState<number | null>(null)
  const prevLevel = useRef(level)

  useEffect(() => {
    if (level > prevLevel.current) {
      setShowLevel(level)
      audioManager.play('level_up')
    }
    prevLevel.current = level
  }, [level])

  return (
    <AnimatePresence>
      {showLevel !== null && (
        <motion.div
          key={showLevel}
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowLevel(null)}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 w-80 rounded-xl border border-accent-primary bg-surface-secondary p-8 text-center shadow-2xl"
            initial={{ scale: 0.7, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <p className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1">
              ¡Nivel alcanzado!
            </p>
            <p className="text-6xl font-bold text-accent-primary font-mono mb-4">
              {showLevel}
            </p>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              {LEVEL_DESCRIPTIONS[showLevel] ?? 'Nuevo nivel desbloqueado.'}
            </p>
            <button
              onClick={() => setShowLevel(null)}
              className="btn-primary w-full text-sm"
            >
              ¡Continuar!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
