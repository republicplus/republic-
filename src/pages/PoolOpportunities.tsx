import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, SectionTitle, InfoNote } from '../components/ui'
import { Plus, Search, Pencil, Trash2, Target, Sparkles, Loader as Loader2, Link2, Layers, Users, Landmark } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import { Progress } from '../components/Progress'

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

export function PoolOpportunities() {
  const { session } = useAuth()
  const [tab, setTab] = useState<'opportunities' | 'pools'>('opportunities')

  // Opportunities state
  const [rows, setRows] = useState<Opp[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<any>({ title:'', status:'identificado', risk:'media' })
  const [aiUrl, setAiUrl] = useState('')
  const [aiBusy, setAiBusy] = useState(false)

  // Pools state
  const [pools, setPools] = useState<any[]>([])
  const [poolOpen, setPoolOpen] = useState(false)
  const [poolDraft, setPoolDraft] = useState<any>({ name: '', status: 'open', target: 0, capital_required: 0 })
  const [participations, setParticipations] = useState<Record<string, any[]>>({})

  useEffect(() => { loadOpps(); loadPools() }, [])

  async function loadOpps() {
    const { data } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false })
    if (data) setRows(data as Opp[])
  }

  async function loadPools() {
    const { data } = await supabase.from('investment_pools').select('*').order('created_at', { ascending: false })
    if (data) {
      setPools(data)
      const all: Record<string, any[]> = {}
      for (const p of data) {
        const { data: parts } = await supabase.from('pool_participations').select('*').eq('pool_id', p.id)
        all[p.id] = parts || []
      }
      setParticipations(all)
    }
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

  // Pool functions
  async function savePool() {
    if (poolDraft.id) await supabase.from('investment_pools').update(poolDraft).eq('id', poolDraft.id)
    else await supabase.from('investment_pools').insert(poolDraft)
    setPoolOpen(false); setPoolDraft({ name: '', status: 'open', target: 0, capital_required: 0 }); loadPools()
  }
  async function removePool(id: string) { await supabase.from('investment_pools').delete().eq('id', id); loadPools() }
  async function joinPool(poolId: string) {
    const amount = prompt('¿Cuánto quieres invertir?')
    if (!amount) return
    await supabase.from('pool_participations').insert({ pool_id: poolId, amount: +amount, status: 'pending' })
    loadPools()
  }

  const filtered = rows.filter((o) => (filter === 'all' || o.status === filter) && o.title?.toLowerCase().includes(search.toLowerCase()))
  const POOL_PRESETS = [50000, 100000, 250000, 500000, 1000000, 2000000, 5000000, 10000000]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-violet-100">Pool Opportunities</h1>
          <p className="text-sm text-violet-300/70 mt-1">Oportunidades de inversión y pools colectivos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('opportunities')} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition', tab === 'opportunities' ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30' : 'bg-violet-950/40 text-violet-300/70 border-violet-400/15 hover:border-fuchsia-400/30')}>
            <Target size={15} /> Oportunidades
          </button>
          <button onClick={() => setTab('pools')} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition', tab === 'pools' ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30' : 'bg-violet-950/40 text-violet-300/70 border-violet-400/15 hover:border-fuchsia-400/30')}>
            <Landmark size={15} /> Pools
          </button>
        </div>
      </div>

      <InfoNote title="¿Qué es Pool Opportunities?">
        <p>Combina dos herramientas: las Oportunidades (contratos potenciales con su valor, capital requerido y ganancia estimada) y los Pools (fondos colectivos donde varios inversionistas participan).</p>
        <p>Usa las Oportunidades para evaluar contratos antes de presentar propuesta, y los Pools para reunir capital de varios inversionistas en un solo fondo.</p>
      </InfoNote>

      {tab === 'opportunities' && (
        <>
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
        </>
      )}

      {tab === 'pools' && (
        <>
          <Card className="p-5 navy-gradient">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Layers size={20} className="text-fuchsia-400" /></div>
              <div>
                <h3 className="font-semibold text-white">Pools de Inversión</h3>
                <p className="text-sm text-violet-200">Fondos colectivos donde inversionistas pueden participar. Términos sujetos a contrato.</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="gold" onClick={() => { setPoolDraft({ name: '', status: 'open', target: 0, capital_required: 0 }); setPoolOpen(true) }}><Plus size={16} /> Nuevo Pool</Button>
          </div>

          {pools.length === 0 ? (
            <Card><EmptyState icon={<Layers size={22} />} title="Sin pools" subtitle="Abre fondos de inversión para que inversionistas participen." action={<Button variant="gold" onClick={() => setPoolOpen(true)}><Plus size={16} /> Crear pool</Button>} /></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {pools.map((p) => {
                const parts = participations[p.id] || []
                const pct = p.capital_required > 0 ? Math.min(100, Math.round((p.capital_raised / p.capital_required) * 100)) : 0
                return (
                  <Card key={p.id} hover className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-violet-100 text-lg">{p.name}</h3>
                        {p.target && <p className="text-xs text-violet-300/70">Objetivo: {formatCurrency(p.target)}</p>}
                      </div>
                      <Badge tone={p.status === 'open' ? 'success' : 'neutral'}>{p.status}</Badge>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-violet-300/70 mb-1.5">
                        <span>{formatCurrency(p.capital_raised)} recaudado</span>
                        <span>{formatCurrency(p.capital_required)} meta</span>
                      </div>
                      <Progress value={pct} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                      <div><span className="text-violet-300/70">Participantes:</span> <span className="text-violet-200">{p.participants || parts.length}</span></div>
                      <div><span className="text-violet-300/70">Cierre:</span> <span className="text-violet-200">{formatDate(p.close_date)}</span></div>
                      <div><span className="text-violet-300/70">Retorno est.:</span> <span className="text-violet-200">{p.estimated_return || 'Si aplica'}</span></div>
                      <div><span className="text-violet-300/70">Estructura:</span> <span className="text-violet-200">{p.participation_structure || 'Sujeto a contrato'}</span></div>
                    </div>
                    {p.terms && <p className="text-xs text-violet-300/70 mt-3 line-clamp-2">{p.terms}</p>}
                    <div className="flex gap-2 mt-4">
                      <Button variant="gold" size="sm" onClick={() => joinPool(p.id)}><Users size={13} /> Solicitar ingreso</Button>
                      <Button variant="secondary" size="sm" onClick={() => { setPoolDraft(p); setPoolOpen(true) }}><Pencil size={13} /> Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => removePool(p.id)}><Trash2 size={13} /></Button>
                    </div>
                    {parts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-violet-400/15">
                        <div className="text-xs font-medium text-violet-300/70 mb-2">Participaciones ({parts.length})</div>
                        <div className="space-y-1">
                          {parts.map((part) => (
                            <div key={part.id} className="flex justify-between text-xs">
                              <span className="text-violet-200">{formatCurrency(part.amount)}</span>
                              <Badge tone={part.status === 'approved' ? 'success' : 'warning'}>{part.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Opportunity Modal */}
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

      {/* AI Modal */}
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

      {/* Pool Modal */}
      <Modal open={poolOpen} onClose={() => setPoolOpen(false)} title={poolDraft.id ? 'Editar pool' : 'Nuevo pool'} wide>
        <div className="space-y-4">
          <SectionTitle title="Configuración del pool" />
          <Input label="Nombre" value={poolDraft.name || ''} onChange={(e) => setPoolDraft((d:any) => ({ ...d, name: e.target.value }))} />
          <div>
            <span className="block text-xs font-medium text-violet-300/70 mb-1.5">Presets de capital</span>
            <div className="flex flex-wrap gap-2">
              {POOL_PRESETS.map((v) => (
                <button key={v} type="button" onClick={() => setPoolDraft((d:any) => ({ ...d, capital_required: v, target: v }))}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition', poolDraft.capital_required === v ? 'bg-violet-900 text-white border-violet-500' : 'bg-violet-950/40 text-violet-200 border-violet-400/20 hover:border-fuchsia-400/40')}>
                  {formatCurrency(v)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capital requerido ($)" type="number" value={poolDraft.capital_required || ''} onChange={(e) => setPoolDraft((d:any) => ({ ...d, capital_required: +e.target.value }))} />
            <Input label="Capital recaudado ($)" type="number" value={poolDraft.capital_raised || ''} onChange={(e) => setPoolDraft((d:any) => ({ ...d, capital_raised: +e.target.value }))} />
            <Input label="Objetivo ($)" type="number" value={poolDraft.target || ''} onChange={(e) => setPoolDraft((d:any) => ({ ...d, target: +e.target.value }))} />
            <Input label="Fecha de cierre" type="date" value={poolDraft.close_date || ''} onChange={(e) => setPoolDraft((d:any) => ({ ...d, close_date: e.target.value }))} />
            <Input label="Retorno estimado (si aplica)" value={poolDraft.estimated_return || ''} onChange={(e) => setPoolDraft((d:any) => ({ ...d, estimated_return: e.target.value }))} />
            <Input label="Estructura de participación" value={poolDraft.participation_structure || ''} onChange={(e) => setPoolDraft((d:any) => ({ ...d, participation_structure: e.target.value }))} placeholder="Sujeto a contrato" />
          </div>
          <Textarea label="Términos" value={poolDraft.terms || ''} onChange={(e) => setPoolDraft((d:any) => ({ ...d, terms: e.target.value }))} />
          <Textarea label="Documentos" value={poolDraft.documents || ''} onChange={(e) => setPoolDraft((d:any) => ({ ...d, documents: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPoolOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={savePool} disabled={!poolDraft.name}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
