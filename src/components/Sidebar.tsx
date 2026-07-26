import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, User, Building2, FileText, Wallet, Wrench, Truck,
  Landmark, Users, ShieldCheck, Gauge, Layers, Sparkles, LogOut,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/auth'
import { AIOrb } from './AIOrb'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/profile', label: 'Perfil Personal', icon: User },
  { to: '/app/companies', label: 'Perfil Empresarial', icon: Building2 },
  { to: '/app/contracts', label: 'Contratos', icon: FileText },
  { to: '/app/wallet', label: 'Wallet', icon: Wallet },
  { to: '/app/tools', label: 'Herramientas & Docs', icon: Wrench },
  { to: '/app/suppliers', label: 'Net 30 & Proveedores', icon: Truck },
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
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-line bg-white">
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl navy-gradient flex items-center justify-center shadow-sm">
          <Sparkles size={18} className="text-gold-400" />
        </div>
        <div>
          <div className="font-display font-extrabold text-navy-900 leading-none">ArcaBid</div>
          <div className="text-[10px] text-muted tracking-wider uppercase mt-0.5">Gov Contracting OS</div>
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
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                )
              }
            >
              <Icon size={17} className={cn(loc.pathname === item.to && 'text-gold-400')} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 pb-4">
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <AIOrb size={36} />
          <div className="text-xs">
            <div className="font-semibold text-navy-900">Orbe AI</div>
            <div className="text-muted capitalize">{role}</div>
          </div>
        </div>
        <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-navy-50 transition">
          <div className="min-w-0">
            <div className="text-xs font-medium text-navy-900 truncate">{user?.email || 'Invitado'}</div>
          </div>
          <button onClick={() => signOut()} className="text-muted hover:text-error-600 transition" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
