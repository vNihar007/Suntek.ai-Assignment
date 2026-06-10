import { useSession } from '../../lib/auth-client'
import { formatDate } from '../../lib/utils'

export default function TopBar() {
  const { data: session } = useSession()

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0F172A]/80 backdrop-blur-sm sticky top-0 z-10">
      <p className="text-sm text-[#94A3B8]">{formatDate(new Date())}</p>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#D97706]/20 flex items-center justify-center">
          <span className="text-[#D97706] text-xs font-bold uppercase">
            {session?.user?.name?.charAt(0) ?? '?'}
          </span>
        </div>
        <span className="text-sm font-medium text-white">{session?.user?.name ?? ''}</span>
      </div>
    </header>
  )
}
