import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState } from '../components/ui'
import { Plus, Truck, Star, Search, Trash2, Pencil, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAICreate } from '../lib/useAICreate'

const INDUSTRIES = ['Office','Construction','IT','Medical','Furniture','Cleaning','Food','Uniforms','Industrial','Automotive']
const TYPES = ['Distribuidor','Mayorista','Fabricante','Dropshipping','Logística','Freight']
const NET_TERMS = [30, 60, 90]

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [draft, setDraft] = useState<any>({ name: '', industry: 'Office', type: 'Distribuidor', net_terms: 30, rating: 0, favorite: false })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const { create, busy } = useAICreate()

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    if (data) setSuppliers(data)
  }
  async function save() {
    if (draft.id) await supabase.from('suppliers').update(draft).eq('id', draft.id)
    else await supabase.from('suppliers').insert(draft)
    setOpen(false); setDraft({ name: '', industry: 'Office', type: 'Distribuidor', net_terms: 30, rating: 0, favorite: false }); load()
  }
  async function toggleFav(id: string, fav: boolean) {
    await supabase.from('suppliers').update({ favorite: !fav }).eq('id', id); load()
  }
  async function remove(id: string) { await supabase.from('suppliers').delete().eq('id', id); load() }

  async function aiCreate() {
    if (!aiPrompt.trim()) return
    const result = await create(aiPrompt)
    if (result.ok) { setAiOpen(false); setAiPrompt(''); load() }
  }

  const filtered = suppliers.filter((s) =>
    (filter === 'all' || s.industry === filter || (filter === 'fav' && s.favorite)) &&
    (s.name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proveedor…" className="bg-transparent outline-none w-44 placeholder:text-violet-400/40" />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto">
            <option value="all">Todas</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            <option value="fav">Favoritos</option>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Crear con AI</Button>
          <Button variant="gold" onClick={() => { setDraft({ name: '', industry: 'Office', type: 'Distribuidor', net_terms: 30, rating: 0, favorite: false }); setOpen(true) }}><Plus size={16} /> Nuevo</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Truck size={22} />} title="Sin proveedores" subtitle="Agrega proveedores Net 30/60/90 clasificados por industria." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Agregar</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((s) => (
            <Card key={s.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 neon-border"><Truck size={18} /></div>
                  <div>
                    <h3 className="font-semibold text-violet-100">{s.name}</h3>
                    <p className="text-xs text-violet-300/70">{s.industry} · {s.type}</p>
                  </div>
                </div>
                <button onClick={() => toggleFav(s.id, s.favorite)} className={cn('transition', s.favorite ? 'text-fuchsia-400' : 'text-violet-500 hover:text-fuchsia-400')}><Star size={16} fill={s.favorite ? 'currentColor' : 'none'} /></button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-4 text-xs">
                <div><span className="text-violet-300/70">Net Terms:</span> <span className="text-violet-100">Net {s.net_terms || '—'}</span></div>
                <div><span className="text-violet-300/70">Rating:</span> <span className="text-violet-100">{'★'.repeat(s.rating || 0) || '—'}</span></div>
                <div><span className="text-violet-300/70">Estados:</span> <span className="text-violet-100">{s.states || '—'}</span></div>
                <div><span className="text-violet-300/70">Contacto:</span> <span className="text-violet-100">{s.contact || '—'}</span></div>
              </div>
              {s.products && <p className="text-xs text-violet-300/70 mt-3 line-clamp-2">{s.products}</p>}
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => { setDraft(s); setOpen(true) }}><Pencil size={13} /> Editar</Button>
                <Button variant="danger" size="sm" onClick={() => remove(s.id)}><Trash2 size={13} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? 'Editar proveedor' : 'Nuevo proveedor'} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={draft.name || ''} onChange={(e) => setDraft((d:any) => ({ ...d, name: e.target.value }))} />
            <Input label="Website" value={draft.website || ''} onChange={(e) => setDraft((d:any) => ({ ...d, website: e.target.value }))} />
            <Select label="Industria" value={draft.industry} onChange={(e) => setDraft((d:any) => ({ ...d, industry: e.target.value }))}>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
            <Select label="Tipo" value={draft.type} onChange={(e) => setDraft((d:any) => ({ ...d, type: e.target.value }))}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Contacto" value={draft.contact || ''} onChange={(e) => setDraft((d:any) => ({ ...d, contact: e.target.value }))} />
            <Input label="Email" value={draft.email || ''} onChange={(e) => setDraft((d:any) => ({ ...d, email: e.target.value }))} />
            <Input label="Teléfono" value={draft.phone || ''} onChange={(e) => setDraft((d:any) => ({ ...d, phone: e.target.value }))} />
            <Select label="Net Terms" value={draft.net_terms || 30} onChange={(e) => setDraft((d:any) => ({ ...d, net_terms: +e.target.value }))}>
              {NET_TERMS.map((n) => <option key={n} value={n}>Net {n}</option>)}
            </Select>
            <Input label="Estados" value={draft.states || ''} onChange={(e) => setDraft((d:any) => ({ ...d, states: e.target.value }))} />
            <Input label="Rating (1-5)" type="number" min={0} max={5} value={draft.rating || ''} onChange={(e) => setDraft((d:any) => ({ ...d, rating: +e.target.value }))} />
          </div>
          <Textarea label="Productos" value={draft.products || ''} onChange={(e) => setDraft((d:any) => ({ ...d, products: e.target.value }))} />
          <Textarea label="Notas" value={draft.notes || ''} onChange={(e) => setDraft((d:any) => ({ ...d, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={save} disabled={!draft.name}>Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="Crear proveedor con AI">
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Describe el proveedor y la AI lo creará automáticamente.</p>
          <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Ej: Crea un proveedor llamado Acme Supply, industria Office, Net 30, email ventas@acme.com, rating 4" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAiOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={aiCreate} disabled={busy || !aiPrompt.trim()}>{busy ? 'Creando…' : 'Crear con AI'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
