import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Badge, Modal, EmptyState, SectionTitle } from '../components/ui'
import { Plus, Layers, Trash2, Pencil, Users } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import { Progress } from '../components/Progress'

export function Pools() {
  const [pools, setPools] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<any>({ name: '', status: 'open', target: 0, capital_required: 0 })
  const [participations, setParticipations] = useState<Record<string, any[]>>({})

  useEffect(() => { load() }, [])
  async function load() {
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
  async function save() {
    if (draft.id) await supabase.from('investment_pools').update(draft).eq('id', draft.id)
    else await supabase.from('investment_pools').insert(draft)
    setOpen(false); setDraft({ name: '', status: 'open', target: 0, capital_required: 0 }); load()
  }
  async function remove(id: string) { await supabase.from('investment_pools').delete().eq('id', id); load() }
  async function join(poolId: string) {
    const amount = prompt('¿Cuánto quieres invertir?')
    if (!amount) return
    await supabase.from('pool_participations').insert({ pool_id: poolId, amount: +amount, status: 'pending' })
    load()
  }

  const POOL_PRESETS = [50000, 100000, 250000, 500000, 1000000, 2000000, 5000000, 10000000]

  return (
    <div className="space-y-6">
      <Card className="p-5 navy-gradient">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Layers size={20} className="text-gold-400" /></div>
          <div>
            <h3 className="font-semibold text-white">Pools de Inversión</h3>
            <p className="text-sm text-navy-200">Fondos colectivos donde inversionistas pueden participar. Términos sujetos a contrato.</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="gold" onClick={() => { setDraft({ name: '', status: 'open', target: 0, capital_required: 0 }); setOpen(true) }}><Plus size={16} /> Nuevo Pool</Button>
      </div>

      {pools.length === 0 ? (
        <Card><EmptyState icon={<Layers size={22} />} title="Sin pools" subtitle="Abre fondos de inversión para que inversionistas participen." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Crear pool</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {pools.map((p) => {
            const parts = participations[p.id] || []
            const pct = p.capital_required > 0 ? Math.min(100, Math.round((p.capital_raised / p.capital_required) * 100)) : 0
            return (
              <Card key={p.id} hover className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-navy-900 text-lg">{p.name}</h3>
                    {p.target && <p className="text-xs text-muted">Objetivo: {formatCurrency(p.target)}</p>}
                  </div>
                  <Badge tone={p.status === 'open' ? 'success' : 'neutral'}>{p.status}</Badge>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted mb-1.5">
                    <span>{formatCurrency(p.capital_raised)} recaudado</span>
                    <span>{formatCurrency(p.capital_required)} meta</span>
                  </div>
                  <Progress value={pct} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div><span className="text-muted">Participantes:</span> <span className="text-navy-800">{p.participants || parts.length}</span></div>
                  <div><span className="text-muted">Cierre:</span> <span className="text-navy-800">{formatDate(p.close_date)}</span></div>
                  <div><span className="text-muted">Retorno est.:</span> <span className="text-navy-800">{p.estimated_return || 'Si aplica'}</span></div>
                  <div><span className="text-muted">Estructura:</span> <span className="text-navy-800">{p.participation_structure || 'Sujeto a contrato'}</span></div>
                </div>
                {p.terms && <p className="text-xs text-muted mt-3 line-clamp-2">{p.terms}</p>}
                <div className="flex gap-2 mt-4">
                  <Button variant="gold" size="sm" onClick={() => join(p.id)}><Users size={13} /> Solicitar ingreso</Button>
                  <Button variant="secondary" size="sm" onClick={() => { setDraft(p); setOpen(true) }}><Pencil size={13} /> Editar</Button>
                  <Button variant="danger" size="sm" onClick={() => remove(p.id)}><Trash2 size={13} /></Button>
                </div>
                {parts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-line">
                    <div className="text-xs font-medium text-muted mb-2">Participaciones ({parts.length})</div>
                    <div className="space-y-1">
                      {parts.map((part) => (
                        <div key={part.id} className="flex justify-between text-xs">
                          <span className="text-navy-800">{formatCurrency(part.amount)}</span>
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

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? 'Editar pool' : 'Nuevo pool'} wide>
        <div className="space-y-4">
          <SectionTitle title="Configuración del pool" />
          <Input label="Nombre" value={draft.name || ''} onChange={(e) => setDraft((d:any) => ({ ...d, name: e.target.value }))} />
          <div>
            <span className="block text-xs font-medium text-muted mb-1.5">Presets de capital</span>
            <div className="flex flex-wrap gap-2">
              {POOL_PRESETS.map((v) => (
                <button key={v} type="button" onClick={() => setDraft((d:any) => ({ ...d, capital_required: v, target: v }))}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition', draft.capital_required === v ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-navy-700 border-line hover:border-navy-200')}>
                  {formatCurrency(v)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capital requerido ($)" type="number" value={draft.capital_required || ''} onChange={(e) => setDraft((d:any) => ({ ...d, capital_required: +e.target.value }))} />
            <Input label="Capital recaudado ($)" type="number" value={draft.capital_raised || ''} onChange={(e) => setDraft((d:any) => ({ ...d, capital_raised: +e.target.value }))} />
            <Input label="Objetivo ($)" type="number" value={draft.target || ''} onChange={(e) => setDraft((d:any) => ({ ...d, target: +e.target.value }))} />
            <Input label="Fecha de cierre" type="date" value={draft.close_date || ''} onChange={(e) => setDraft((d:any) => ({ ...d, close_date: e.target.value }))} />
            <Input label="Retorno estimado (si aplica)" value={draft.estimated_return || ''} onChange={(e) => setDraft((d:any) => ({ ...d, estimated_return: e.target.value }))} />
            <Input label="Estructura de participación" value={draft.participation_structure || ''} onChange={(e) => setDraft((d:any) => ({ ...d, participation_structure: e.target.value }))} placeholder="Sujeto a contrato" />
          </div>
          <Textarea label="Términos" value={draft.terms || ''} onChange={(e) => setDraft((d:any) => ({ ...d, terms: e.target.value }))} />
          <Textarea label="Documentos" value={draft.documents || ''} onChange={(e) => setDraft((d:any) => ({ ...d, documents: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={save} disabled={!draft.name}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
