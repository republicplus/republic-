import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Select, Textarea, Badge, Modal, SectionTitle, EmptyState, InfoNote } from '../components/ui'
import { Plus, Download, TrendingUp, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Landmark, CreditCard, Package, TriangleAlert as AlertTriangle, Clock, Sparkles, Loader as Loader2, Link2 } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'

const PIE_COLORS = ['#a855f7', '#d946ef', '#8b5cf6', '#c084fc', '#e879f9', '#f0abfc']

export function Wallet() {
  const { session } = useAuth()
  const [tx, setTx] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [capitalSources, setCapitalSources] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [capOpen, setCapOpen] = useState(false)
  const [aiCapOpen, setAiCapOpen] = useState(false)
  const [draft, setDraft] = useState<any>({ type: 'income', description: '', amount: 0, date: '', category: '', payment_method: '', client_supplier: '', notes: '' })
  const [capDraft, setCapDraft] = useState<any>({ name: '', type: 'own', available_amount: 0, max_amount: 0, interest_rate: '', term: '', contact: '', email: '', phone: '', source_url: '', notes: '' })
  const [aiUrl, setAiUrl] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [tab, setTab] = useState<'summary' | 'contracts' | 'invoices' | 'capital' | 'reports' | 'alerts'>('summary')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: t } = await supabase.from('wallet_transactions').select('*').order('date', { ascending: false })
    if (t) setTx(t)
    const { data: c } = await supabase.from('contracts').select('*').order('created_at', { ascending: false })
    if (c) setContracts(c)
    const { data: inv } = await supabase.from('contract_invoices').select('*, contracts(title)').order('due_date', { ascending: false })
    if (inv) setInvoices(inv)
    const { data: caps } = await supabase.from('capital_sources').select('*').order('created_at', { ascending: false })
    if (caps) setCapitalSources(caps)
  }

  async function addTx() {
    await supabase.from('wallet_transactions').insert({ ...draft, date: draft.date || null, amount: draft.type === 'expense' ? -Math.abs(draft.amount) : draft.amount })
    setOpen(false); setDraft({ type: 'income', description: '', amount: 0, date: '', category: '', payment_method: '', client_supplier: '', notes: '' }); load()
  }

  async function addCap() {
    await supabase.from('capital_sources').insert(capDraft)
    setCapOpen(false); setCapDraft({ name: '', type: 'own', available_amount: 0, max_amount: 0, interest_rate: '', term: '', contact: '', email: '', phone: '', source_url: '', notes: '' }); load()
  }

  async function aiCreateCap() {
    if (!aiUrl.trim()) return
    setAiBusy(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ question: 'Crea una fuente de capital a partir de este enlace', mode: 'create', linkUrl: aiUrl }),
      })
      if (!res.ok) throw new Error('Error')
      const data = await res.json()
      if (data.record) setCapitalSources((c) => [data.record, ...c])
      setAiCapOpen(false); setAiUrl('')
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setAiBusy(false)
    }
  }

  const availableCapital = capitalSources.reduce((s, c) => s + (c.available_amount || 0), 0)
  const projectedProfit = contracts.reduce((s, c) => s + (c.estimated_profit || 0), 0)
  const receivedProfit = tx.filter((t) => t.amount > 0 && t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const receivable = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.amount || 0), 0)
  const payable = tx.filter((t) => t.amount < 0 && t.status !== 'paid').reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalContractValue = contracts.reduce((s, c) => s + (c.total_value || 0), 0)

  const kpis = [
    { label: 'Capital Disponible', value: formatCurrency(availableCapital), icon: WalletIcon, tone: 'gold' as const },
    { label: 'Ganancia Proyectada', value: formatCurrency(projectedProfit), icon: TrendingUp, tone: 'success' as const },
    { label: 'Ganancia Recibida', value: formatCurrency(receivedProfit), icon: ArrowDownRight, tone: 'info' as const },
    { label: 'Por Cobrar', value: formatCurrency(receivable), icon: Clock, tone: 'warning' as const },
    { label: 'Por Pagar', value: formatCurrency(payable), icon: CreditCard, tone: 'error' as const },
    { label: 'Valor Total Contratos', value: formatCurrency(totalContractValue), icon: Package, tone: 'neutral' as const },
  ]

  const alerts: { type: string; msg: string; tone: any }[] = []
  contracts.filter((c) => c.status === 'ganado' || c.status === 'ejecucion').forEach((c) => {
    if ((c.capital_required || 0) > availableCapital) alerts.push({ type: 'capital', msg: `${c.title} necesita ${formatCurrency(c.capital_required)} en capital`, tone: 'warning' })
    if ((c.estimated_profit || 0) / (c.total_value || 1) < 0.1 && c.total_value > 0) alerts.push({ type: 'profit', msg: `${c.title} tiene baja rentabilidad`, tone: 'error' })
  })
  invoices.filter((i) => i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date()).forEach((i) => {
    alerts.push({ type: 'overdue', msg: `Factura ${i.invoice_number} vencida`, tone: 'error' })
  })

  const monthlyData = (() => {
    const months: Record<string, number> = {}
    tx.forEach((t) => { if (t.date) { const m = t.date.slice(0, 7); months[m] = (months[m] || 0) + (t.amount || 0) } })
    return Object.entries(months).sort().map(([name, value]) => ({ name: name.slice(5), value }))
  })()
  const byContract = contracts.slice(0, 8).map((c) => ({ name: c.title?.slice(0, 12) || 'N/A', value: c.total_value || 0 }))
  const capByType = Object.entries(capitalSources.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + (c.available_amount || 0); return acc }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }))

  const tabs = [
    { id: 'summary', label: 'Resumen' },
    { id: 'contracts', label: 'Contratos' },
    { id: 'invoices', label: 'Facturas' },
    { id: 'capital', label: 'Capital' },
    { id: 'reports', label: 'Reportes' },
    { id: 'alerts', label: `Alertas${alerts.length > 0 ? ` (${alerts.length})` : ''}` },
  ] as const

  function exportCsv() {
    const rows = [['Fecha','Tipo','Descripción','Monto','Estado','Categoría'], ...tx.map((t) => [t.date, t.type, t.description, t.amount, t.status, t.category])]
    const csv = rows.map((r) => r.map((c) => `"${c || ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'arcabid-wallet.csv'; a.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-violet-100">Wallet</h1>
        <p className="text-sm text-violet-300/70 mt-1">Resumen financiero de tu operación</p>
      </div>

      <InfoNote title="¿Qué es Wallet?">
        <p>Administra tus finanzas: capital disponible, transacciones, facturas, fuentes de capital, reportes y alertas inteligentes.</p>
        <p>Registra ingresos y egresos, conecta facturas a tus contratos y mantén visibilidad total sobre el efectivo que entra y sale de tu operación.</p>
      </InfoNote>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-violet-950/50 border border-violet-400/20 rounded-xl p-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition', tab === t.id ? 'bg-fuchsia-500/15 text-fuchsia-200' : 'text-violet-300/70 hover:text-violet-100')}>{t.label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCsv}><Download size={15} /> Exportar</Button>
          <Button variant="primary" onClick={() => setAiCapOpen(true)}><Sparkles size={16} /> Capital AI</Button>
          <Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Transacción</Button>
        </div>
      </div>

      {tab === 'summary' && (
        <>
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

          {alerts.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle size={18} className="text-amber-400" /><h3 className="font-semibold text-violet-100">Alertas de IA</h3></div>
              <div className="space-y-2">
                {alerts.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-violet-400/15">
                    <span className={cn('w-2 h-2 rounded-full', a.tone === 'error' ? 'bg-rose-400' : a.tone === 'warning' ? 'bg-amber-400' : 'bg-sky-400')} />
                    <span className="text-sm text-violet-200">{a.msg}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <SectionTitle title="Transacciones Recientes" />
            <div className="space-y-2">
              {tx.length === 0 && <p className="text-sm text-violet-300/70">Sin transacciones aún.</p>}
              {tx.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-violet-400/15 hover:bg-violet-500/5 transition">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', t.amount >= 0 ? 'bg-teal-500/10 text-teal-300' : 'bg-rose-500/10 text-rose-300')}>
                      {t.amount >= 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-violet-100">{t.description || t.type}</div>
                      <div className="text-xs text-violet-300/70">{formatDate(t.date)} · {t.category || t.type}</div>
                    </div>
                  </div>
                  <span className={cn('text-sm font-semibold', t.amount >= 0 ? 'text-teal-300' : 'text-rose-300')}>{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'contracts' && (
        <Card className="p-6">
          <SectionTitle title="Contratos" subtitle="Resumen financiero de cada contrato" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-violet-400/15 text-left text-xs text-violet-300/70">
                  <th className="px-3 py-2 font-medium">Nombre</th><th className="px-3 py-2 font-medium">Agencia</th>
                  <th className="px-3 py-2 font-medium">Valor</th><th className="px-3 py-2 font-medium">Capital req.</th>
                  <th className="px-3 py-2 font-medium">Costo</th><th className="px-3 py-2 font-medium">Ganancia</th>
                  <th className="px-3 py-2 font-medium">Estado</th><th className="px-3 py-2 font-medium">Entrega</th><th className="px-3 py-2 font-medium">Pago est.</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b border-violet-400/10 hover:bg-violet-500/5 transition">
                    <td className="px-3 py-2 text-violet-100 font-medium">{c.title}</td>
                    <td className="px-3 py-2 text-violet-300/70">{c.agency || '—'}</td>
                    <td className="px-3 py-2 text-violet-100">{formatCurrency(c.total_value)}</td>
                    <td className="px-3 py-2 text-violet-200">{formatCurrency(c.capital_required)}</td>
                    <td className="px-3 py-2 text-violet-200">{formatCurrency(c.estimated_cost)}</td>
                    <td className="px-3 py-2 text-teal-300">{formatCurrency(c.estimated_profit)}</td>
                    <td className="px-3 py-2"><Badge tone={c.status === 'ganado' ? 'success' : c.status === 'perdido' ? 'error' : 'neutral'}>{c.status}</Badge></td>
                    <td className="px-3 py-2 text-violet-300/70">{formatDate(c.delivery_date)}</td>
                    <td className="px-3 py-2 text-violet-300/70">{formatDate(c.payment_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'invoices' && (
        <Card className="p-6">
          <SectionTitle title="Facturas" subtitle="Lista de facturas por contrato" />
          {invoices.length === 0 ? (
            <EmptyState icon={<CreditCard size={22} />} title="Sin facturas" subtitle="Las facturas se crean desde el detalle de cada contrato." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-violet-400/15 text-left text-xs text-violet-300/70">
                    <th className="px-3 py-2 font-medium">Número</th><th className="px-3 py-2 font-medium">Contrato</th>
                    <th className="px-3 py-2 font-medium">Monto</th><th className="px-3 py-2 font-medium">Vencimiento</th><th className="px-3 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-violet-400/10 hover:bg-violet-500/5 transition">
                      <td className="px-3 py-2 text-violet-100 font-medium">{inv.invoice_number}</td>
                      <td className="px-3 py-2 text-violet-300/70">{inv.contracts?.title || '—'}</td>
                      <td className="px-3 py-2 text-violet-100">{formatCurrency(inv.amount)}</td>
                      <td className="px-3 py-2 text-violet-300/70">{formatDate(inv.due_date)}</td>
                      <td className="px-3 py-2"><Badge tone={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'error' : 'warning'}>{inv.status === 'paid' ? 'Pagado' : inv.status === 'overdue' ? 'Vencido' : 'Pendiente'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'capital' && (
        <>
          <div className="flex justify-end gap-2">
            <Button variant="primary" onClick={() => setAiCapOpen(true)}><Sparkles size={16} /> Crear con AI</Button>
            <Button variant="gold" onClick={() => setCapOpen(true)}><Plus size={16} /> Nueva Fuente</Button>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {capitalSources.length === 0 ? (
              <Card className="col-span-full"><EmptyState icon={<Landmark size={22} />} title="Sin fuentes de capital" subtitle="Agrega capital propio, líneas de crédito, inversionistas o financiamiento." action={<Button variant="gold" onClick={() => setCapOpen(true)}><Plus size={16} /> Agregar</Button>} /></Card>
            ) : capitalSources.map((c) => (
              <Card key={c.id} hover className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 neon-border"><Landmark size={18} /></div>
                    <div>
                      <h3 className="font-semibold text-violet-100">{c.name}</h3>
                      <Badge tone={c.type === 'own' ? 'gold' : c.type === 'credit_line' ? 'info' : c.type === 'investor' ? 'success' : 'warning'}>{c.type === 'own' ? 'Capital propio' : c.type === 'credit_line' ? 'Línea de crédito' : c.type === 'investor' ? 'Inversionista' : 'Financiamiento'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div><span className="text-violet-300/70">Disponible:</span> <span className="font-semibold text-violet-100">{formatCurrency(c.available_amount)}</span></div>
                  <div><span className="text-violet-300/70">Máximo:</span> <span className="text-violet-200">{formatCurrency(c.max_amount)}</span></div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'reports' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <SectionTitle title="Ganancias Mensuales" />
              {monthlyData.length === 0 ? <p className="text-sm text-violet-300/70 py-8 text-center">Sin datos aún</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a78bda" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#a78bda" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid rgba(168,85,247,0.3)', background: '#1a0b2e', color: '#f5f3ff' }} />
                    <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#d946ef' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="p-6">
              <SectionTitle title="Ingresos por Contrato" />
              {byContract.length === 0 ? <p className="text-sm text-violet-300/70 py-8 text-center">Sin datos aún</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byContract}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a78bda" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#a78bda" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid rgba(168,85,247,0.3)', background: '#1a0b2e', color: '#f5f3ff' }} />
                    <Bar dataKey="value" fill="#a855f7" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'alerts' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle size={20} className="text-amber-400" /><h3 className="font-semibold text-violet-100">Alertas Inteligentes</h3></div>
          {alerts.length === 0 ? (
            <EmptyState icon={<AlertTriangle size={22} />} title="Sin alertas" subtitle="Todo está bajo control." />
          ) : (
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div key={i} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border', a.tone === 'error' ? 'border-rose-400/30 bg-rose-500/5' : a.tone === 'warning' ? 'border-amber-400/30 bg-amber-500/5' : 'border-sky-400/30 bg-sky-500/5')}>
                  <span className={cn('w-3 h-3 rounded-full shrink-0', a.tone === 'error' ? 'bg-rose-400' : a.tone === 'warning' ? 'bg-amber-400' : 'bg-sky-400')} />
                  <span className="text-sm text-violet-100">{a.msg}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva transacción" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" value={draft.type} onChange={(e) => setDraft((d:any) => ({ ...d, type: e.target.value }))}>
              <option value="income">Ingreso</option><option value="expense">Gasto</option>
              <option value="investment">Inversión</option><option value="payment">Pago</option>
            </Select>
            <Input label="Categoría" value={draft.category} onChange={(e) => setDraft((d:any) => ({ ...d, category: e.target.value }))} />
            <Input label="Descripción" value={draft.description} onChange={(e) => setDraft((d:any) => ({ ...d, description: e.target.value }))} />
            <Input label="Monto" type="number" value={draft.amount || ''} onChange={(e) => setDraft((d:any) => ({ ...d, amount: +e.target.value }))} />
            <Input label="Fecha" type="date" value={draft.date} onChange={(e) => setDraft((d:any) => ({ ...d, date: e.target.value }))} />
            <Input label="Cliente/Proveedor" value={draft.client_supplier} onChange={(e) => setDraft((d:any) => ({ ...d, client_supplier: e.target.value }))} />
          </div>
          <Textarea label="Notas" value={draft.notes} onChange={(e) => setDraft((d:any) => ({ ...d, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={addTx}>Agregar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={capOpen} onClose={() => setCapOpen(false)} title="Nueva fuente de capital" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={capDraft.name} onChange={(e) => setCapDraft((d:any) => ({ ...d, name: e.target.value }))} />
            <Select label="Tipo" value={capDraft.type} onChange={(e) => setCapDraft((d:any) => ({ ...d, type: e.target.value }))}>
              <option value="own">Capital propio</option><option value="credit_line">Línea de crédito</option>
              <option value="investor">Inversionista</option><option value="financing">Financiamiento</option>
            </Select>
            <Input label="Monto disponible ($)" type="number" value={capDraft.available_amount || ''} onChange={(e) => setCapDraft((d:any) => ({ ...d, available_amount: +e.target.value }))} />
            <Input label="Monto máximo ($)" type="number" value={capDraft.max_amount || ''} onChange={(e) => setCapDraft((d:any) => ({ ...d, max_amount: +e.target.value }))} />
            <Input label="Tasa de interés" value={capDraft.interest_rate} onChange={(e) => setCapDraft((d:any) => ({ ...d, interest_rate: e.target.value }))} />
            <Input label="Plazo" value={capDraft.term} onChange={(e) => setCapDraft((d:any) => ({ ...d, term: e.target.value }))} />
          </div>
          <Textarea label="Notas" value={capDraft.notes} onChange={(e) => setCapDraft((d:any) => ({ ...d, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCapOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={addCap} disabled={!capDraft.name}>Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={aiCapOpen} onClose={() => setAiCapOpen(false)} title="Crear fuente de capital con AI">
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Pega el enlace de la fuente de capital y la AI extraerá la información.</p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20">
            <Link2 size={15} className="text-fuchsia-400" />
            <input value={aiUrl} onChange={(e) => setAiUrl(e.target.value)} placeholder="https://…" className="flex-1 bg-transparent outline-none text-sm text-violet-50 placeholder:text-violet-400/40" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAiCapOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={aiCreateCap} disabled={aiBusy || !aiUrl.trim()}>
              {aiBusy ? <><Loader2 size={16} className="animate-spin" /> Extrayendo…</> : <><Sparkles size={16} /> Crear con AI</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
