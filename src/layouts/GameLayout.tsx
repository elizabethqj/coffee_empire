import type { ReactNode } from 'react'
import { useSimulationStore, useGamificationStore, useAuthStore, useUiStore } from '@/store'
import { logoutUser } from '@/firebase/auth'
import { simulationEngine } from '@/simulation/engine'
import { AudioToggle } from '@/features/gamification/components/AudioToggle'
import { ThemeToggle } from '@/features/gamification/components/ThemeToggle'

interface GameLayoutProps {
  children: ReactNode
}

export function GameLayout({ children }: GameLayoutProps) {
  const { running, tick, speed } = useSimulationStore()
  const { xp, level } = useGamificationStore()
  const { user } = useAuthStore()
  const { setActivePanel } = useUiStore()

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-primary overflow-hidden min-w-[768px]">
      {/* Top HUD bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-default bg-surface-secondary px-3 lg:px-4 gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <span className="font-bold text-accent-primary tracking-wider text-sm">COSTFLOW</span>
          <span className="hidden lg:inline text-text-muted text-xs">Café Andino S.A.S.</span>
        </div>

        {/* Sim controls */}
        <div className="flex items-center gap-1.5 lg:gap-2 flex-1 justify-center">
          <span className="stat-label hidden sm:inline mr-1">TICK {tick}</span>

          <button
            onClick={() => setActivePanel('ecpv')}
            className="rounded px-2 py-1 text-xs font-mono text-accent-secondary border border-accent-secondary hover:bg-accent-secondary/10 transition-colors"
          >
            ECPV
          </button>

          <button
            onClick={() => (running ? simulationEngine.pause() : simulationEngine.start())}
            className="btn-secondary text-xs px-2 lg:px-3 py-1"
          >
            {running ? '⏸' : '▶'}<span className="hidden lg:inline"> {running ? 'Pausar' : 'Iniciar'}</span>
          </button>

          {([1, 2, 4] as const).map((s) => (
            <button
              key={s}
              onClick={() => simulationEngine.setSpeed(s)}
              className={`rounded px-2 py-1 text-xs font-mono transition-colors ${
                speed === s
                  ? 'bg-accent-primary text-surface-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Player info */}
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          {/* XP / Level */}
          <div className="flex items-center gap-1.5 lg:gap-2">
            <span className="text-xs text-text-muted hidden sm:inline">NIV</span>
            <span className="font-bold text-accent-primary text-sm">{level}</span>
            <div className="w-16 lg:w-24 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-primary transition-all duration-500"
                style={{ width: `${Math.min(100, (xp % 500) / 5)}%` }}
              />
            </div>
            <span className="text-xs text-text-muted hidden lg:inline">{xp} XP</span>
          </div>

          <span className="hidden xl:inline text-xs text-text-secondary truncate max-w-[120px]">
            {user?.displayName}
          </span>
          <ThemeToggle />
          <AudioToggle />
          <button
            onClick={logoutUser}
            className="text-xs text-text-muted hover:text-status-error transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">Cerrar sesión</span>
            <span className="sm:hidden">×</span>
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
