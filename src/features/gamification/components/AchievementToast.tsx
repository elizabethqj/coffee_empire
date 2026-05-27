import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGamificationStore } from '@/store/gamificationStore'
import { audioManager } from '@/game/audio/AudioManager'
import type { Achievement } from '@/types'

const DISPLAY_DURATION_MS = 4_500

export function AchievementToast() {
  const achievements = useGamificationStore((s) => s.achievements)
  const [queue, setQueue] = useState<Achievement[]>([])
  const seenIds = useRef<Set<string>>(new Set())

  // Detect newly unlocked achievements
  useEffect(() => {
    const newOnes = achievements.filter(
      (a) => a.unlockedAtTick !== null && !seenIds.current.has(a.id)
    )
    if (newOnes.length === 0) return
    newOnes.forEach((a) => seenIds.current.add(a.id))
    audioManager.play('achievement')
    setQueue((prev) => [...prev, ...newOnes])
  }, [achievements])

  // Auto-dismiss the front of the queue
  useEffect(() => {
    if (queue.length === 0) return
    const t = setTimeout(() => setQueue((prev) => prev.slice(1)), DISPLAY_DURATION_MS)
    return () => clearTimeout(t)
  }, [queue])

  const current = queue[0]

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-6 z-40 w-64 rounded-lg border border-accent-primary bg-surface-secondary p-4 shadow-xl"
        >
          <p className="text-xs text-accent-primary font-mono uppercase tracking-widest mb-1">
            Logro desbloqueado
          </p>
          <p className="text-sm font-bold text-text-primary mb-0.5">{current.title}</p>
          <p className="text-xs text-text-muted leading-relaxed">{current.description}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
