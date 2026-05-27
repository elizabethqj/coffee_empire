import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'

interface LeaderboardEntry {
  userId: string
  displayName: string
  score: number
  profit: number
}

interface LeaderboardProps {
  level: number
}

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function Leaderboard({ level }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const col = collection(db, 'leaderboards', `level-${level}`, 'entries')
    const q = query(col, orderBy('score', 'desc'), limit(10))

    getDocs(q)
      .then((snap) => {
        setEntries(
          snap.docs.map((d) => ({
            userId: d.id,
            ...(d.data() as Omit<LeaderboardEntry, 'userId'>),
          }))
        )
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [level])

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest font-mono">
        Tabla de Líderes — Nivel {level}
      </h3>

      {loading ? (
        <p className="text-xs text-text-muted">Cargando…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-text-muted">Aún no hay entradas.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <div
              key={entry.userId}
              className="flex items-center gap-3 rounded border border-border-default bg-surface-primary px-3 py-2"
            >
              <span
                className={`text-xs font-bold font-mono w-5 ${
                  idx === 0
                    ? 'text-accent-primary'
                    : idx === 1
                    ? 'text-text-secondary'
                    : 'text-text-muted'
                }`}
              >
                #{idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary truncate">{entry.displayName}</p>
                <p className="text-xs text-text-muted font-mono">{COP.format(entry.profit)}</p>
              </div>
              <span className="text-xs font-mono text-accent-primary">
                {(entry.score * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
