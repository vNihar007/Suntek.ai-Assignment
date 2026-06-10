import { cn } from '../../lib/utils'

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-lg bg-white/5 animate-pulse', className)}
      aria-hidden
    />
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-[#1E293B] rounded-xl p-4 border border-white/5 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}
