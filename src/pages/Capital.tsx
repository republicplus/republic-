import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState } from '../components/ui'
import { Plus, Landmark, Star, Search, Trash2, Pencil } from 'lucide-react'
import { cn, formatCurrency } from '../lib/utils'

const TYPES = ['Banco','Lender','Private Lender','Hard Money','MCA','Factoring','Purchase Order Financing','Invoice Financing','Supply Chain Financing','Equipment Financing','SBA','Business Credit','Línea de Crédito']

export function Capital() {
  const [providers, setProviders] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<any>({ name: '', type: 'Banco', favorite: false })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('capital_providers').select('*').order('created_at', { ascending: false })
    if (data) setProviders(data)
  }
  async function save() {
    if (draft.id) await supabase.from('capital_providers').update(draft).eq('id', draft.id)
    else await supabase.from('capital_providers').insert(draft)
    setOpen(false); setDraft({ name: '', type: 'Banco', favorite: false }); load()
  }
  async function toggleFav(id: string, fav: boolean) {
    await supabase.from('capital_providers').update({ favorite: !fav }).eq('id', id); load()
  }
  async function remove(id: string) { await supabase.from('capital_providers').delete().eq('id', id); load() }

  const filtered = providers.filter((p) =>
    (filter === 'all' || p.type === filter || (filter === 'fav' && p.favorite)) &&
    (p.name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-line text-sm text-muted">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="bg-transparent outline-none w-44" />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto">
            <option value="all">Todos</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            <option value="fav">Favoritos</option>
          </Select>
        </div>
        <Button variant="gold" onClick={() => { setDraft({ name: '', type: 'Banco', favorite: false }); setOpen(true) }}><Plus size={16} /> Nuevo</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Landmark size={22} />} title="Sin fuentes de capital" subtitle="Agrega bancos, lenders, factoring y más." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Agregar</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <Card key={p.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600"><Landmark size={18} /></div>
                  <div>
                    <h3 className="font-semibold text-navy-900">{p.name}</h3>
                    <Badge tone="info">{p.type}</Badge>
                  </div>
                </div>
                <button onClick={() => toggleFav(p.id, p.favorite)} className={cn('transition', p.favorite ? 'text-gold-400' : 'text-navy-200 hover:text-gold-400')}><Star size={16} fill={p.favorite ? 'currentColor' : 'none'} /></button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-4 text-xs">
                <div><span className="text-muted">Monto min:</span> <span className="text-navy-800">{formatCurrency(p.amount_min)}</span></div>
                <div><span className="text-muted">Monto max:</span> <span className="text-navy-800">{formatCurrency(p.amount_max)}</span></div>
                <div><span className="text-muted">Interés:</span> <span className="text-navy-800">{p.interest_rate || '—'}</span></div>
                <div><span className="text-muted">Plazo:</span> <span className="text-navy-800">{p.term || '—'}</span></div>
              </div>
              {p.requirements && <p className="text-xs text-muted mt-3 line-clamp-2">{p.requirements}</p>}
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => { setDraft(p); setOpen(true) }}><Pencil size={13} /> Editar</Button>
                <Button variant="danger" size="sm" onClick={() => remove(p.id)}><Trash2 size={13} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? 'Editar fuente' : 'Nueva fuente de capital'} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={draft.name || ''} onChange={(e) => setDraft((d:any) => ({ ...d, name: e.target.value }))} />
            <Select label="Tipo" value={draft.type} onChange={(e) => setDraft((d:any) => ({ ...d, type: e.target.value }))}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Monto mínimo ($)" type="number" value={draft.amount_min || ''} onChange={(e) => setDraft((d:any) => ({ ...d, amount_min: +e.target.value }))} />
            <Input label="Monto máximo ($)" type="number" value={draft.amount_max || ''} onChange={(e) => setDraft((d:any) => ({ ...d, amount_max: +e.target.value }))} />
            <Input label="Interés" value={draft.interest_rate || ''} onChange={(e) => setDraft((d:any) => ({ ...d, interest_rate: e.target.value }))} placeholder="Ej. 8-12%" />
            <Input label="Plazo" value={draft.term || ''} onChange={(e) => setDraft((d:any) => ({ ...d, term: e.target.value }))} placeholder="Ej. 6-24 meses" />
            <Input label="Website" value={draft.website || ''} onChange={(e) => setDraft((d:any) => ({ ...d, website: e.target.value }))} />
            <Input label="Contacto" value={draft.contact || ''} onChange={(e) => setDraft((d:any) => ({ ...d, contact: e.target.value }))} />
          </div>
          <Textarea label="Requisitos" value={draft.requirements || ''} onChange={(e) => setDraft((d:any) => ({ ...d, requirements: e.target.value }))} />
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
