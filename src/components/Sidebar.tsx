import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { LayoutDashboard, FileText, Store, Wallet, Sparkles, LogOut, Settings, Layers, Users, Building2, ShieldCheck, Globe, FileSearch, Crown, Wrench, Landmark, TriangleAlert as AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'

type NavItem = { to: string; labelKey: string; icon: any; end?: boolean }
type NavSection = { labelKey: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: 'section.main',
    items: [
      { to: '/app', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
      { to: '/app/bid-pages', labelKey: 'nav.bid_pages', icon: Globe },
      { to: '/app/flow', labelKey: 'nav.contract_flow', icon: FileSearch },
      { to: '/app/contracts', labelKey: 'nav.contracts', icon: FileText },
    ],
  },
  {
    labelKey: 'section.execution',
    items: [
      { to: '/app/suppliers', labelKey: 'nav.suppliers', icon: Store },
      { to: '/app/wallet', labelKey: 'nav.wallet', icon: Wallet },
      { to: '/app/capital', labelKey: 'nav.capital', icon: Landmark },
      { to: '/app/investors', labelKey: 'nav.investors', icon: Users },
      { to: '/app/insurers', labelKey: 'nav.insurers', icon: ShieldCheck },
    ],
  },
  {
    labelKey: 'section.company',
    items: [
      { to: '/app/company', labelKey: 'nav.company', icon: Building2 },
      { to: '/app/tools', labelKey: 'nav.tools', icon: Wrench },
      { to: '/app/documents', labelKey: 'nav.documents', icon: FileText },
      { to: '/app/risk', labelKey: 'nav.risk', icon: AlertTriangle },
    ],
  },
]

export function Sidebar() {
  const nav = useNavigate()
  const { session, isAdmin, signOut } = useAuth()
  const { t } = useI18n()

  return (
    <aside className="w-60 shrink-0 border-r border-violet-400/15 bg-[#0e0720] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5">
        <button onClick={() => nav('/app')} className="flex items-center gap-2 w-full hover:opacity-90 transition">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center animate-pulse-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="text-left">
            <div className="font-display font-bold text-violet-50">ArcaBid</div>
            <div className="text-[10px] text-violet-300/60 uppercase tracking-wider">Contracting OS</div>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto no-scrollbar pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.labelKey} className="mb-4">
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400/40">{t(section.labelKey)}</div>
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
                    {t(item.labelKey)}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-violet-400/15">
        <NavLink
          to="/app/profile"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition mb-0.5',
            isActive
              ? 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/30'
              : 'text-violet-300/70 hover:text-violet-100 hover:bg-violet-500/5 border border-transparent'
          )}
        >
          <Settings size={16} />
          {t('nav.settings')}
        </NavLink>
        <div className="px-3 py-1.5 text-xs text-violet-300/50 truncate">
          {session?.user?.email || (isAdmin ? 'Admin' : '')}
        </div>
        <button
          onClick={async () => { await signOut(); nav('/') }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-violet-300/70 hover:text-rose-300 hover:bg-rose-500/5 transition w-full"
        >
          <LogOut size={16} /> {t('nav.logout')}
        </button>
      </div>
    </aside>
  )
}
