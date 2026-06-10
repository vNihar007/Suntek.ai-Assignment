import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { DailySummary } from '../../api/useSummary'

const COLORS = { Pending: '#D97706', 'In Progress': '#6366F1', Completed: '#10B981' }

export default function TaskStatusChart({ data }: { data: DailySummary }) {
  const chartData = [
    { name: 'Pending',     value: data.pendingCount },
    { name: 'In Progress', value: data.inProgressCount },
    { name: 'Completed',  value: data.completedCount },
  ].filter((d) => d.value > 0)

  const total = data.pendingCount + data.inProgressCount + data.completedCount

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-white/5">
      <h3 className="text-sm font-semibold text-white mb-4">Task Status</h3>
      {total === 0 ? (
        <p className="text-sm text-[#475569] text-center py-8">No tasks today.</p>
      ) : (
        <div aria-label={`Donut chart: ${data.pendingCount} pending, ${data.inProgressCount} in progress, ${data.completedCount} completed`}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]
                  return (
                    <div className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-xs">
                      <p className="font-medium" style={{ color: d.payload.fill }}>{d.name}</p>
                      <p className="text-white">{d.value} task{d.value !== 1 ? 's' : ''}</p>
                    </div>
                  )
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-[#94A3B8]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
