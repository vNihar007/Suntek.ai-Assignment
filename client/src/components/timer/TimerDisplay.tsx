import { useTimer } from '../../hooks/useTimer'
import { formatDuration } from '../../lib/utils'

export default function TimerDisplay({ startedAt }: { startedAt: string | null }) {
  const elapsed = useTimer(startedAt)
  return (
    <span className="tabular-nums font-mono text-sm font-semibold text-[#D97706]">
      {formatDuration(elapsed)}
    </span>
  )
}
