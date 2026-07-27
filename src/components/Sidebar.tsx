import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, User, Building2, FileText, Wallet, Wrench, Truck,
  Landmark, Users, ShieldCheck, Gauge, Layers, Sparkles, LogOut, Bot, FolderClosed,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/auth'
import { AIOrb } from './AIOrb'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/profile', label: 'Perfil Personal', icon: User },
  { to: '/app/companies', label: 'Perfil Empresarial', icon: Building2 },
  { to: '/app/contracts', label: 'Contratos', icon: FileText },
  { to: '/app/assistant', label: 'Orbe AI', icon: Bot },
  { to: '/app/wallet', label: 'Wallet', icon: Wallet },
  { to: '/app/tools', label: 'Bid Pages & Tools Links', icon: Wrench },
  { to: '/app/documents', label: 'Documentos', icon: FolderClosed },
  { to: '/app/suppliers', label: 'Net 30/60/90', icon: Truck },
  { to: '/app/capital', label: 'Capital', icon: Landmark },
  { to: '/app/investors', label: 'Inversionistas', icon: Users },
  { to: '/app/insurers', label: 'Aseguradoras', icon: ShieldCheck },
  { to: '/app/risk', label: 'Riesgo', icon: Gauge },
  { to: '/app/pools', label: 'Pools de Inversión', icon: Layers },
]

export function Sidebar() {
  const { role, signOut, user } = useAuth()
  const loc = useLocation()
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-violet-400/15 bg-violet-950/50 backdrop-blur-xl">
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl navy-gradient flex items-center justify-center shadow-sm neon-border">
          <Sparkles size={18} className="text-fuchsia-400" />
        </div>
        <div>
          <div className="font-display font-extrabold text-violet-50 leading-none neon-text">ArcaBid</div>
          <div className="text-[10px] text-violet-300/70 tracking-wider uppercase mt-0.5">Gov Contracting OS</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-0.5">
        {nav.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-fuchsia-500/15 text-fuchsia-200 shadow-[0_0_12px_rgba(217,70,239,0.2)] border border-fuchsia-400/30'
                    : 'text-violet-300/80 hover:bg-violet-500/10 hover:text-violet-100'
                )
              }
            >
              <Icon size={17} className={cn(loc.pathname === item.to && 'text-fuchsia-400')} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 pb-4">
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <AIOrb size={36} />
          <div className="text-xs">
            <div className="font-semibold text-violet-100">Orbe AI</div>
            <div className="text-violet-300/70 capitalize">{role}</div>
          </div>
        </div>
        <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-violet-500/10 transition">
          <div className="min-w-0">
            <div className="text-xs font-medium text-violet-200 truncate">{user?.email || 'Invitado'}</div>
          </div>
          <button onClick={() => signOut()} className="text-violet-300 hover:text-rose-400 transition" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
