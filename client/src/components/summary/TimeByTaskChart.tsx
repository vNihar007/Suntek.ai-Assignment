import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailySummary } from '../../api/useSummary'
import { formatDuration } from '../../lib/utils'

export default function TimeByTaskChart({ data }: { data: DailySummary }) {
  if (!data.tasks.length) {
    return (
      <div className="bg-[#1E293B] rounded-xl p-6 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-4">Time by Task</h3>
        <p className="text-sm text-[#475569] text-center py-8">No time logged today.</p>
      </div>
    )
  }

  const chartData = data.tasks
    .slice()
    .sort((a, b) => b.totalDuration - a.totalDuration)
    .map((t) => ({ name: t.title.length > 22 ? t.title.slice(0, 22) + '…' : t.title, minutes: Math.floor(t.totalDuration / 60), fullTitle: t.title, duration: formatDuration(t.totalDuration) }))

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-white/5">
      <h3 className="text-sm font-semibold text-white mb-4">Time by Task</h3>
      <div aria-label="Bar chart showing time spent per task">
        <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 44)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-xs">
                    <p className="text-white font-medium mb-0.5">{d.fullTitle}</p>
                    <p className="text-[#D97706]">{d.duration}</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="minutes" fill="#D97706" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#94A3B8', fontSize: 11, formatter: (v: unknown) => `${v}m` }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
