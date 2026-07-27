import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Select, Badge, Modal, SectionTitle } from '../components/ui'
import { Plus, Download, TrendingUp, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

export function Wallet() {
  const [tx, setTx] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<any>({ type: 'income', description: '', amount: 0, date: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data: t } = await supabase.from('wallet_transactions').select('*').order('date', { ascending: false })
    if (t) setTx(t)
    const { data: c } = await supabase.from('contracts').select('*').eq('status', 'won')
    if (c) setContracts(c)
  }

  async function add() {
    await supabase.from('wallet_transactions').insert({ ...draft, date: draft.date || null })
    setOpen(false); setDraft({ type: 'income', description: '', amount: 0, date: '' }); load()
  }

  const income = tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const expenses = tx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const net = income - expenses
  const roi = expenses > 0 ? Math.round((net / expenses) * 100) : 0

  const byContract = contracts.map((c) => ({ name: c.title?.slice(0, 12) || 'N/A', value: c.total_value || 0 }))
  const byClient = Object.entries(contracts.reduce((acc, c) => {
    const k = c.government_client || 'Sin cliente'
    acc[k] = (acc[k] || 0) + (c.total_value || 0)
    return acc
  }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }))

  const PIE_COLORS = ['#a855f7', '#d946ef', '#8b5cf6', '#c084fc', '#e879f9', '#f0abfc']

  function exportCsv() {
    const rows = [['Fecha','Tipo','Descripción','Monto','Estado'], ...tx.map((t) => [t.date, t.type, t.description, t.amount, t.status])]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'arcabid-wallet.csv'; a.click()
  }

  const kpis = [
    { label: 'Ganancias Proyectadas', value: formatCurrency(contracts.reduce((s,c) => s + (c.fixed_profit || (c.total_value * (c.profit_pct||0)/100) || 0), 0)), icon: TrendingUp, tone: 'success' },
    { label: 'Ganancias Reales', value: formatCurrency(net), icon: WalletIcon, tone: 'info' },
    { label: 'Capital Invertido', value: formatCurrency(expenses), icon: ArrowUpRight, tone: 'warning' },
    { label: 'ROI', value: `${roi}%`, icon: TrendingUp, tone: 'gold' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={exportCsv}><Download size={15} /> Exportar Excel</Button>
        <Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Transacción</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label} hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-violet-300/70">{k.label}</span>
                <Icon size={16} className="text-fuchsia-400" />
              </div>
              <div className="font-display text-2xl font-bold text-violet-100 mt-2">{k.value}</div>
              <div className="mt-2"><Badge tone={k.tone as any}>{k.label.includes('ROI') ? 'Retorno' : 'Actual'}</Badge></div>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <SectionTitle title="Ganancias por Contrato" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byContract}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a78bda" />
              <YAxis tick={{ fontSize: 11 }} stroke="#a78bda" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid rgba(168,85,247,0.3)', background: '#1a0b2e', color: '#f5f3ff' }} />
              <Bar dataKey="value" fill="#a855f7" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <SectionTitle title="Ganancias por Cliente" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byClient} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                {byClient.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid rgba(168,85,247,0.3)', background: '#1a0b2e', color: '#f5f3ff' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <SectionTitle title="Flujo de Efectivo" subtitle="Transacciones recientes" />
        <div className="space-y-2">
          {tx.length === 0 && <p className="text-sm text-violet-300/70">Sin transacciones aún.</p>}
          {tx.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-violet-400/15 hover:bg-violet-500/5 transition">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', t.amount >= 0 ? 'bg-teal-500/10 text-teal-300' : 'bg-rose-500/10 text-rose-300')}>
                  {t.amount >= 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div>
                  <div className="text-sm font-medium text-violet-100">{t.description || t.type}</div>
                  <div className="text-xs text-violet-300/70">{formatDate(t.date)} · {t.type}</div>
                </div>
              </div>
              <span className={cn('text-sm font-semibold', t.amount >= 0 ? 'text-teal-300' : 'text-rose-300')}>{formatCurrency(t.amount)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva transacción">
        <div className="space-y-4">
          <Select label="Tipo" value={draft.type} onChange={(e) => setDraft((d:any) => ({ ...d, type: e.target.value }))}>
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
            <option value="investment">Inversión</option>
            <option value="payment">Pago</option>
          </Select>
          <Input label="Descripción" value={draft.description} onChange={(e) => setDraft((d:any) => ({ ...d, description: e.target.value }))} />
          <Input label="Monto (negativo para gasto)" type="number" value={draft.amount || ''} onChange={(e) => setDraft((d:any) => ({ ...d, amount: draft.type === 'expense' ? -Math.abs(+e.target.value) : +e.target.value }))} />
          <Input label="Fecha" type="date" value={draft.date} onChange={(e) => setDraft((d:any) => ({ ...d, date: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={add}>Agregar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
