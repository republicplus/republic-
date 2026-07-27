import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, SectionTitle } from '../components/ui'
import { Plus, Search, Trash2, Pencil, Star, Store, Sparkles, Loader as Loader2, Link2, ExternalLink, Package, Filter } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'

const SUPPLIER_TYPES = [
  'Mayorista General',
  'Electrónicos',
  'Construcción',
  'Herramientas',
  'Oficina',
  'Tecnología',
  'Seguridad',
  'Industrial',
  'Alimentos',
  'Ropa / Textiles',
  'Mobiliario',
  'Médico / Salud',
  'Automotriz',
  'Empaque',
  'Limpieza',
  'Otros',
]

const NET_TERMS = [0, 15, 30, 60, 90]

type Supplier = {
  id: string
  name: string
  industry: string | null
  type: string | null
  website: string | null
  contact: string | null
  email: string | null
  phone: string | null
  net_terms: number | null
  states: string | null
  products: string | null
  notes: string | null
  rating: number | null
  favorite: boolean | null
  created_at: string
}

export function Suppliers() {
  const { session } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [favOnly, setFavOnly] = useState(false)
  const [open, setOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<any>({ name: '', type: 'Mayorista General', net_terms: 30, rating: 0, favorite: false })
  const [aiUrl, setAiUrl] = useState('')
  const [aiBusy, setAiBusy] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    if (data) setSuppliers(data as Supplier[])
  }

  async function save() {
    if (!draft.name?.trim()) return
    const payload = {
      name: draft.name,
      industry: draft.industry || null,
      type: draft.type || 'Mayorista General',
      website: draft.website?.startsWith('http') ? draft.website : (draft.website ? `https://${draft.website}` : null),
      contact: draft.contact || null,
      email: draft.email || null,
      phone: draft.phone || null,
      net_terms: draft.net_terms ? +draft.net_terms : null,
      states: draft.states || null,
      products: draft.products || null,
      notes: draft.notes || null,
      rating: draft.rating ? +draft.rating : null,
      favorite: draft.favorite || false,
    }
    if (editId) {
      const { data } = await supabase.from('suppliers').update(payload).eq('id', editId).select().single()
      if (data) setSuppliers((s) => s.map((x) => x.id === editId ? data as Supplier : x))
    } else {
      const { data } = await supabase.from('suppliers').insert(payload).select().single()
      if (data) setSuppliers((s) => [data as Supplier, ...s])
    }
    close()
  }

  function edit(s: Supplier) {
    setEditId(s.id)
    setDraft({
      name: s.name, industry: s.industry || '', type: s.type || 'Mayorista General',
      website: s.website || '', contact: s.contact || '', email: s.email || '',
      phone: s.phone || '', net_terms: s.net_terms || 30, states: s.states || '',
      products: s.products || '', notes: s.notes || '', rating: s.rating || 0, favorite: s.favorite || false,
    })
    setOpen(true)
  }

  async function remove(id: string) {
    await supabase.from('suppliers').delete().eq('id', id)
    setSuppliers((s) => s.filter((x) => x.id !== id))
  }

  async function toggleFav(id: string, current: boolean | null) {
    await supabase.from('suppliers').update({ favorite: !current }).eq('id', id)
    setSuppliers((s) => s.map((x) => x.id === id ? { ...x, favorite: !current } : x))
  }

  function close() {
    setOpen(false); setEditId(null)
    setDraft({ name: '', type: 'Mayorista General', net_terms: 30, rating: 0, favorite: false })
  }

  async function aiCreateFromLink() {
    if (!aiUrl.trim()) return
    setAiBusy(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          question: 'Crea un proveedor (supplier) a partir de este enlace web. Extrae nombre, industria, tipo, website, contacto, email, teléfono y productos.',
          mode: 'create',
          linkUrl: aiUrl,
        }),
      })
      if (!res.ok) throw new Error('Error al crear con AI')
      const data = await res.json()
      if (data.record) setSuppliers((s) => [data.record as Supplier, ...s])
      setAiOpen(false); setAiUrl('')
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setAiBusy(false)
    }
  }

  const filtered = suppliers.filter((s) => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.industry?.toLowerCase().includes(search.toLowerCase()) ||
      s.products?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || s.type === typeFilter
    const matchFav = !favOnly || s.favorite
    return matchSearch && matchType && matchFav
  })

  const typeCounts = SUPPLIER_TYPES.map((t) => ({ type: t, count: suppliers.filter((s) => s.type === t).length }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-violet-100">Proveedores</h1>
        <p className="text-sm text-violet-300/70 mt-1">Directorio de proveedores mayoristas para tus contratos gubernamentales</p>
      </div>

      {/* Search + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
          <Search size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proveedor o producto…" className="bg-transparent outline-none w-56 placeholder:text-violet-400/40" />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Crear con AI</Button>
          <Button variant="gold" onClick={() => { setEditId(null); setDraft({ name: '', type: 'Mayorista General', net_terms: 30, rating: 0, favorite: false }); setOpen(true) }}><Plus size={16} /> Nuevo Proveedor</Button>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-violet-300/60 mr-1">
          <Filter size={13} /> <span className="font-medium">Categorías:</span>
        </div>
        <button
          onClick={() => setTypeFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
            typeFilter === 'all'
              ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30'
              : 'bg-violet-950/40 text-violet-300/70 border-violet-400/15 hover:border-fuchsia-400/30'
          )}
        >
          Todos ({suppliers.length})
        </button>
        {typeCounts.filter((t) => t.count > 0).map((t) => (
          <button
            key={t.type}
            onClick={() => setTypeFilter(t.type)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
              typeFilter === t.type
                ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30'
                : 'bg-violet-950/40 text-violet-300/70 border-violet-400/15 hover:border-fuchsia-400/30'
            )}
          >
            {t.type} ({t.count})
          </button>
        ))}
        <button
          onClick={() => setFavOnly(!favOnly)}
          className={cn(
            'ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5',
            favOnly
              ? 'bg-amber-500/15 text-amber-200 border-amber-400/30'
              : 'bg-violet-950/40 text-violet-300/70 border-violet-400/15 hover:border-amber-400/30'
          )}
        >
          <Star size={13} fill={favOnly ? 'currentColor' : 'none'} /> Favoritos
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card><EmptyState
          icon={<Store size={22} />}
          title="Sin proveedores"
          subtitle="Agrega proveedores mayoristas manualmente o pega un enlace y la AI extraerá la información."
          action={<div className="flex gap-2"><Button variant="primary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Crear con AI</Button><Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Nuevo</Button></div>}
        /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((s) => <SupplierCard key={s.id} supplier={s} onEdit={() => edit(s)} onDelete={() => remove(s.id)} onFav={() => toggleFav(s.id, s.favorite)} />)}
        </div>
      )}

      {/* Manual modal */}
      <Modal open={open} onClose={close} title={editId ? 'Editar proveedor' : 'Nuevo proveedor'} wide>
        <div className="space-y-5">
          <SectionTitle title="Información básica" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={draft.name} onChange={(e) => setDraft((d: any) => ({ ...d, name: e.target.value }))} placeholder="Ej. Costco Wholesale" />
            <Select label="Tipo / Categoría" value={draft.type} onChange={(e) => setDraft((d: any) => ({ ...d, type: e.target.value }))}>
              {SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Industria" value={draft.industry} onChange={(e) => setDraft((d: any) => ({ ...d, industry: e.target.value }))} placeholder="Ej. Mayorista multi-categoría" />
            <Input label="Website" value={draft.website} onChange={(e) => setDraft((d: any) => ({ ...d, website: e.target.value }))} placeholder="https://…" />
          </div>

          <SectionTitle title="Contacto" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Persona de contacto" value={draft.contact} onChange={(e) => setDraft((d: any) => ({ ...d, contact: e.target.value }))} />
            <Input label="Email" type="email" value={draft.email} onChange={(e) => setDraft((d: any) => ({ ...d, email: e.target.value }))} />
            <Input label="Teléfono" value={draft.phone} onChange={(e) => setDraft((d: any) => ({ ...d, phone: e.target.value }))} />
            <Input label="Estados / Región" value={draft.states} onChange={(e) => setDraft((d: any) => ({ ...d, states: e.target.value }))} placeholder="Ej. CA, TX, FL o Nacional" />
          </div>

          <SectionTitle title="Comercial" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Términos de pago (Net)" value={draft.net_terms} onChange={(e) => setDraft((d: any) => ({ ...d, net_terms: +e.target.value }))}>
              {NET_TERMS.map((n) => <option key={n} value={n}>{n === 0 ? 'Pago inmediato' : `Net ${n}`}</option>)}
            </Select>
            <Select label="Calificación" value={draft.rating} onChange={(e) => setDraft((d: any) => ({ ...d, rating: +e.target.value }))}>
              {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n) || 'Sin calificar'}</option>)}
            </Select>
          </div>
          <Textarea label="Productos que ofrece" value={draft.products} onChange={(e) => setDraft((d: any) => ({ ...d, products: e.target.value }))} placeholder="Ej. Electrónicos, oficina, limpieza, alimentos a granel…" />
          <Textarea label="Notas" value={draft.notes} onChange={(e) => setDraft((d: any) => ({ ...d, notes: e.target.value }))} placeholder="Observaciones sobre este proveedor…" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={close}>Cancelar</Button>
            <Button variant="gold" onClick={save} disabled={!draft.name?.trim()}>{editId ? 'Guardar cambios' : 'Crear proveedor'}</Button>
          </div>
        </div>
      </Modal>

      {/* AI modal */}
      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="Crear proveedor con AI">
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Pega el enlace del proveedor (sitio web, LinkedIn, directorio) y la AI extraerá nombre, contacto, productos y más.</p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20">
            <Link2 size={15} className="text-fuchsia-400" />
            <input value={aiUrl} onChange={(e) => setAiUrl(e.target.value)} placeholder="https://costco.com" className="flex-1 bg-transparent outline-none text-sm text-violet-50 placeholder:text-violet-400/40" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAiOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={aiCreateFromLink} disabled={aiBusy || !aiUrl.trim()}>
              {aiBusy ? <><Loader2 size={16} className="animate-spin" /> Extrayendo…</> : <><Sparkles size={16} /> Crear con AI</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SupplierCard({ supplier: s, onEdit, onDelete, onFav }: { supplier: Supplier; onEdit: () => void; onDelete: () => void; onFav: () => void }) {
  return (
    <Card hover className="p-5 group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 neon-border"><Store size={18} /></div>
          <div>
            <h3 className="font-semibold text-violet-100">{s.name}</h3>
            {s.type && <Badge tone="info" className="mt-0.5">{s.type}</Badge>}
          </div>
        </div>
        <button onClick={onFav} className={cn('transition', s.favorite ? 'text-amber-400' : 'text-violet-400 hover:text-amber-400')}>
          <Star size={16} fill={s.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        <div><span className="text-violet-300/70">Términos:</span> <span className="text-violet-200">{s.net_terms ? `Net ${s.net_terms}` : '—'}</span></div>
        <div><span className="text-violet-300/70">Calificación:</span> <span className="text-amber-300">{s.rating ? '★'.repeat(s.rating) : '—'}</span></div>
        <div><span className="text-violet-300/70">Contacto:</span> <span className="text-violet-200">{s.contact || '—'}</span></div>
        <div><span className="text-violet-300/70">Estados:</span> <span className="text-violet-200">{s.states || '—'}</span></div>
      </div>

      {s.products && <p className="text-xs text-violet-300/70 mt-3 line-clamp-2">{s.products}</p>}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-violet-400/10">
        <div className="flex items-center gap-2 text-xs">
          {s.email && <a href={`mailto:${s.email}`} className="text-violet-300 hover:text-fuchsia-400 transition">{s.email}</a>}
          {s.website && (
            <a href={s.website} target="_blank" rel="noreferrer" className="text-fuchsia-300 hover:text-fuchsia-200 flex items-center gap-1 transition">
              <ExternalLink size={11} /> Sitio
            </a>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onEdit} className="p-1 text-violet-300 hover:text-fuchsia-400 transition"><Pencil size={13} /></button>
          <button onClick={onDelete} className="p-1 text-violet-300 hover:text-rose-400 transition"><Trash2 size={13} /></button>
        </div>
      </div>
    </Card>
  )
}
