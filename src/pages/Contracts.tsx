import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, SectionTitle, InfoNote } from '../components/ui'
import { FileText, Plus, Search, Sparkles, Upload, Loader as Loader2, Heart } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const STATUSES = ['identificado','analizando','preparando','propuesta_enviada','evaluacion','ganado','perdido','ejecucion','entregado','facturado','pagado','cerrado']
const STATUS_LABEL: Record<string,string> = {
  identificado: 'Identificado', analizando: 'Analizando', preparando: 'Preparando propuesta',
  propuesta_enviada: 'Propuesta enviada', evaluacion: 'En evaluación', ganado: 'Ganado',
  perdido: 'Perdido', ejecucion: 'En ejecución', entregado: 'Entregado', facturado: 'Facturado',
  pagado: 'Pagado', cerrado: 'Cerrado',
}
const STATUS_TONE: Record<string,any> = {
  identificado: 'warning', analizando: 'info', preparando: 'warning', propuesta_enviada: 'info',
  evaluacion: 'neutral', ganado: 'success', perdido: 'error', ejecucion: 'info',
  entregado: 'success', facturado: 'gold', pagado: 'success', cerrado: 'neutral',
}
const PRIORITIES = ['alta', 'media', 'baja']
const CONTRACT_TYPES = ['Producto', 'Servicio', 'Construcción', 'Mixto']

function healthColor(score: number) {
  if (score >= 90) return { color: 'text-teal-400', bg: 'bg-teal-500/10', label: 'Excelente' }
  if (score >= 70) return { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Bueno' }
  if (score >= 50) return { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Moderado' }
  return { color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Alto riesgo' }
}

export function Contracts() {
  const nav = useNavigate()
  const { session } = useAuth()
  const [contracts, setContracts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [draft, setDraft] = useState<any>({ title: '', status: 'identificado', priority: 'media', type: 'Servicio' })
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [aiFile, setAiFile] = useState<File | null>(null)
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('contracts').select('*').order('created_at', { ascending: false })
    if (data) setContracts(data)
  }

  async function create() {
    const { data } = await supabase.from('contracts').insert(draft).select().single()
    setOpen(false); setDraft({ title: '', status: 'identificado', priority: 'media', type: 'Servicio' })
    if (data) nav(`/app/contracts/${data.id}`)
  }

  function set(k: string, v: any) { setDraft((d: any) => ({ ...d, [k]: v })) }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setAiFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setAiImageUrl(reader.result as string)
      reader.readAsDataURL(f)
    }
  }

  async function aiAnalyzeAndCreate() {
    if (!aiFile) return
    setAiBusy(true)
    try {
      let content: any = { question: 'Analiza este documento de contrato, extrae toda la información y crea un contrato en el sistema.' }
      if (aiFile.type.startsWith('image/')) {
        content.imageUrl = aiImageUrl
      } else if (aiFile.type === 'application/pdf') {
        const ext = aiFile.name.split('.').pop()
        const path = `contracts/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from('documents').upload(path, aiFile)
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('documents').getPublicUrl(path)
        content.fileUrl = pub.publicUrl
        content.fileType = 'pdf'
      }
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ ...content, mode: 'analyze' }),
      })
      if (!res.ok) throw new Error('Error al analizar')
      const data = await res.json()
      const extracted = data.extracted || {}
      const createRes = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ question: `Crea un contrato con estos datos: ${JSON.stringify(extracted)}`, mode: 'create' }),
      })
      if (!createRes.ok) throw new Error('Error al crear contrato')
      const createData = await createRes.json()
      if (createData.record) {
        setAiOpen(false); setAiFile(null); setAiImageUrl(null)
        load()
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setAiBusy(false)
    }
  }

  const filtered = contracts.filter((c) =>
    (filter === 'all' || c.status === filter) &&
    (c.title?.toLowerCase().includes(search.toLowerCase()) || c.agency?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-violet-100">Current Contracts</h1>
        <p className="text-sm text-violet-300/70 mt-1">Manage your active government contracts</p>
      </div>

      <InfoNote title="¿Qué es Contratos?">
        <p>Este es el centro de control de tus contratos gubernamentales. Crea contratos manualmente o sube un documento y la IA lo creará automáticamente.</p>
        <p>Filtra por estado, busca por título o agencia, y abre la ficha de cada contrato para gestionar su cumplimiento, hitos y facturas.</p>
      </InfoNote>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar contrato…" className="bg-transparent outline-none w-48 placeholder:text-violet-400/40" />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto">
            <option value="all">Todos los estados</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
          <div className="flex items-center gap-1 bg-violet-950/50 border border-violet-400/20 rounded-xl p-1">
            <button onClick={() => setView('grid')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition', view === 'grid' ? 'bg-fuchsia-500/15 text-fuchsia-200' : 'text-violet-300/70')}>Fichas</button>
            <button onClick={() => setView('table')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition', view === 'table' ? 'bg-fuchsia-500/15 text-fuchsia-200' : 'text-violet-300/70')}>Tabla</button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Crear con AI</Button>
          <Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Nuevo Contrato</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<FileText size={22} />} title="Sin contratos" subtitle="Crea tu primer contrato manualmente o sube un documento y la AI lo creará automáticamente." action={<div className="flex gap-2"><Button variant="primary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Crear con AI</Button><Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Nuevo</Button></div>} /></Card>
      ) : view === 'grid' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => <ContractCard key={c.id} contract={c} onClick={() => nav(`/app/contracts/${c.id}`)} />)}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-violet-400/15 text-left text-xs text-violet-300/70">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Agencia</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Capital req.</th>
                <th className="px-4 py-3 font-medium">Ganancia est.</th>
                <th className="px-4 py-3 font-medium">Cierre</th>
                <th className="px-4 py-3 font-medium">Entrega</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const health = healthColor(c.health_score || 0)
                return (
                  <tr key={c.id} onClick={() => nav(`/app/contracts/${c.id}`)} className="border-b border-violet-400/10 hover:bg-violet-500/5 cursor-pointer transition">
                    <td className="px-4 py-3 text-violet-100 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-violet-300/70">{c.agency || '—'}</td>
                    <td className="px-4 py-3"><Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status] || c.status}</Badge></td>
                    <td className="px-4 py-3 text-violet-100">{formatCurrency(c.total_value)}</td>
                    <td className="px-4 py-3 text-violet-200">{formatCurrency(c.capital_required)}</td>
                    <td className="px-4 py-3 text-teal-300">{formatCurrency(c.estimated_profit)}</td>
                    <td className="px-4 py-3 text-violet-300/70">{formatDate(c.due_date)}</td>
                    <td className="px-4 py-3 text-violet-300/70">{formatDate(c.delivery_date)}</td>
                    <td className="px-4 py-3 text-violet-300/70">{formatDate(c.payment_date)}</td>
                    <td className="px-4 py-3">
                      {(c.health_score || 0) > 0 ? (
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', health.bg, health.color)}>{c.health_score}</span>
                      ) : <span className="text-violet-400/50">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo contrato" wide>
        <div className="space-y-5">
          <SectionTitle title="1. Información General" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre del contrato" value={draft.title || ''} onChange={(e) => set('title', e.target.value)} />
            <Input label="Número de licitación" value={draft.solicitation_number || ''} onChange={(e) => set('solicitation_number', e.target.value)} />
            <Input label="Agencia" value={draft.agency || ''} onChange={(e) => set('agency', e.target.value)} />
            <Select label="Tipo" value={draft.type || 'Servicio'} onChange={(e) => set('type', e.target.value)}>
              {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="Estado" value={draft.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </Select>
            <Select label="Prioridad" value={draft.priority || 'media'} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </Select>
          </div>

          <SectionTitle title="2. Fechas" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha límite para ofertar" type="date" value={draft.due_date || ''} onChange={(e) => set('due_date', e.target.value)} />
            <Input label="Fecha de entrega" type="date" value={draft.delivery_date || ''} onChange={(e) => set('delivery_date', e.target.value)} />
            <Input label="Fecha estimada de pago" type="date" value={draft.payment_date || ''} onChange={(e) => set('payment_date', e.target.value)} />
            <Input label="Fecha de inicio" type="date" value={draft.start_date || ''} onChange={(e) => set('start_date', e.target.value)} />
          </div>

          <SectionTitle title="3. Información Financiera" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor estimado ($)" type="number" value={draft.total_value || ''} onChange={(e) => set('total_value', +e.target.value)} />
            <Input label="Capital requerido ($)" type="number" value={draft.capital_required || ''} onChange={(e) => set('capital_required', +e.target.value)} />
            <Input label="Costo estimado ($)" type="number" value={draft.estimated_cost || ''} onChange={(e) => set('estimated_cost', +e.target.value)} />
            <Input label="Ganancia estimada ($)" type="number" value={draft.estimated_profit || ''} onChange={(e) => set('estimated_profit', +e.target.value)} />
          </div>

          <SectionTitle title="4. Producto o Servicio" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código NAICS" value={draft.naics || ''} onChange={(e) => set('naics', e.target.value)} />
            <Input label="Código PSC" value={draft.psc || ''} onChange={(e) => set('psc', e.target.value)} />
          </div>
          <Textarea label="Descripción" value={draft.product || ''} onChange={(e) => set('product', e.target.value)} />

          <SectionTitle title="5. Notas" />
          <Textarea label="Observaciones" value={draft.notes || ''} onChange={(e) => set('notes', e.target.value)} />
          <Textarea label="Riesgos" value={draft.risk_notes || ''} onChange={(e) => set('risk_notes', e.target.value)} />
          <Textarea label="Próximos pasos" value={draft.next_steps || ''} onChange={(e) => set('next_steps', e.target.value)} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={create} disabled={!draft.title}>Crear contrato</Button>
          </div>
        </div>
      </Modal>

      <Modal open={aiOpen} onClose={() => { setAiOpen(false); setAiFile(null); setAiImageUrl(null) }} title="Crear contrato con AI" wide>
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Sube una captura de pantalla o un PDF del contrato y la AI extraerá toda la información para crearlo automáticamente.</p>
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-violet-400/30 rounded-xl p-8 text-center cursor-pointer hover:border-fuchsia-400/50 hover:bg-violet-500/5 transition">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFileSelected} />
            {aiFile ? (
              <div className="text-sm text-violet-100">
                <div className="font-medium">{aiFile.name}</div>
                <div className="text-xs text-violet-300/70">{(aiFile.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div className="text-sm text-violet-300/70">
                <Upload size={24} className="mx-auto mb-2 text-fuchsia-400" />
                Haz clic para subir una imagen o PDF del contrato
              </div>
            )}
          </div>
          {aiImageUrl && <img src={aiImageUrl} alt="Preview" className="max-h-48 rounded-xl border border-violet-400/20 mx-auto" />}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setAiOpen(false); setAiFile(null); setAiImageUrl(null) }}>Cancelar</Button>
            <Button variant="gold" onClick={aiAnalyzeAndCreate} disabled={aiBusy || !aiFile}>
              {aiBusy ? <><Loader2 size={16} className="animate-spin" /> Analizando y creando…</> : <><Sparkles size={16} /> Crear con AI</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ContractCard({ contract: c, onClick }: { contract: any; onClick: () => void }) {
  const health = healthColor(c.health_score || 0)
  return (
    <Card hover className="p-5 cursor-pointer" >
      <div onClick={onClick}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-violet-100 leading-snug">{c.title}</h3>
          <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status] || c.status}</Badge>
        </div>
        <p className="text-xs text-violet-300/70 mt-1">{c.agency || 'Sin agencia'} {c.solicitation_number && `· ${c.solicitation_number}`}</p>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div><span className="text-violet-300/70">Valor:</span> <span className="font-semibold text-violet-100">{formatCurrency(c.total_value)}</span></div>
          <div><span className="text-violet-300/70">Capital req.:</span> <span className="text-violet-200">{formatCurrency(c.capital_required)}</span></div>
          <div><span className="text-violet-300/70">Ganancia est.:</span> <span className="text-teal-300">{formatCurrency(c.estimated_profit)}</span></div>
          <div><span className="text-violet-300/70">Cierre:</span> <span className="text-violet-200">{formatDate(c.due_date)}</span></div>
        </div>
        {(c.health_score || 0) > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-violet-400/10">
            <Heart size={14} className={health.color} />
            <span className="text-xs text-violet-300/70">Health Score:</span>
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', health.bg, health.color)}>{c.health_score} · {health.label}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
