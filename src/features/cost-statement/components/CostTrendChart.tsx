import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useCostStatementStore } from '@/store/costStatementStore'

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function CostTrendChart() {
  const history = useCostStatementStore((s) => s.history)

  if (history.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-text-muted">
        Accumulating data… (needs 2+ snapshots)
      </div>
    )
  }

  const data = history.map(({ tick, statement }) => ({
    tick,
    salesCost: statement.salesCost,
    revenue: statement.revenue,
    profit: statement.profit,
  }))

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="tick"
          tick={{ fontSize: 9, fill: '#475569' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#475569' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          width={36}
        />
        <Tooltip
          formatter={(val: number, name: string) => [COP.format(val), name]}
          contentStyle={{ background: '#1A1D27', border: '1px solid #22263A', fontSize: 10 }}
          labelStyle={{ color: '#94A3B8' }}
        />
        <Legend wrapperStyle={{ fontSize: 10, color: '#94A3B8' }} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3B82F6"
          strokeWidth={1.5}
          dot={false}
          name="Revenue"
        />
        <Line
          type="monotone"
          dataKey="salesCost"
          stroke="#F59E0B"
          strokeWidth={1.5}
          dot={false}
          name="Sales Cost"
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="#10B981"
          strokeWidth={1.5}
          dot={false}
          name="Profit"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
