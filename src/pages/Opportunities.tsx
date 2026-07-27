import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, SectionTitle } from '../components/ui'
import { Plus, Search, Pencil, Trash2, Target, Sparkles, Loader as Loader2, Link2 } from 'lucide-react'
import { formatCurrency, formatDate } from '../lib/utils'

const STATUS = ['identificado','analizando','preparando','propuesta','ganado','perdido','cerrado']
const STATUS_LABEL: Record<string,string> = {
  identificado:'Identificado', analizando:'Analizando', preparando:'Preparando', propuesta:'Propuesta',
  ganado:'Ganado', perdido:'Perdido', cerrado:'Cerrado',
}
const STATUS_TONE: Record<string,any> = {
  identificado:'warning', analizando:'info', preparando:'warning', propuesta:'info',
  ganado:'success', perdido:'error', cerrado:'neutral',
}

type Opp = {
  id: string; title: string; description: string | null; product: string | null; service: string | null
  total_value: number | null; capital_required: number | null; expected_award_date: string | null
  estimated_return_time: string | null; split_model: string | null; split_detail: string | null
  estimated_profit: number | null; risk: string | null; status: string; created_at: string
}

export function Opportunities() {
  const { session } = useAuth()
  const [rows, setRows] = useState<Opp[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<any>({ title:'', status:'identificado', risk:'media' })
  const [aiUrl, setAiUrl] = useState('')
  const [aiBusy, setAiBusy] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false })
    if (data) setRows(data as Opp[])
  }

  function set(k: string, v: any) { setDraft((d: any) => ({ ...d, [k]: v })) }

  async function save() {
    if (!draft.title?.trim()) return
    if (editId) {
      const { data } = await supabase.from('opportunities').update(draft).eq('id', editId).select().single()
      if (data) setRows((r) => r.map((x) => x.id === editId ? data as Opp : x))
    } else {
      const { data } = await supabase.from('opportunities').insert(draft).select().single()
      if (data) setRows((r) => [data as Opp, ...r])
    }
    close()
  }

  function edit(o: Opp) { setEditId(o.id); setDraft(o); setOpen(true) }
  async function remove(id: string) { await supabase.from('opportunities').delete().eq('id', id); setRows((r) => r.filter((x) => x.id !== id)) }
  function close() { setOpen(false); setEditId(null); setDraft({ title:'', status:'identificado', risk:'media' }) }

  async function aiCreate() {
    if (!aiUrl.trim()) return
    setAiBusy(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token}`}, body: JSON.stringify({ question:`Crea una oportunidad a partir de este enlace: ${aiUrl}`, mode:'create', linkUrl: aiUrl }) })
      if (!res.ok) throw new Error('Error')
      const data = await res.json()
      if (data.record) setRows((r) => [data.record as Opp, ...r])
      setAiOpen(false); setAiUrl('')
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setAiBusy(false) }
  }

  const filtered = rows.filter((o) => (filter === 'all' || o.status === filter) && o.title?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-violet-100">Oportunidades</h1>
        <p className="text-sm text-violet-300/70 mt-1">Oportunidades de inversión y contratos divididos</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="bg-transparent outline-none w-48 placeholder:text-violet-400/40" />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto">
            <option value="all">Todos</option>
            {STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Crear con AI</Button>
          <Button variant="gold" onClick={() => { setEditId(null); setDraft({ title:'', status:'identificado', risk:'media' }); setOpen(true) }}><Plus size={16} /> Nueva</Button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Target size={22} />} title="Sin oportunidades" subtitle="Crea oportunidades de inversión o divídelas con inversionistas." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Nueva</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((o) => (
            <Card key={o.id} hover className="p-5 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 neon-border"><Target size={18} /></div>
                  <div>
                    <h3 className="font-semibold text-violet-100">{o.title}</h3>
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status] || o.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => edit(o)} className="p-1 text-violet-300 hover:text-fuchsia-400 transition"><Pencil size={13} /></button>
                  <button onClick={() => remove(o.id)} className="p-1 text-violet-300 hover:text-rose-400 transition"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div><span className="text-violet-300/70">Valor:</span> <span className="font-semibold text-violet-100">{formatCurrency(o.total_value)}</span></div>
                <div><span className="text-violet-300/70">Capital req.:</span> <span className="text-violet-200">{formatCurrency(o.capital_required)}</span></div>
                <div><span className="text-violet-300/70">Ganancia est.:</span> <span className="text-teal-300">{formatCurrency(o.estimated_profit)}</span></div>
                <div><span className="text-violet-300/70">Premio est.:</span> <span className="text-violet-200">{formatDate(o.expected_award_date)}</span></div>
              </div>
              {o.description && <p className="text-xs text-violet-300/70 mt-3 line-clamp-2">{o.description}</p>}
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={close} title={editId ? 'Editar oportunidad' : 'Nueva oportunidad'} wide>
        <div className="space-y-5">
          <SectionTitle title="Información básica" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Título" value={draft.title || ''} onChange={(e) => set('title', e.target.value)} />
            <Select label="Estado" value={draft.status || 'identificado'} onChange={(e) => set('status', e.target.value)}>
              {STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </Select>
            <Input label="Producto" value={draft.product || ''} onChange={(e) => set('product', e.target.value)} />
            <Input label="Servicio" value={draft.service || ''} onChange={(e) => set('service', e.target.value)} />
            <Select label="Riesgo" value={draft.risk || 'media'} onChange={(e) => set('risk', e.target.value)}>
              <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
            </Select>
          </div>
          <SectionTitle title="Financiero" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor total ($)" type="number" value={draft.total_value || ''} onChange={(e) => set('total_value', +e.target.value)} />
            <Input label="Capital requerido ($)" type="number" value={draft.capital_required || ''} onChange={(e) => set('capital_required', +e.target.value)} />
            <Input label="Ganancia estimada ($)" type="number" value={draft.estimated_profit || ''} onChange={(e) => set('estimated_profit', +e.target.value)} />
            <Input label="Fecha esperada de premio" type="date" value={draft.expected_award_date || ''} onChange={(e) => set('expected_award_date', e.target.value)} />
          </div>
          <Textarea label="Descripción" value={draft.description || ''} onChange={(e) => set('description', e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={close}>Cancelar</Button>
            <Button variant="gold" onClick={save} disabled={!draft.title?.trim()}>{editId ? 'Guardar' : 'Crear'}</Button>
          </div>
        </div>
      </Modal>
      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="Crear oportunidad con AI">
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Pega el enlace y la AI extraerá la información.</p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20">
            <Link2 size={15} className="text-fuchsia-400" />
            <input value={aiUrl} onChange={(e) => setAiUrl(e.target.value)} placeholder="https://…" className="flex-1 bg-transparent outline-none text-sm text-violet-50 placeholder:text-violet-400/40" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAiOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={aiCreate} disabled={aiBusy || !aiUrl.trim()}>
              {aiBusy ? <><Loader2 size={16} className="animate-spin" /> Extrayendo…</> : <><Sparkles size={16} /> Crear con AI</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
