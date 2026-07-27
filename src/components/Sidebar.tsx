import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import {
  LayoutDashboard, FileText, Store, Wallet, Sparkles, LogOut,
  Target, Users, Landmark, Building2, ShieldCheck, Globe, FileSearch, Crown, Wrench,
} from 'lucide-react'
import { cn } from '../lib/utils'

const NAV_SECTIONS: { label: string; items: { to: string; label: string; icon: any; end?: boolean }[] }[] = [
  {
    label: 'Principal',
    items: [
      { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/app/contracts', label: 'Contratos', icon: FileText },
      { to: '/app/flow', label: 'Contract Flow', icon: FileSearch },
      { to: '/app/opportunities', label: 'Oportunidades', icon: Target },
    ],
  },
  {
    label: 'Proveedores y Licitaciones',
    items: [
      { to: '/app/suppliers', label: 'Proveedores', icon: Store },
      { to: '/app/bid-pages', label: 'Bid Pages', icon: Globe },
      { to: '/app/private-bidding', label: 'Licitaciones Privadas', icon: ShieldCheck },
    ],
  },
  {
    label: 'Capital e Inversionistas',
    items: [
      { to: '/app/wallet', label: 'Wallet', icon: Wallet },
      { to: '/app/investors', label: 'Inversionistas', icon: Users },
      { to: '/app/pools', label: 'Pools', icon: Landmark },
      { to: '/app/insurers', label: 'Aseguradoras', icon: ShieldCheck },
    ],
  },
  {
    label: 'Empresa',
    items: [
      { to: '/app/company', label: 'Mi Empresa', icon: Building2 },
      { to: '/app/tools', label: 'Herramientas', icon: Wrench },
      { to: '/app/documents', label: 'Documentos', icon: FileText },
      { to: '/app/risk', label: 'Análisis de Riesgo', icon: Crown },
    ],
  },
]

export function Sidebar() {
  const nav = useNavigate()
  const { session } = useAuth()

  return (
    <aside className="w-60 shrink-0 border-r border-violet-400/15 bg-[#0e0720] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5">
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

      <nav className="flex-1 px-3 overflow-y-auto no-scrollbar pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400/40">{section.label}</div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                      isActive
                        ? 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/30'
                        : 'text-violet-300/70 hover:text-violet-100 hover:bg-violet-500/5 border border-transparent'
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-violet-400/15">
        <div className="px-3 py-1.5 text-xs text-violet-300/50 truncate">{session?.user?.email}</div>
        <button
          onClick={async () => { await supabase.auth.signOut(); nav('/') }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-violet-300/70 hover:text-rose-300 hover:bg-rose-500/5 transition w-full"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
