import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { LayoutDashboard, FileText, Store, Wallet, Sparkles, LogOut } from 'lucide-react'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/contracts', label: 'Contratos', icon: FileText },
  { to: '/app/suppliers', label: 'Proveedores', icon: Store },
  { to: '/app/wallet', label: 'Wallet', icon: Wallet },
  { to: '/app/ai', label: 'Orbe AI', icon: Sparkles },
]

export function Sidebar() {
  const nav = useNavigate()
  const { session } = useAuth()

  return (
    <aside className="w-60 shrink-0 border-r border-violet-400/15 bg-[#0e0720] flex flex-col">
      <div className="px-5 py-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center animate-pulse-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-violet-50">ArcaBid</div>
            <div className="text-[10px] text-violet-300/60 uppercase tracking-wider">Contracting OS</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                isActive
                  ? 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/30'
                  : 'text-violet-300/70 hover:text-violet-100 hover:bg-violet-500/5 border border-transparent'
              )}
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-violet-400/15">
        <div className="px-3 py-2 text-xs text-violet-300/50 truncate">{session?.user?.email}</div>
        <button
          onClick={async () => { await supabase.auth.signOut(); nav('/') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-violet-300/70 hover:text-rose-300 hover:bg-rose-500/5 transition w-full"
        >
          <LogOut size={18} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
