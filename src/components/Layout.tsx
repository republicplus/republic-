import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Bell, Search } from 'lucide-react'

const titles: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/profile': 'Perfil Personal',
  '/app/companies': 'Perfil Empresarial',
  '/app/contracts': 'Contratos',
  '/app/assistant': 'Orbe AI',
  '/app/wallet': 'Wallet',
  '/app/tools': 'Bid Pages & Tools Links',
  '/app/documents': 'Documentos',
  '/app/suppliers': 'Net 30/60/90',
  '/app/capital': 'Capital',
  '/app/investors': 'Inversionistas',
  '/app/insurers': 'Aseguradoras de Capital',
  '/app/risk': 'Sistema Inteligente de Riesgo',
  '/app/pools': 'Pools de Inversión',
}

export function Layout() {
  const loc = useLocation()
  const title = titles[loc.pathname] || 'ArcaBid'
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 glass border-b border-violet-400/15">
          <div className="flex items-center justify-between px-8 h-16">
            <h1 className="font-display text-lg font-bold text-violet-100 neon-text">{title}</h1>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-950/50 border border-violet-400/20 text-violet-300/70 text-sm w-64">
                <Search size={15} />
                <input className="bg-transparent outline-none flex-1 placeholder:text-violet-400/40" placeholder="Buscar…" />
              </div>
              <button className="relative w-9 h-9 rounded-xl bg-violet-950/50 border border-violet-400/20 flex items-center justify-center text-violet-300 hover:text-fuchsia-400 hover:border-fuchsia-400/40 transition">
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_6px_rgba(217,70,239,0.8)]" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
