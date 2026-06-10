import { BarChart2, LayoutDashboard, LogOut, Timer } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../../lib/auth-client'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/summary', label: 'Daily Summary', icon: BarChart2 },
]

export default function Sidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[#0B1120] border-r border-white/5 min-h-dvh">
      <div className="px-6 py-5 flex items-center gap-2.5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-[#D97706] flex items-center justify-center">
          <Timer size={16} className="text-white" />
        </div>
        <span className="font-bold text-white text-base tracking-tight">TaskFlow</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-[#D97706]/15 text-[#D97706]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
            text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-all duration-150 cursor-pointer"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  )
}
