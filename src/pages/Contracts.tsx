import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Select, Badge, Modal, EmptyState } from '../components/ui'
import { FileText, Plus, Search } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const STATUSES = ['pending','applied','review','won','lost','cancelled']
const STATUS_LABEL: Record<string,string> = {
  pending: 'Pendiente', applied: 'Aplicado', review: 'En evaluación', won: 'Ganado', lost: 'Perdido', cancelled: 'Cancelado',
}
const STATUS_TONE: Record<string,any> = {
  pending: 'warning', applied: 'info', review: 'info', won: 'success', lost: 'error', cancelled: 'neutral',
}

export function Contracts() {
  const nav = useNavigate()
  const [contracts, setContracts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<any>({ title: '', status: 'pending', total_value: 0 })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('contracts').select('*').order('created_at', { ascending: false })
    if (data) setContracts(data)
  }

  async function create() {
    const { data } = await supabase.from('contracts').insert(draft).select().single()
    setOpen(false); setDraft({ title: '', status: 'pending', total_value: 0 })
    if (data) nav(`/app/contracts/${data.id}`)
  }

  const filtered = contracts.filter((c) =>
    (filter === 'all' || c.status === filter) &&
    (c.title?.toLowerCase().includes(search.toLowerCase()) || c.agency?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar contrato…" className="bg-transparent outline-none w-48 placeholder:text-violet-400/40" />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto">
            <option value="all">Todos</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
        </div>
        <Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Nuevo Contrato</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<FileText size={22} />} title="Sin contratos" subtitle="Crea tu primer contrato para empezar a rastrear licitaciones, entregas y pagos." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Crear contrato</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <Card key={c.id} hover className="p-5 cursor-pointer" >
              <div onClick={() => nav(`/app/contracts/${c.id}`)}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-violet-100 leading-snug">{c.title}</h3>
                  <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                </div>
                <p className="text-xs text-violet-300/70 mt-1">{c.agency || 'Sin agencia'} {c.solicitation_number && `· ${c.solicitation_number}`}</p>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div><span className="text-violet-300/70">Valor:</span> <span className="font-semibold text-violet-100">{formatCurrency(c.total_value)}</span></div>
                  <div><span className="text-violet-300/70">Cierre:</span> <span className="text-violet-200">{formatDate(c.due_date)}</span></div>
                  <div><span className="text-violet-300/70">NAICS:</span> <span className="text-violet-200">{c.naics || '—'}</span></div>
                  <div><span className="text-violet-300/70">Entrega:</span> <span className="text-violet-200">{formatDate(c.delivery_date)}</span></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo contrato">
        <div className="space-y-4">
          <Input label="Título" value={draft.title} onChange={(e) => setDraft((d:any) => ({ ...d, title: e.target.value }))} />
          <Input label="Agencia" value={draft.agency || ''} onChange={(e) => setDraft((d:any) => ({ ...d, agency: e.target.value }))} />
          <Input label="Solicitation Number" value={draft.solicitation_number || ''} onChange={(e) => setDraft((d:any) => ({ ...d, solicitation_number: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Estado" value={draft.status} onChange={(e) => setDraft((d:any) => ({ ...d, status: e.target.value }))}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </Select>
            <Input label="Valor total ($)" type="number" value={draft.total_value || ''} onChange={(e) => setDraft((d:any) => ({ ...d, total_value: +e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={create} disabled={!draft.title}>Crear</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
