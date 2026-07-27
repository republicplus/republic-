import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, SectionTitle } from '../components/ui'
import { Plus, Search, Pencil, Trash2, Globe, Sparkles, Loader as Loader2, ExternalLink, Filter, Eye, CircleCheck as CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const TYPES = ['free', 'paid', 'mixed']
const TYPE_LABEL: Record<string,string> = { free: 'Gratis', paid: 'Pago', mixed: 'Mixto' }
const TYPE_TONE: Record<string,any> = { free: 'success', paid: 'gold', mixed: 'info' }
const STATUS = ['activa', 'pendiente', 'inactiva']
const STATUS_TONE: Record<string,any> = { activa: 'success', pendiente: 'warning', inactiva: 'neutral' }

type BidPage = {
  id: string; name: string; website: string | null; type: string; category: string | null
  contract_types: string | null; country_state: string | null; subscription_price: number | null
  notes: string | null; tags: string | null; status: string; created_at: string
}

export function BidPages() {
  const { session } = useAuth()
  const [rows, setRows] = useState<BidPage[]>([])
  const [search, setSearch] = useState('')
  const [fType, setFType] = useState('all')
  const [fStatus, setFStatus] = useState('all')
  const [fCategory, setFCategory] = useState('all')
  const [open, setOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<BidPage | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<any>({ name: '', type: 'free', status: 'activa' })
  const [bulkText, setBulkText] = useState('')
  const [bulkPreview, setBulkPreview] = useState<any[]>([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkStep, setBulkStep] = useState<'input' | 'preview'>('input')

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('bid_pages').select('*').order('created_at', { ascending: false })
    if (data) setRows(data as BidPage[])
  }

  function set(k: string, v: any) { setDraft((d: any) => ({ ...d, [k]: v })) }

  async function save() {
    if (!draft.name?.trim()) return
    if (editId) {
      const { data } = await supabase.from('bid_pages').update(draft).eq('id', editId).select().single()
      if (data) setRows((r) => r.map((x) => x.id === editId ? data as BidPage : x))
    } else {
      const { data } = await supabase.from('bid_pages').insert(draft).select().single()
      if (data) setRows((r) => [data as BidPage, ...r])
    }
    close()
  }

  function edit(b: BidPage) { setEditId(b.id); setDraft(b); setOpen(true) }
  async function remove(id: string) { await supabase.from('bid_pages').delete().eq('id', id); setRows((r) => r.filter((x) => x.id !== id)) }
  function close() { setOpen(false); setEditId(null); setDraft({ name: '', type: 'free', status: 'activa' }) }

  async function analyzeBulk() {
    if (!bulkText.trim()) return
    setBulkBusy(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token}` },
        body: JSON.stringify({ mode: 'bulk', bulkType: 'bid_pages', bulkText }),
      })
      if (!res.ok) throw new Error('Error al analizar')
      const data = await res.json()
      const pages = data.bid_pages || []
      setBulkPreview(pages.map((p: any) => ({ ...p, status: 'activa' })))
      setBulkStep('preview')
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setBulkBusy(false) }
  }

  async function saveBulk() {
    const clean = bulkPreview.map((p) => {
      const c: any = {}
      for (const [k, v] of Object.entries(p)) { if (v !== null && v !== undefined && v !== '') c[k] = v }
      if (!c.status) c.status = 'activa'
      return c
    })
    const { data } = await supabase.from('bid_pages').insert(clean).select()
    if (data) setRows((r) => [...(data as BidPage[]), ...r])
    setBulkOpen(false); setBulkText(''); setBulkPreview([]); setBulkStep('input')
  }

  function updatePreviewItem(idx: number, field: string, value: any) {
    setBulkPreview((p) => p.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const categories = Array.from(new Set(rows.map((r) => r.category).filter(Boolean))) as string[]
  const filtered = rows.filter((b) =>
    (fType === 'all' || b.type === fType) &&
    (fStatus === 'all' || b.status === fStatus) &&
    (fCategory === 'all' || b.category === fCategory) &&
    (b.name?.toLowerCase().includes(search.toLowerCase()) || b.website?.toLowerCase().includes(search.toLowerCase()) || b.tags?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-violet-100">Bid Pages</h1>
        <p className="text-sm text-violet-300/70 mt-1">Directorio de plataformas de licitaciones públicas y privadas</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="bg-transparent outline-none w-44 placeholder:text-violet-400/40" />
          </div>
          <Select value={fType} onChange={(e) => setFType(e.target.value)} className="w-auto">
            <option value="all">Todos los tipos</option>
            {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </Select>
          <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-auto">
            <option value="all">Todos los estados</option>
            {STATUS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </Select>
          <Select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="w-auto">
            <option value="all">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => { setBulkStep('input'); setBulkText(''); setBulkPreview([]); setBulkOpen(true) }}><Sparkles size={16} /> Subir Bid Pages con IA</Button>
          <Button variant="gold" onClick={() => { setEditId(null); setDraft({ name:'', type:'free', status:'activa' }); setOpen(true) }}><Plus size={16} /> Nueva</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Globe size={22} />} title="Sin Bid Pages" subtitle="Agrega plataformas de licitación manualmente o sube una lista con IA." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Nueva</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((b) => (
            <Card key={b.id} hover className="p-5 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 neon-border"><Globe size={18} /></div>
                  <div>
                    <h3 className="font-semibold text-violet-100">{b.name}</h3>
                    <div className="flex gap-1 mt-0.5">
                      <Badge tone={TYPE_TONE[b.type]}>{TYPE_LABEL[b.type] || b.type}</Badge>
                      <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => { setDetail(b); setDetailOpen(true) }} className="p-1 text-violet-300 hover:text-fuchsia-400 transition"><Eye size={13} /></button>
                  <button onClick={() => edit(b)} className="p-1 text-violet-300 hover:text-fuchsia-400 transition"><Pencil size={13} /></button>
                  <button onClick={() => remove(b.id)} className="p-1 text-violet-300 hover:text-rose-400 transition"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                {b.category && <div><span className="text-violet-300/70">Categoría:</span> <span className="text-violet-200">{b.category}</span></div>}
                {b.country_state && <div><span className="text-violet-300/70">País/Estado:</span> <span className="text-violet-200">{b.country_state}</span></div>}
                {b.subscription_price != null && <div><span className="text-violet-300/70">Suscripción:</span> <span className="text-violet-200">{formatCurrency(b.subscription_price)}</span></div>}
                {b.contract_types && <div><span className="text-violet-300/70">Contratos:</span> <span className="text-violet-200">{b.contract_types}</span></div>}
              </div>
              {b.notes && <p className="text-xs text-violet-300/70 mt-3 line-clamp-2">{b.notes}</p>}
              {b.website && (
                <a href={b.website.startsWith('http') ? b.website : `https://${b.website}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-fuchsia-300 hover:text-fuchsia-200 transition">
                  <ExternalLink size={11} /> {b.website}
                </a>
              )}
              {b.tags && <div className="mt-2 flex flex-wrap gap-1">{b.tags.split(',').map((t) => <Badge key={t} tone="neutral">{t.trim()}</Badge>)}</div>}
            </Card>
          ))}
        </div>
      )}

      {/* Manual modal */}
      <Modal open={open} onClose={close} title={editId ? 'Editar Bid Page' : 'Nueva Bid Page'} wide>
        <div className="space-y-5">
          <SectionTitle title="Información básica" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={draft.name || ''} onChange={(e) => set('name', e.target.value)} />
            <Input label="Website" value={draft.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://…" />
            <Select label="Tipo" value={draft.type || 'free'} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </Select>
            <Input label="Categoría" value={draft.category || ''} onChange={(e) => set('category', e.target.value)} />
            <Input label="Tipo de contratos" value={draft.contract_types || ''} onChange={(e) => set('contract_types', e.target.value)} />
            <Input label="País / estado" value={draft.country_state || ''} onChange={(e) => set('country_state', e.target.value)} />
            <Input label="Precio de suscripción ($)" type="number" value={draft.subscription_price || ''} onChange={(e) => set('subscription_price', +e.target.value)} />
            <Select label="Estado" value={draft.status || 'activa'} onChange={(e) => set('status', e.target.value)}>
              {STATUS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </Select>
          </div>
          <Textarea label="Notas" value={draft.notes || ''} onChange={(e) => set('notes', e.target.value)} />
          <Input label="Tags (separados por comas)" value={draft.tags || ''} onChange={(e) => set('tags', e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={close}>Cancelar</Button>
            <Button variant="gold" onClick={save} disabled={!draft.name?.trim()}>{editId ? 'Guardar' : 'Crear'}</Button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de Bid Page" wide>
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-violet-300/70">Nombre:</span> <span className="text-violet-100">{detail.name}</span></div>
              <div><span className="text-violet-300/70">Tipo:</span> <Badge tone={TYPE_TONE[detail.type]}>{TYPE_LABEL[detail.type]}</Badge></div>
              <div><span className="text-violet-300/70">Website:</span> <a href={detail.website || '#'} target="_blank" rel="noreferrer" className="text-fuchsia-300">{detail.website}</a></div>
              <div><span className="text-violet-300/70">Categoría:</span> <span className="text-violet-200">{detail.category || '—'}</span></div>
              <div><span className="text-violet-300/70">Contratos:</span> <span className="text-violet-200">{detail.contract_types || '—'}</span></div>
              <div><span className="text-violet-300/70">País/Estado:</span> <span className="text-violet-200">{detail.country_state || '—'}</span></div>
              <div><span className="text-violet-300/70">Suscripción:</span> <span className="text-violet-200">{formatCurrency(detail.subscription_price)}</span></div>
              <div><span className="text-violet-300/70">Estado:</span> <Badge tone={STATUS_TONE[detail.status]}>{detail.status}</Badge></div>
              <div><span className="text-violet-300/70">Creado:</span> <span className="text-violet-200">{formatDate(detail.created_at)}</span></div>
              <div><span className="text-violet-300/70">Tags:</span> <span className="text-violet-200">{detail.tags || '—'}</span></div>
            </div>
            {detail.notes && <div className="pt-2"><span className="text-violet-300/70">Notas:</span><p className="text-violet-200 mt-1">{detail.notes}</p></div>}
          </div>
        )}
      </Modal>

      {/* Bulk AI modal */}
      <Modal open={bulkOpen} onClose={() => { setBulkOpen(false); setBulkStep('input'); setBulkText(''); setBulkPreview([]) }} title="Subir Bid Pages con IA" wide>
        {bulkStep === 'input' ? (
          <div className="space-y-4">
            <p className="text-sm text-violet-300/70">Pega o sube un texto con una lista de páginas web de licitaciones. La IA extraerá y organizará cada página automáticamente.</p>
            <Textarea label="Texto con Bid Pages" value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Pega aquí la lista de páginas de licitación…" className="min-h-[200px]" />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setBulkOpen(false); setBulkText('') }}>Cancelar</Button>
              <Button variant="gold" onClick={analyzeBulk} disabled={bulkBusy || !bulkText.trim()}>
                {bulkBusy ? <><Loader2 size={16} className="animate-spin" /> Analizando…</> : <><Sparkles size={16} /> Analizar con IA</>}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-violet-300/70">Revisa y edita la información antes de guardar. Se encontraron <span className="text-fuchsia-300 font-semibold">{bulkPreview.length}</span> páginas.</p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {bulkPreview.map((p, i) => (
                <Card key={i} className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Nombre" value={p.name || ''} onChange={(e) => updatePreviewItem(i, 'name', e.target.value)} />
                    <Input label="Website" value={p.website || ''} onChange={(e) => updatePreviewItem(i, 'website', e.target.value)} />
                    <Select label="Tipo" value={p.type || 'free'} onChange={(e) => updatePreviewItem(i, 'type', e.target.value)}>
                      {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                    </Select>
                    <Input label="Categoría" value={p.category || ''} onChange={(e) => updatePreviewItem(i, 'category', e.target.value)} />
                    <Input label="Contratos" value={p.contract_types || ''} onChange={(e) => updatePreviewItem(i, 'contract_types', e.target.value)} />
                    <Input label="País/Estado" value={p.country_state || ''} onChange={(e) => updatePreviewItem(i, 'country_state', e.target.value)} />
                    <Input label="Suscripción ($)" type="number" value={p.subscription_price || ''} onChange={(e) => updatePreviewItem(i, 'subscription_price', +e.target.value)} />
                    <Input label="Tags" value={p.tags || ''} onChange={(e) => updatePreviewItem(i, 'tags', e.target.value)} />
                  </div>
                  <Textarea label="Notas" value={p.notes || ''} onChange={(e) => updatePreviewItem(i, 'notes', e.target.value)} className="mt-2" />
                </Card>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setBulkStep('input')}>Volver</Button>
              <Button variant="gold" onClick={saveBulk}><CheckCircle2 size={16} /> Guardar Bid Pages</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

