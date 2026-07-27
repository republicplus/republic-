import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Select, Badge, SectionTitle, Toggle, InfoNote } from '../components/ui'
import { ArrowLeft, Plus, Trash2, Check, Save, Calendar, FileText, Receipt, ListChecks } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const STATUSES = ['pending','applied','review','won','lost','cancelled']
const STATUS_LABEL: Record<string,string> = { pending:'Pendiente', applied:'Aplicado', review:'En evaluación', won:'Ganado', lost:'Perdido', cancelled:'Cancelado' }
const STATUS_TONE: Record<string,any> = { pending:'warning', applied:'info', review:'info', won:'success', lost:'error', cancelled:'neutral' }

export function ContractDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [c, setC] = useState<any>(null)
  const [checklist, setChecklist] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [newItem, setNewItem] = useState('')
  const [newEvent, setNewEvent] = useState({ event: '', event_date: '' })
  const [newInv, setNewInv] = useState({ invoice_number: '', amount: 0, due_date: '' })
  const [tab, setTab] = useState<'overview'|'checklist'|'timeline'|'invoices'>('overview')
  const [saved, setSaved] = useState(false)

  useEffect(() => { if (id) loadAll(id) }, [id])

  async function loadAll(cid: string) {
    const { data } = await supabase.from('contracts').select('*').eq('id', cid).maybeSingle()
    if (data) setC(data)
    const { data: cl } = await supabase.from('contract_checklist').select('*').eq('contract_id', cid).order('created_at')
    if (cl) setChecklist(cl)
    const { data: tl } = await supabase.from('contract_timeline').select('*').eq('contract_id', cid).order('event_date')
    if (tl) setTimeline(tl)
    const { data: iv } = await supabase.from('contract_invoices').select('*').eq('contract_id', cid).order('created_at')
    if (iv) setInvoices(iv)
  }

  function set(k: string, v: any) { setC((p:any) => ({ ...p, [k]: v })) }

  async function saveContract() {
    const { ...payload } = c
    await supabase.from('contracts').update(payload).eq('id', c.id)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function addChecklist() {
    if (!newItem.trim()) return
    const { data } = await supabase.from('contract_checklist').insert({ contract_id: id, label: newItem }).select().single()
    if (data) { setChecklist((c) => [...c, data]); setNewItem('') }
  }
  async function toggleCheck(cid: string, done: boolean) {
    await supabase.from('contract_checklist').update({ done: !done }).eq('id', cid)
    setChecklist((c) => c.map((x) => x.id === cid ? { ...x, done: !done } : x))
  }
  async function delCheck(cid: string) {
    await supabase.from('contract_checklist').delete().eq('id', cid)
    setChecklist((c) => c.filter((x) => x.id !== cid))
  }

  async function addTimeline() {
    if (!newEvent.event.trim()) return
    const { data } = await supabase.from('contract_timeline').insert({ contract_id: id, event: newEvent.event, event_date: newEvent.event_date || null }).select().single()
    if (data) { setTimeline((t) => [...t, data].sort((a,b) => new Date(a.event_date||0).getTime() - new Date(b.event_date||0).getTime())); setNewEvent({ event:'', event_date:'' }) }
  }
  async function delTimeline(tid: string) {
    await supabase.from('contract_timeline').delete().eq('id', tid)
    setTimeline((t) => t.filter((x) => x.id !== tid))
  }

  async function addInvoice() {
    if (!newInv.invoice_number.trim()) return
    const { data } = await supabase.from('contract_invoices').insert({ contract_id: id, ...newInv, due_date: newInv.due_date || null }).select().single()
    if (data) { setInvoices((i) => [...i, data]); setNewInv({ invoice_number:'', amount:0, due_date:'' }) }
  }
  async function delInvoice(iid: string) {
    await supabase.from('contract_invoices').delete().eq('id', iid)
    setInvoices((i) => i.filter((x) => x.id !== iid))
  }

  if (!c) return <div className="text-violet-300/70">Cargando…</div>

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: FileText },
    { id: 'checklist', label: 'Checklist', icon: ListChecks },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'invoices', label: 'Facturas', icon: Receipt },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => nav('/app/contracts')} className="flex items-center gap-2 text-sm text-violet-300/70 hover:text-fuchsia-400 transition"><ArrowLeft size={16} /> Volver</button>
        <Button variant="gold" onClick={saveContract}>{saved ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar</>}</Button>
      </div>

      <InfoNote title="¿Qué es Contract Detail?">
        <p>Esta es la ficha completa de un contrato. Aquí ves y editas el resumen, información de la agencia, fechas clave, datos financieros, entrega y contactos.</p>
        <p>Usa las pestañas para gestionar el checklist de cumplimiento, la línea de tiempo de hitos y las facturas asociadas al contrato.</p>
      </InfoNote>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Input label="Título" value={c.title || ''} onChange={(e) => set('title', e.target.value)} className="text-base font-semibold" />
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
            <Select value={c.status} onChange={(e) => set('status', e.target.value)} className="w-auto">
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      <div className="flex gap-1 border-b border-violet-400/15">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition', tab === t.id ? 'border-fuchsia-400 text-fuchsia-200' : 'border-transparent text-violet-300/70 hover:text-violet-100')}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <SectionTitle title="Información del Contrato" />
            <Input label="Agencia" value={c.agency || ''} onChange={(e) => set('agency', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Solicitation #" value={c.solicitation_number || ''} onChange={(e) => set('solicitation_number', e.target.value)} />
              <Input label="Contract #" value={c.contract_number || ''} onChange={(e) => set('contract_number', e.target.value)} />
              <Input label="Tipo" value={c.type || ''} onChange={(e) => set('type', e.target.value)} />
              <Input label="NAICS" value={c.naics || ''} onChange={(e) => set('naics', e.target.value)} />
              <Input label="PSC" value={c.psc || ''} onChange={(e) => set('psc', e.target.value)} />
              <Input label="Producto" value={c.product || ''} onChange={(e) => set('product', e.target.value)} />
              <Input label="Servicio" value={c.service || ''} onChange={(e) => set('service', e.target.value)} />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <SectionTitle title="Fechas Clave" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Publicación" type="date" value={c.publication_date || ''} onChange={(e) => set('publication_date', e.target.value)} />
              <Input label="Fecha límite" type="date" value={c.due_date || ''} onChange={(e) => set('due_date', e.target.value)} />
              <Input label="Adjudicación" type="date" value={c.award_date || ''} onChange={(e) => set('award_date', e.target.value)} />
              <Input label="Entrega" type="date" value={c.delivery_date || ''} onChange={(e) => set('delivery_date', e.target.value)} />
              <Input label="Pago" type="date" value={c.payment_date || ''} onChange={(e) => set('payment_date', e.target.value)} />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <SectionTitle title="Financiero" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Cantidad" type="number" value={c.quantity || ''} onChange={(e) => set('quantity', +e.target.value)} />
              <Input label="Precio unitario ($)" type="number" value={c.unit_price || ''} onChange={(e) => set('unit_price', +e.target.value)} />
              <Input label="Valor total ($)" type="number" value={c.total_value || ''} onChange={(e) => set('total_value', +e.target.value)} />
              <Input label="Costos ($)" type="number" value={c.costs || ''} onChange={(e) => set('costs', +e.target.value)} />
              <Input label="Ganancia %" type="number" value={c.profit_pct || ''} onChange={(e) => set('profit_pct', +e.target.value)} />
              <Input label="Ganancia fija ($)" type="number" value={c.fixed_profit || ''} onChange={(e) => set('fixed_profit', +e.target.value)} />
              <Input label="Margen ($)" type="number" value={c.margin || ''} onChange={(e) => set('margin', +e.target.value)} />
              <Input label="Proveedor" value={c.supplier || ''} onChange={(e) => set('supplier', e.target.value)} />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <SectionTitle title="Entrega & Contactos" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Dirección de entrega" value={c.delivery_address || ''} onChange={(e) => set('delivery_address', e.target.value)} />
              <Input label="Ciudad" value={c.delivery_city || ''} onChange={(e) => set('delivery_city', e.target.value)} />
              <Input label="Estado" value={c.delivery_state || ''} onChange={(e) => set('delivery_state', e.target.value)} />
              <Input label="ZIP" value={c.delivery_zip || ''} onChange={(e) => set('delivery_zip', e.target.value)} />
              <Input label="Tracking" value={c.tracking || ''} onChange={(e) => set('tracking', e.target.value)} />
              <Input label="Cliente Gobierno" value={c.government_client || ''} onChange={(e) => set('government_client', e.target.value)} />
              <Input label="Contract Officer" value={c.contract_officer || ''} onChange={(e) => set('contract_officer', e.target.value)} />
              <Input label="CO Email" value={c.co_email || ''} onChange={(e) => set('co_email', e.target.value)} />
              <Input label="COR" value={c.cor || ''} onChange={(e) => set('cor', e.target.value)} />
              <Input label="Subcontratistas" value={c.subcontractors || ''} onChange={(e) => set('subcontractors', e.target.value)} />
            </div>
            <Textarea label="Notas" value={c.notes || ''} onChange={(e) => set('notes', e.target.value)} />
            <Input label="Etiquetas (coma)" value={c.tags || ''} onChange={(e) => set('tags', e.target.value)} />
          </Card>
        </div>
      )}

      {tab === 'checklist' && (
        <Card className="p-6">
          <SectionTitle title="Checklist de Cumplimiento" subtitle="Rastrea los requisitos de cada contrato" />
          <div className="flex gap-2 mb-4">
            <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addChecklist()} placeholder="Nuevo item…" className="flex-1" />
            <Button variant="primary" onClick={addChecklist}><Plus size={16} /></Button>
          </div>
          <div className="space-y-2">
            {checklist.length === 0 && <p className="text-sm text-violet-300/70">Sin items.</p>}
            {checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-violet-400/15 hover:bg-violet-500/5 transition">
                <button onClick={() => toggleCheck(item.id, item.done)} className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition', item.done ? 'bg-teal-400 border-teal-400' : 'border-violet-400/40')}>
                  {item.done && <Check size={12} className="text-white" />}
                </button>
                <span className={cn('text-sm flex-1', item.done ? 'line-through text-violet-300/70' : 'text-violet-100')}>{item.label}</span>
                <button onClick={() => delCheck(item.id)} className="text-violet-300/70 hover:text-rose-400 transition"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'timeline' && (
        <Card className="p-6">
          <SectionTitle title="Timeline" subtitle="Eventos y hitos del contrato" />
          <div className="grid grid-cols-3 gap-2 mb-5">
            <Input value={newEvent.event} onChange={(e) => setNewEvent((n) => ({ ...n, event: e.target.value }))} placeholder="Evento" />
            <Input type="date" value={newEvent.event_date} onChange={(e) => setNewEvent((n) => ({ ...n, event_date: e.target.value }))} />
            <Button variant="primary" onClick={addTimeline}><Plus size={16} /> Agregar</Button>
          </div>
          <div className="space-y-3">
            {timeline.length === 0 && <p className="text-sm text-violet-300/70">Sin eventos.</p>}
            {timeline.map((t) => (
              <div key={t.id} className="flex items-center gap-3 group">
                <div className="w-2 h-2 rounded-full bg-fuchsia-400" />
                <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl border border-violet-400/15">
                  <span className="text-sm text-violet-100">{t.event}</span>
                  <span className="text-xs text-violet-300/70">{formatDate(t.event_date)}</span>
                </div>
                <button onClick={() => delTimeline(t.id)} className="text-violet-300/70 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'invoices' && (
        <Card className="p-6">
          <SectionTitle title="Facturas" subtitle="Gestiona las facturas del contrato" />
          <div className="grid grid-cols-4 gap-2 mb-5">
            <Input value={newInv.invoice_number} onChange={(e) => setNewInv((n) => ({ ...n, invoice_number: e.target.value }))} placeholder="Número" />
            <Input type="number" value={newInv.amount || ''} onChange={(e) => setNewInv((n) => ({ ...n, amount: +e.target.value }))} placeholder="Monto" />
            <Input type="date" value={newInv.due_date} onChange={(e) => setNewInv((n) => ({ ...n, due_date: e.target.value }))} />
            <Button variant="primary" onClick={addInvoice}><Plus size={16} /> Agregar</Button>
          </div>
          <div className="space-y-2">
            {invoices.length === 0 && <p className="text-sm text-violet-300/70">Sin facturas.</p>}
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-violet-400/15">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-violet-100">{inv.invoice_number}</span>
                  <Badge tone={inv.status === 'paid' ? 'success' : 'warning'}>{inv.status}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-violet-100">{formatCurrency(inv.amount)}</span>
                  <span className="text-xs text-violet-300/70">{formatDate(inv.due_date)}</span>
                  <button onClick={() => delInvoice(inv.id)} className="text-violet-300/70 hover:text-rose-400 transition"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
