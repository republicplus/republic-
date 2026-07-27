import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, InfoNote } from '../components/ui'
import { Plus, Landmark, Star, Search, Trash2, Pencil, Sparkles, Loader as Loader2, Link2 } from 'lucide-react'
import { cn, formatCurrency } from '../lib/utils'
import { useAuth } from '../lib/auth'

const TYPES = ['Banco','Lender','Private Lender','Hard Money','MCA','Factoring','Purchase Order Financing','Invoice Financing','Supply Chain Financing','Equipment Financing','SBA','Business Credit','Línea de Crédito']

export function Capital() {
  const { session } = useAuth()
  const [providers, setProviders] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiUrl, setAiUrl] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
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

  async function aiCreateFromLink() {
    if (!aiUrl.trim()) return
    setAiBusy(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ question: 'Crea una fuente de capital (provider) a partir de este enlace', mode: 'create', linkUrl: aiUrl }),
      })
      if (!res.ok) throw new Error('Error al crear con AI')
      const data = await res.json()
      if (data.record) load()
      setAiOpen(false); setAiUrl('')
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setAiBusy(false)
    }
  }

  const filtered = providers.filter((p) =>
    (filter === 'all' || p.type === filter || (filter === 'fav' && p.favorite)) &&
    (p.name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="bg-transparent outline-none w-44 placeholder:text-violet-400/40" />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto">
            <option value="all">Todos</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            <option value="fav">Favoritos</option>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Crear con AI</Button>
          <Button variant="gold" onClick={() => { setDraft({ name: '', type: 'Banco', favorite: false }); setOpen(true) }}><Plus size={16} /> Nuevo</Button>
        </div>
      </div>

      <InfoNote title="¿Qué es Capital?">
        <p>Administra tus fuentes de capital: líneas de crédito, préstamos, inversionistas privados y fondos propios. Registra el monto disponible, tasa, plazo y estado de cada fuente.</p>
        <p>Usa esta sección para saber cuánto capital tienes disponible antes de comprometerte en un contrato o pool de inversión.</p>
      </InfoNote>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Landmark size={22} />} title="Sin fuentes de capital" subtitle="Agrega bancos, lenders, factoring y más." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Agregar</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <Card key={p.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 neon-border"><Landmark size={18} /></div>
                  <div>
                    <h3 className="font-semibold text-violet-100">{p.name}</h3>
                    <Badge tone="info">{p.type}</Badge>
                  </div>
                </div>
                <button onClick={() => toggleFav(p.id, p.favorite)} className={cn('transition', p.favorite ? 'text-fuchsia-400' : 'text-violet-400 hover:text-fuchsia-400')}><Star size={16} fill={p.favorite ? 'currentColor' : 'none'} /></button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-4 text-xs">
                <div><span className="text-violet-300/70">Monto min:</span> <span className="text-violet-200">{formatCurrency(p.amount_min)}</span></div>
                <div><span className="text-violet-300/70">Monto max:</span> <span className="text-violet-200">{formatCurrency(p.amount_max)}</span></div>
                <div><span className="text-violet-300/70">Interés:</span> <span className="text-violet-200">{p.interest_rate || '—'}</span></div>
                <div><span className="text-violet-300/70">Plazo:</span> <span className="text-violet-200">{p.term || '—'}</span></div>
              </div>
              {p.requirements && <p className="text-xs text-violet-300/70 mt-3 line-clamp-2">{p.requirements}</p>}
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

      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="Crear fuente de capital con AI">
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Pega el enlace de la empresa o persona y la AI extraerá la información automáticamente.</p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20">
            <Link2 size={15} className="text-fuchsia-400" />
            <input value={aiUrl} onChange={(e) => setAiUrl(e.target.value)} placeholder="https://…" className="flex-1 bg-transparent outline-none text-sm text-violet-50 placeholder:text-violet-400/40" />
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
