import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Badge, SectionTitle } from '../components/ui'
import { formatCurrency, formatDate } from '../lib/utils'
import { Wallet as WalletIcon, TrendingUp, ArrowDownRight, Clock, CreditCard, Package, FileText } from 'lucide-react'

export function Dashboard() {
  const [contracts, setContracts] = useState<any[]>([])
  const [capitalSources, setCapitalSources] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [wallet, setWallet] = useState<any[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data: c } = await supabase.from('contracts').select('*').order('created_at', { ascending: false })
    if (c) setContracts(c)
    const { data: caps } = await supabase.from('capital_sources').select('*')
    if (caps) setCapitalSources(caps)
    const { data: inv } = await supabase.from('contract_invoices').select('*').eq('status', 'pending')
    if (inv) setInvoices(inv)
    const { data: w } = await supabase.from('wallet_transactions').select('*').order('date', { ascending: false }).limit(5)
    if (w) setWallet(w)
  }

  const availableCapital = capitalSources.reduce((s, c) => s + (c.available_amount || 0), 0)
  const projectedProfit = contracts.reduce((s, c) => s + (c.estimated_profit || 0), 0)
  const receivedProfit = wallet.filter((t) => t.amount > 0 && t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const receivable = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.amount || 0), 0)
  const payable = wallet.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalContractValue = contracts.reduce((s, c) => s + (c.total_value || 0), 0)

  const kpis = [
    { label: 'Capital Disponible', value: formatCurrency(availableCapital), icon: WalletIcon, tone: 'gold' as const },
    { label: 'Ganancia Proyectada', value: formatCurrency(projectedProfit), icon: TrendingUp, tone: 'success' as const },
    { label: 'Ganancia Recibida', value: formatCurrency(receivedProfit), icon: ArrowDownRight, tone: 'info' as const },
    { label: 'Por Cobrar', value: formatCurrency(receivable), icon: Clock, tone: 'warning' as const },
    { label: 'Por Pagar', value: formatCurrency(payable), icon: CreditCard, tone: 'error' as const },
    { label: 'Valor Total Contratos', value: formatCurrency(totalContractValue), icon: Package, tone: 'neutral' as const },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-violet-100">Dashboard</h1>
        <p className="text-sm text-violet-300/70 mt-1">Resumen financiero de tu operación</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label} hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-violet-300/70">{k.label}</span>
                <Icon size={16} className="text-fuchsia-400" />
              </div>
              <div className="font-display text-xl font-bold text-violet-100 mt-2">{k.value}</div>
              <div className="mt-2"><Badge tone={k.tone}>•</Badge></div>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <SectionTitle title="Contratos Recientes" />
          {contracts.length === 0 ? (
            <p className="text-sm text-violet-300/70 py-6 text-center">Sin contratos aún</p>
          ) : (
            <div className="space-y-2">
              {contracts.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-violet-400/15 hover:bg-violet-500/5 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400"><FileText size={16} /></div>
                    <div>
                      <div className="text-sm font-medium text-violet-100">{c.title}</div>
                      <div className="text-xs text-violet-300/70">{c.agency || '—'} · {formatDate(c.due_date)}</div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-violet-100">{formatCurrency(c.total_value)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <SectionTitle title="Transacciones Recientes" />
          {wallet.length === 0 ? (
            <p className="text-sm text-violet-300/70 py-6 text-center">Sin transacciones aún</p>
          ) : (
            <div className="space-y-2">
              {wallet.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-violet-400/15">
                  <div>
                    <div className="text-sm font-medium text-violet-100">{t.description || t.type}</div>
                    <div className="text-xs text-violet-300/70">{formatDate(t.date)}</div>
                  </div>
                  <span className={t.amount >= 0 ? 'text-sm font-semibold text-teal-300' : 'text-sm font-semibold text-rose-300'}>{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
