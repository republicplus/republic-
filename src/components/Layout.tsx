import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Bell, Search, Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useI18n, Lang } from '../lib/i18n'

const titles: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/profile': 'Settings',
  '/app/companies': 'Company Profile',
  '/app/contracts': 'Current Contracts',
  '/app/assistant': 'Orbe AI',
  '/app/wallet': 'Wallet',
  '/app/tools': 'Tools & Resources',
  '/app/documents': 'Documents',
  '/app/suppliers': 'Suppliers',
  '/app/capital': 'Capital',
  '/app/investors': 'Investors',
  '/app/insurers': 'Capital Backers',
  '/app/risk': 'Risk Analysis',
  '/app/pools': 'Investment Pools',
  '/app/bid-pages': 'Bid Pages',
  '/app/flow': 'Contract Analyzer Flow',
}

function LangSwitcher() {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-950/50 border border-violet-400/20 text-violet-300/70 hover:text-fuchsia-400 hover:border-fuchsia-400/40 transition text-sm"
      >
        <Globe size={15} />
        <span className="text-xs font-medium">{lang === 'en' ? 'EN' : 'ES'}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 rounded-xl border border-violet-400/20 bg-[#1a0b2e] shadow-xl overflow-hidden z-50">
          {(['en', 'es'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition ${lang === l ? 'bg-fuchsia-500/15 text-fuchsia-200' : 'text-violet-300/70 hover:bg-violet-500/10'}`}
            >
              {l === 'en' ? '🇺🇸 English' : '🇪🇸 Español'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
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
                <input className="bg-transparent outline-none flex-1 placeholder:text-violet-400/40" placeholder="Search…" />
              </div>
              <LangSwitcher />
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
