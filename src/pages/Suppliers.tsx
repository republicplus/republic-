import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState } from '../components/ui'
import { Plus, Truck, Star, Search, Trash2, Pencil } from 'lucide-react'
import { cn } from '../lib/utils'

const INDUSTRIES = ['Office','Construction','IT','Medical','Furniture','Cleaning','Food','Uniforms','Industrial','Automotive']
const TYPES = ['Distribuidor','Mayorista','Fabricante','Dropshipping','Logística','Freight']

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<any>({ name: '', industry: 'Office', type: 'Distribuidor', rating: 0, favorite: false })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    if (data) setSuppliers(data)
  }
  async function save() {
    if (draft.id) await supabase.from('suppliers').update(draft).eq('id', draft.id)
    else await supabase.from('suppliers').insert(draft)
    setOpen(false); setDraft({ name: '', industry: 'Office', type: 'Distribuidor', rating: 0, favorite: false }); load()
  }
  async function toggleFav(id: string, fav: boolean) {
    await supabase.from('suppliers').update({ favorite: !fav }).eq('id', id); load()
  }
  async function remove(id: string) { await supabase.from('suppliers').delete().eq('id', id); load() }

  const filtered = suppliers.filter((s) =>
    (filter === 'all' || s.industry === filter || (filter === 'fav' && s.favorite)) &&
    (s.name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-line text-sm text-muted">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proveedor…" className="bg-transparent outline-none w-44" />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto">
            <option value="all">Todas</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            <option value="fav">Favoritos</option>
          </Select>
        </div>
        <Button variant="gold" onClick={() => { setDraft({ name: '', industry: 'Office', type: 'Distribuidor', rating: 0, favorite: false }); setOpen(true) }}><Plus size={16} /> Nuevo Proveedor</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Truck size={22} />} title="Sin proveedores" subtitle="Agrega proveedores Net 30 clasificados por industria." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Agregar</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((s) => (
            <Card key={s.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600"><Truck size={18} /></div>
                  <div>
                    <h3 className="font-semibold text-navy-900">{s.name}</h3>
                    <p className="text-xs text-muted">{s.industry} · {s.type}</p>
                  </div>
                </div>
                <button onClick={() => toggleFav(s.id, s.favorite)} className={cn('transition', s.favorite ? 'text-gold-400' : 'text-navy-200 hover:text-gold-400')}><Star size={16} fill={s.favorite ? 'currentColor' : 'none'} /></button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-4 text-xs">
                <div><span className="text-muted">Net Terms:</span> <span className="text-navy-800">Net {s.net_terms || '—'}</span></div>
                <div><span className="text-muted">Rating:</span> <span className="text-navy-800">{'★'.repeat(s.rating || 0) || '—'}</span></div>
                <div><span className="text-muted">Estados:</span> <span className="text-navy-800">{s.states || '—'}</span></div>
                <div><span className="text-muted">Contacto:</span> <span className="text-navy-800">{s.contact || '—'}</span></div>
              </div>
              {s.products && <p className="text-xs text-muted mt-3 line-clamp-2">{s.products}</p>}
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
            <Input label="Net Terms (días)" type="number" value={draft.net_terms || ''} onChange={(e) => setDraft((d:any) => ({ ...d, net_terms: +e.target.value }))} />
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
    </div>
  )
}
