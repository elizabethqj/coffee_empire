import { useGamificationStore } from '@/store/gamificationStore'

export function AchievementsPanel() {
  const achievements = useGamificationStore((s) => s.achievements)

  const unlocked = achievements.filter((a) => a.unlockedAtTick !== null)
  const locked = achievements.filter((a) => a.unlockedAtTick === null)

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest font-mono">
        Logros ({unlocked.length}/{achievements.length})
      </h3>

      {unlocked.length > 0 && (
        <div className="space-y-2">
          {unlocked.map((a) => (
            <div
              key={a.id}
              className="rounded border border-status-ok bg-status-ok/5 p-3"
            >
              <p className="text-xs font-bold text-status-ok font-mono">{a.title}</p>
              <p className="text-xs text-text-muted mt-0.5">{a.description}</p>
              <p className="text-xs text-text-muted/60 mt-1 font-mono">
                Tick {a.unlockedAtTick}
              </p>
            </div>
          ))}
        </div>
      )}

      {locked.length > 0 && (
        <div className="space-y-2">
          {locked.map((a) => (
            <div
              key={a.id}
              className="rounded border border-border-default bg-surface-primary p-3 opacity-50"
            >
              <p className="text-xs font-bold text-text-muted font-mono">
                {'?'.repeat(Math.min(a.title.length, 8))}
              </p>
              <p className="text-xs text-text-muted mt-0.5">Aún bloqueado</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
