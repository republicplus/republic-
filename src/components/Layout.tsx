import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Bell, Search } from 'lucide-react'

const titles: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/profile': 'Perfil Personal',
  '/app/companies': 'Perfil Empresarial',
  '/app/contracts': 'Contratos',
  '/app/wallet': 'Wallet',
  '/app/tools': 'Herramientas, Certificaciones & Documentos',
  '/app/suppliers': 'Net 30 & Proveedores',
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
        <header className="sticky top-0 z-30 glass border-b border-line">
          <div className="flex items-center justify-between px-8 h-16">
            <h1 className="font-display text-lg font-bold text-navy-900">{title}</h1>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-line text-muted text-sm w-64">
                <Search size={15} />
                <input className="bg-transparent outline-none flex-1 placeholder:text-navy-300" placeholder="Buscar…" />
              </div>
              <button className="relative w-9 h-9 rounded-xl bg-white border border-line flex items-center justify-center text-navy-600 hover:text-navy-900 transition">
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold-400" />
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
