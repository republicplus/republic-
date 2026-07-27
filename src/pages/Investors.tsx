import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, SectionTitle, InfoNote } from '../components/ui'
import { Plus, Users, Trash2, Pencil, Search, ArrowRight, Sparkles } from 'lucide-react'
import { cn, formatCurrency, formatDate, initials } from '../lib/utils'
import { useAICreate } from '../lib/useAICreate'

const SPLIT_MODELS = ['50/50','60/40','70/30','80/20','Personalizado']
const RISK_LEVELS = ['Bajo','Medio','Alto']
const OPP_STATUS: Record<string, any> = { open: 'info', funded: 'success', closed: 'neutral' }

export function Investors() {
  const [tab, setTab] = useState<'crm'|'opportunities'>('crm')
  const [investors, setInvestors] = useState<any[]>([])
  const [opps, setOpps] = useState<any[]>([])
  const [openInv, setOpenInv] = useState(false)
  const [openOpp, setOpenOpp] = useState(false)
  const [draftInv, setDraftInv] = useState<any>({ first_name: '', last_name: '', status: 'active' })
  const [draftOpp, setDraftOpp] = useState<any>({ title: '', split_model: '50/50', risk: 'Medio', status: 'open' })
  const [search, setSearch] = useState('')
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const { create, busy } = useAICreate()

  useEffect(() => { load() }, [])
  async function load() {
    const { data: i } = await supabase.from('investors').select('*').order('created_at', { ascending: false })
    if (i) setInvestors(i)
    const { data: o } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false })
    if (o) setOpps(o)
  }
  async function saveInv() {
    if (draftInv.id) await supabase.from('investors').update(draftInv).eq('id', draftInv.id)
    else await supabase.from('investors').insert(draftInv)
    setOpenInv(false); setDraftInv({ first_name: '', last_name: '', status: 'active' }); load()
  }
  async function saveOpp() {
    if (draftOpp.id) await supabase.from('opportunities').update(draftOpp).eq('id', draftOpp.id)
    else await supabase.from('opportunities').insert(draftOpp)
    setOpenOpp(false); setDraftOpp({ title: '', split_model: '50/50', risk: 'Medio', status: 'open' }); load()
  }
  async function removeInv(id: string) { await supabase.from('investors').delete().eq('id', id); load() }
  async function removeOpp(id: string) { await supabase.from('opportunities').delete().eq('id', id); load() }

  async function aiCreate() {
    if (!aiPrompt.trim()) return
    const result = await create(aiPrompt)
    if (result.ok) { setAiOpen(false); setAiPrompt(''); load() }
  }

  const filteredInv = investors.filter((i) => `${i.first_name} ${i.last_name}`.toLowerCase().includes(search.toLowerCase()) || i.email?.toLowerCase().includes(search.toLowerCase()))
  const totalAvailable = investors.reduce((s, i) => s + (i.available_capital || 0), 0)

  return (
    <div className="space-y-6">
      <InfoNote title="¿Qué es Inversionistas?">
        <p>Gestiona tu red de inversionistas y las oportunidades de inversión que les ofreces. En CRM registras cada inversionista con su capital disponible e intereses.</p>
        <p>En Oportunidades publicas licitaciones pendientes de adjudicación para que los inversionistas apliquen con un modelo de reparto definido.</p>
      </InfoNote>
      <div className="flex items-center gap-1 border-b border-violet-400/15">
        {(['crm','opportunities'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition', tab === t ? 'border-fuchsia-400 text-fuchsia-200' : 'border-transparent text-violet-300/70 hover:text-violet-100')}>
            {t === 'crm' ? 'CRM de Inversionistas' : 'Oportunidades de Inversión'}
          </button>
        ))}
      </div>

      {tab === 'crm' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
                <Search size={15} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar inversionista…" className="bg-transparent outline-none w-44 placeholder:text-violet-400/40" />
              </div>
              <Badge tone="gold">Capital total: {formatCurrency(totalAvailable)}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Crear con AI</Button>
              <Button variant="gold" onClick={() => { setDraftInv({ first_name: '', last_name: '', status: 'active' }); setOpenInv(true) }}><Plus size={16} /> Nuevo Inversionista</Button>
            </div>
          </div>

          {filteredInv.length === 0 ? (
            <Card><EmptyState icon={<Users size={22} />} title="Sin inversionistas" subtitle="Crea tu base de datos de inversionistas con capital disponible, intereses y estado." action={<Button variant="gold" onClick={() => setOpenInv(true)}><Plus size={16} /> Agregar</Button>} /></Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredInv.map((inv) => (
                <Card key={inv.id} hover className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl navy-gradient flex items-center justify-center text-violet-100 text-sm font-semibold neon-border">{initials(inv.first_name, inv.last_name)}</div>
                      <div>
                        <h3 className="font-semibold text-violet-100">{inv.first_name} {inv.last_name}</h3>
                        <p className="text-xs text-violet-300/70">{inv.email || '—'}</p>
                      </div>
                    </div>
                    <Badge tone={inv.status === 'active' ? 'success' : 'neutral'}>{inv.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-4 text-xs">
                    <div><span className="text-violet-300/70">Capital:</span> <span className="font-semibold text-violet-100">{formatCurrency(inv.available_capital)}</span></div>
                    <div><span className="text-violet-300/70">Máximo:</span> <span className="text-violet-200">{formatCurrency(inv.max_capital)}</span></div>
                    <div><span className="text-violet-300/70">Tel:</span> <span className="text-violet-200">{inv.phone || '—'}</span></div>
                    <div><span className="text-violet-300/70">Empresa:</span> <span className="text-violet-200">{inv.company || '—'}</span></div>
                  </div>
                  {inv.interests && <p className="text-xs text-violet-300/70 mt-3 line-clamp-2">{inv.interests}</p>}
                  <div className="flex gap-2 mt-4">
                    <Button variant="secondary" size="sm" onClick={() => { setDraftInv(inv); setOpenInv(true) }}><Pencil size={13} /> Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => removeInv(inv.id)}><Trash2 size={13} /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'opportunities' && (
        <>
          <div className="flex justify-end">
            <Button variant="gold" onClick={() => { setDraftOpp({ title: '', split_model: '50/50', risk: 'Medio', status: 'open' }); setOpenOpp(true) }}><Plus size={16} /> Publicar Oportunidad</Button>
          </div>

          {opps.length === 0 ? (
            <Card><EmptyState icon={<ArrowRight size={22} />} title="Sin oportunidades" subtitle="Publica licitaciones pendientes de adjudicación para que inversionistas apliquen." action={<Button variant="gold" onClick={() => setOpenOpp(true)}><Plus size={16} /> Publicar</Button>} /></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {opps.map((o) => (
                <Card key={o.id} hover className="p-6">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-violet-100 text-lg">{o.title}</h3>
                    <Badge tone={OPP_STATUS[o.status] || 'neutral'}>{o.status}</Badge>
                  </div>
                  {o.description && <p className="text-sm text-violet-300/70 mt-2">{o.description}</p>}
                  <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                    <div><span className="text-violet-300/70 text-xs">Valor total:</span> <div className="font-semibold text-violet-100">{formatCurrency(o.total_value)}</div></div>
                    <div><span className="text-violet-300/70 text-xs">Capital requerido:</span> <div className="font-semibold text-violet-100">{formatCurrency(o.capital_required)}</div></div>
                    <div><span className="text-violet-300/70 text-xs">Reparto:</span> <div className="text-violet-200">{o.split_model}</div></div>
                    <div><span className="text-violet-300/70 text-xs">Riesgo:</span> <div><Badge tone={o.risk === 'Bajo' ? 'success' : o.risk === 'Alto' ? 'error' : 'warning'}>{o.risk}</Badge></div></div>
                    <div><span className="text-violet-300/70 text-xs">Adjudicación:</span> <div className="text-violet-200">{formatDate(o.expected_award_date)}</div></div>
                    <div><span className="text-violet-300/70 text-xs">Retorno est.:</span> <div className="text-violet-200">{o.estimated_return_time || '—'}</div></div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <Button variant="gold" size="sm">Aplicar para invertir</Button>
                    <Button variant="secondary" size="sm" onClick={() => { setDraftOpp(o); setOpenOpp(true) }}><Pencil size={13} /> Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => removeOpp(o.id)}><Trash2 size={13} /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={openInv} onClose={() => setOpenInv(false)} title={draftInv.id ? 'Editar inversionista' : 'Nuevo inversionista'} wide>
        <div className="space-y-4">
          <SectionTitle title="Datos del inversionista" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={draftInv.first_name || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, first_name: e.target.value }))} />
            <Input label="Apellido" value={draftInv.last_name || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, last_name: e.target.value }))} />
            <Input label="Teléfono" value={draftInv.phone || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, phone: e.target.value }))} />
            <Input label="WhatsApp" value={draftInv.whatsapp || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, whatsapp: e.target.value }))} />
            <Input label="Email" value={draftInv.email || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, email: e.target.value }))} />
            <Input label="Empresa" value={draftInv.company || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, company: e.target.value }))} />
            <Input label="Dirección" value={draftInv.address || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, address: e.target.value }))} />
            <Select label="Estado" value={draftInv.status} onChange={(e) => setDraftInv((d:any) => ({ ...d, status: e.target.value }))}>
              <option value="active">Activo</option>
              <option value="pending">Pendiente</option>
              <option value="inactive">Inactivo</option>
            </Select>
            <Input label="Capital disponible ($)" type="number" value={draftInv.available_capital || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, available_capital: +e.target.value }))} />
            <Input label="Capital máximo ($)" type="number" value={draftInv.max_capital || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, max_capital: +e.target.value }))} />
          </div>
          <Textarea label="Intereses" value={draftInv.interests || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, interests: e.target.value }))} />
          <Textarea label="Notas" value={draftInv.notes || ''} onChange={(e) => setDraftInv((d:any) => ({ ...d, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpenInv(false)}>Cancelar</Button>
            <Button variant="gold" onClick={saveInv}>Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={openOpp} onClose={() => setOpenOpp(false)} title={draftOpp.id ? 'Editar oportunidad' : 'Publicar oportunidad'} wide>
        <div className="space-y-4">
          <Input label="Título" value={draftOpp.title || ''} onChange={(e) => setDraftOpp((d:any) => ({ ...d, title: e.target.value }))} />
          <Textarea label="Descripción" value={draftOpp.description || ''} onChange={(e) => setDraftOpp((d:any) => ({ ...d, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Producto" value={draftOpp.product || ''} onChange={(e) => setDraftOpp((d:any) => ({ ...d, product: e.target.value }))} />
            <Input label="Servicio" value={draftOpp.service || ''} onChange={(e) => setDraftOpp((d:any) => ({ ...d, service: e.target.value }))} />
            <Input label="Valor total ($)" type="number" value={draftOpp.total_value || ''} onChange={(e) => setDraftOpp((d:any) => ({ ...d, total_value: +e.target.value }))} />
            <Input label="Capital requerido ($)" type="number" value={draftOpp.capital_required || ''} onChange={(e) => setDraftOpp((d:any) => ({ ...d, capital_required: +e.target.value }))} />
            <Input label="Fecha adjudicación" type="date" value={draftOpp.expected_award_date || ''} onChange={(e) => setDraftOpp((d:any) => ({ ...d, expected_award_date: e.target.value }))} />
            <Input label="Tiempo retorno est." value={draftOpp.estimated_return_time || ''} onChange={(e) => setDraftOpp((d:any) => ({ ...d, estimated_return_time: e.target.value }))} placeholder="Ej. 90 días" />
            <Select label="Modelo de reparto" value={draftOpp.split_model} onChange={(e) => setDraftOpp((d:any) => ({ ...d, split_model: e.target.value }))}>
              {SPLIT_MODELS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Riesgo" value={draftOpp.risk} onChange={(e) => setDraftOpp((d:any) => ({ ...d, risk: e.target.value }))}>
              {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
            <Input label="Ganancia estimada ($)" type="number" value={draftOpp.estimated_profit || ''} onChange={(e) => setDraftOpp((d:any) => ({ ...d, estimated_profit: +e.target.value }))} />
            <Input label="Detalle del reparto" value={draftOpp.split_detail || ''} onChange={(e) => setDraftOpp((d:any) => ({ ...d, split_detail: e.target.value }))} placeholder="Quién recibe mayor %" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpenOpp(false)}>Cancelar</Button>
            <Button variant="gold" onClick={saveOpp} disabled={!draftOpp.title}>Publicar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="Crear inversionista con AI">
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Describe al inversionista y la AI lo creará automáticamente.</p>
          <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Ej: Crea un inversionista llamado Juan Pérez, email juan@email.com, capital disponible 500000, intereses en contratos federales" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAiOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={aiCreate} disabled={busy || !aiPrompt.trim()}>{busy ? 'Creando…' : 'Crear con AI'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
