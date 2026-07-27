import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, SectionTitle } from '../components/ui'
import { Sparkles, Loader as Loader2, Upload, FileText, Search, Filter, Eye, Download, Save, Send, Plus, Trash2, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Circle as XCircle, CircleHelp as HelpCircle } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const STATUS = ['nuevo','analizando','cotizado','enviado','ganado','perdido']
const STATUS_LABEL: Record<string,string> = { nuevo:'Nuevo', analizando:'En análisis', cotizado:'Cotizado', enviado:'Enviado', ganado:'Ganado', perdido:'Perdido' }
const STATUS_TONE: Record<string,any> = { nuevo:'neutral', analizando:'info', cotizado:'gold', enviado:'info', ganado:'success', perdido:'error' }
const COMPLIANCE_TONE: Record<string,any> = { cumple:'success', cumple_parcial:'warning', no_cumple:'error', revision:'info' }
const COMPLIANCE_LABEL: Record<string,string> = { cumple:'Cumple', cumple_parcial:'Cumple parcialmente', no_cumple:'No cumple', revision:'Revisión manual' }

type Flow = {
  id: string; contract_name: string | null; contract_type: string; status: string
  input_text: string | null; extracted_data: any; suppliers_data: any; cost_analysis: any
  compliance_data: any; quote_data: any; recommended_price: number | null
  estimated_cost: number | null; estimated_profit: number | null; margin: number | null
  compliance_level: string | null; close_date: string | null; created_at: string
}

export function ContractFlow() {
  const { session } = useAuth()
  const [flows, setFlows] = useState<Flow[]>([])
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('all')
  const [fType, setFType] = useState('all')
  const [fCompliance, setFCompliance] = useState('all')
  const [newOpen, setNewOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Flow | null>(null)
  const [busy, setBusy] = useState(false)
  const [inputText, setInputText] = useState('')
  const [inputType, setInputType] = useState('producto')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('contract_flows').select('*').order('created_at', { ascending: false })
    if (data) setFlows(data as Flow[])
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setImageUrl(reader.result as string)
      reader.readAsDataURL(f)
    } else if (f.type === 'application/pdf') {
      const ext = f.name.split('.').pop()
      const path = `flow-uploads/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('documents').upload(path, f)
      if (!error) {
        const { data: pub } = supabase.storage.from('documents').getPublicUrl(path)
        setImageUrl(pub.publicUrl)
      }
    }
  }

  async function analyze() {
    if (!inputText.trim() && !imageUrl) return
    setBusy(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token}` },
        body: JSON.stringify({ mode: 'flow', question: inputText, imageUrl, flowType: inputType }),
      })
      if (!res.ok) throw new Error('Error al analizar')
      const data = await res.json()
      const ca = data.cost_analysis || {}
      const insertPayload = {
        contract_name: data.extracted?.contract_name || 'Nuevo análisis',
        contract_type: inputType,
        status: 'cotizado',
        input_text: inputText,
        extracted_data: data.extracted || {},
        suppliers_data: data.suppliers || [],
        cost_analysis: ca,
        compliance_data: data.compliance || {},
        quote_data: {},
        recommended_price: ca.recommended_price || null,
        estimated_cost: ca.total_cost || null,
        estimated_profit: ca.estimated_profit || null,
        margin: ca.margin_percent || null,
        compliance_level: data.compliance?.level || null,
      }
      const { data: inserted } = await supabase.from('contract_flows').insert(insertPayload).select().single()
      if (inserted) {
        setFlows((f) => [inserted as Flow, ...f])
        setDetail(inserted as Flow)
        setDetailOpen(true)
        setNewOpen(false); setInputText(''); setImageUrl(null); setFileName(null)
      }
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setBusy(false) }
  }

  async function remove(id: string) {
    await supabase.from('contract_flows').delete().eq('id', id)
    setFlows((f) => f.filter((x) => x.id !== id))
  }

  function downloadQuote(flow: Flow) {
    const e = flow.extracted_data || {}
    const ca = flow.cost_analysis || {}
    const comp = flow.compliance_data || {}
    const lines = [
      `COTIZACIÓN - ARCA BID`,
      `Fecha: ${formatDate(flow.created_at)}`,
      ``,
      `Contrato: ${flow.contract_name || 'N/A'}`,
      `Agencia: ${e.agency || 'N/A'}`,
      `Tipo: ${flow.contract_type}`,
      ``,
      `PRODUCTO / SERVICIO`,
      `Nombre: ${e.product_name || e.service_type || 'N/A'}`,
      `Cantidad: ${e.quantity || 'N/A'}`,
      `Especificaciones: ${e.specifications || e.service_description || 'N/A'}`,
      ``,
      `ANÁLISIS DE COSTOS`,
      ...(ca.items || []).map((i: any) => `${i.label}: ${formatCurrency(i.amount)}`),
      `Costo total: ${formatCurrency(ca.total_cost)}`,
      `Margen: ${ca.margin_percent || flow.margin || 0}%`,
      `Precio recomendado: ${formatCurrency(ca.recommended_price || flow.recommended_price)}`,
      `Ganancia estimada: ${formatCurrency(ca.estimated_profit || flow.estimated_profit)}`,
      ``,
      `CUMPLIMIENTO`,
      `Nivel: ${COMPLIANCE_LABEL[flow.compliance_level || ''] || flow.compliance_level || 'N/A'}`,
      `Notas de riesgo: ${comp.risk_notes || 'N/A'}`,
      ``,
      `RESUMEN`,
      flow.extracted_data?.summary || '',
    ].join('\n')
    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `cotizacion-${flow.contract_name || 'arcafloid'}.txt`; a.click()
  }

  const filtered = flows.filter((f) =>
    (fStatus === 'all' || f.status === fStatus) &&
    (fType === 'all' || f.contract_type === fType) &&
    (fCompliance === 'all' || f.compliance_level === fCompliance) &&
    f.contract_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-violet-100">Automatic Contract Flow</h1>
        <p className="text-sm text-violet-300/70 mt-1">Sube un contrato, texto o screenshot y la IA analiza producto, proveedores, costos, cumplimiento y genera una cotización</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar análisis…" className="bg-transparent outline-none w-44 placeholder:text-violet-400/40" />
          </div>
          <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-auto">
            <option value="all">Todos los estados</option>
            {STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
          <Select value={fType} onChange={(e) => setFType(e.target.value)} className="w-auto">
            <option value="all">Todos los tipos</option>
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
            <option value="mixto">Mixto</option>
          </Select>
          <Select value={fCompliance} onChange={(e) => setFCompliance(e.target.value)} className="w-auto">
            <option value="all">Todo cumplimiento</option>
            <option value="cumple">Cumple</option>
            <option value="cumple_parcial">Cumple parcial</option>
            <option value="no_cumple">No cumple</option>
            <option value="revision">Revisión</option>
          </Select>
        </div>
        <Button variant="gold" onClick={() => setNewOpen(true)}><Sparkles size={16} /> Analyze Contract</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<FileText size={22} />} title="Sin análisis" subtitle="Sube un contrato, texto o screenshot y la IA hará el análisis completo." action={<Button variant="gold" onClick={() => setNewOpen(true)}><Sparkles size={16} /> Analyze Contract</Button>} /></Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-violet-400/15 text-left text-xs text-violet-300/70">
                <th className="px-4 py-3 font-medium">Contrato</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Costo est.</th>
                <th className="px-4 py-3 font-medium">Precio rec.</th>
                <th className="px-4 py-3 font-medium">Ganancia</th>
                <th className="px-4 py-3 font-medium">Margen</th>
                <th className="px-4 py-3 font-medium">Cumplimiento</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-violet-400/10 hover:bg-violet-500/5 transition">
                  <td className="px-4 py-3 text-violet-100 font-medium">{f.contract_name || 'Sin nombre'}</td>
                  <td className="px-4 py-3"><Badge tone={f.contract_type === 'producto' ? 'info' : f.contract_type === 'servicio' ? 'gold' : 'neutral'}>{f.contract_type}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={STATUS_TONE[f.status]}>{STATUS_LABEL[f.status] || f.status}</Badge></td>
                  <td className="px-4 py-3 text-violet-200">{formatCurrency(f.estimated_cost)}</td>
                  <td className="px-4 py-3 text-violet-100">{formatCurrency(f.recommended_price)}</td>
                  <td className="px-4 py-3 text-teal-300">{formatCurrency(f.estimated_profit)}</td>
                  <td className="px-4 py-3 text-violet-200">{f.margin != null ? `${f.margin}%` : '—'}</td>
                  <td className="px-4 py-3">{f.compliance_level ? <Badge tone={COMPLIANCE_TONE[f.compliance_level]}>{COMPLIANCE_LABEL[f.compliance_level] || f.compliance_level}</Badge> : <span className="text-violet-400/50">—</span>}</td>
                  <td className="px-4 py-3 text-violet-300/70">{formatDate(f.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setDetail(f); setDetailOpen(true) }} className="p-1 text-violet-300 hover:text-fuchsia-400 transition"><Eye size={14} /></button>
                      <button onClick={() => downloadQuote(f)} className="p-1 text-violet-300 hover:text-fuchsia-400 transition"><Download size={14} /></button>
                      <button onClick={() => remove(f.id)} className="p-1 text-violet-300 hover:text-rose-400 transition"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* New analysis modal */}
      <Modal open={newOpen} onClose={() => { setNewOpen(false); setInputText(''); setImageUrl(null); setFileName(null) }} title="Analyze Contract" wide>
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Sube un PDF, screenshot, pega el texto del contrato y la IA extraerá producto/servicio, buscará proveedores, calculará costos, validará cumplimiento y generará una cotización.</p>
          <Select label="Tipo de contrato" value={inputType} onChange={(e) => setInputType(e.target.value)}>
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
            <option value="mixto">Producto + Servicio</option>
          </Select>
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-violet-400/30 rounded-xl p-6 text-center cursor-pointer hover:border-fuchsia-400/50 hover:bg-violet-500/5 transition">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFileSelected} />
            {fileName ? (
              <div className="text-sm text-violet-100"><div className="font-medium">{fileName}</div></div>
            ) : (
              <div className="text-sm text-violet-300/70"><Upload size={20} className="mx-auto mb-2 text-fuchsia-400" />Subir PDF o imagen del contrato</div>
            )}
          </div>
          {imageUrl && imageUrl.startsWith('data:') && <img src={imageUrl} alt="Preview" className="max-h-40 rounded-xl border border-violet-400/20 mx-auto" />}
          <Textarea label="O pega el texto del contrato" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Pega aquí el texto del RFQ, bid o contrato…" className="min-h-[150px]" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setNewOpen(false); setInputText(''); setImageUrl(null); setFileName(null) }}>Cancelar</Button>
            <Button variant="gold" onClick={analyze} disabled={busy || (!inputText.trim() && !imageUrl)}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> Analizando…</> : <><Sparkles size={16} /> Analyze Contract</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle del análisis" wide>
        {detail && (
          <div className="space-y-6">
            {/* Extracted */}
            <div>
              <SectionTitle title="Producto / Servicio identificado" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(detail.extracted_data || {}).filter(([,v]) => v && v !== '' && v !== false).map(([k,v]) => (
                  <div key={k}><span className="text-violet-300/70">{k.replace(/_/g,' ')}:</span> <span className="text-violet-100">{String(v)}</span></div>
                ))}
              </div>
            </div>

            {/* Suppliers */}
            {Array.isArray(detail.suppliers_data) && detail.suppliers_data.length > 0 && (
              <div>
                <SectionTitle title="Comparador de proveedores" />
                <div className="space-y-2">
                  {detail.suppliers_data.map((s: any, i: number) => (
                    <div key={i} className="px-4 py-3 rounded-xl border border-violet-400/15">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-violet-100">{s.name || 'Proveedor'}</div>
                        {s.recommendation && <Badge tone="gold">{s.recommendation}</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        {s.product && <div><span className="text-violet-300/70">Producto:</span> <span className="text-violet-200">{s.product}</span></div>}
                        {s.unit_price != null && <div><span className="text-violet-300/70">Precio unit.:</span> <span className="text-violet-200">{formatCurrency(s.unit_price)}</span></div>}
                        {s.availability && <div><span className="text-violet-300/70">Disponibilidad:</span> <span className="text-violet-200">{s.availability}</span></div>}
                        {s.delivery_time && <div><span className="text-violet-300/70">Entrega:</span> <span className="text-violet-200">{s.delivery_time}</span></div>}
                        {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="text-fuchsia-300 col-span-2">Ver producto</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost analysis */}
            {detail.cost_analysis && Object.keys(detail.cost_analysis).length > 0 && (
              <div>
                <SectionTitle title="Análisis de costos" />
                <div className="space-y-2">
                  {(detail.cost_analysis.items || []).map((i: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2 rounded-xl border border-violet-400/15 text-sm">
                      <span className="text-violet-200">{i.label}</span>
                      <span className="text-violet-100">{formatCurrency(i.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-sm">
                    <span className="text-rose-200 font-medium">Costo total</span>
                    <span className="text-rose-100 font-bold">{formatCurrency(detail.cost_analysis.total_cost || detail.estimated_cost)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-teal-500/10 border border-teal-400/20 text-sm">
                    <span className="text-teal-200 font-medium">Precio recomendado</span>
                    <span className="text-teal-100 font-bold">{formatCurrency(detail.cost_analysis.recommended_price || detail.recommended_price)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/20 text-sm">
                    <span className="text-fuchsia-200 font-medium">Ganancia estimada</span>
                    <span className="text-fuchsia-100 font-bold">{formatCurrency(detail.cost_analysis.estimated_profit || detail.estimated_profit)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance */}
            {detail.compliance_data && Object.keys(detail.compliance_data).length > 0 && (
              <div>
                <SectionTitle title="Verificación de cumplimiento" />
                <div className="mb-3">
                  <Badge tone={COMPLIANCE_TONE[detail.compliance_level || ''] || 'neutral'}>
                    {COMPLIANCE_LABEL[detail.compliance_level || ''] || detail.compliance_level || 'N/A'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {(detail.compliance_data.checks || []).map((c: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 px-4 py-2.5 rounded-xl border border-violet-400/15 text-sm">
                      {c.status === 'pass' ? <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" /> : c.status === 'fail' ? <XCircle size={16} className="text-rose-400 shrink-0 mt-0.5" /> : <HelpCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />}
                      <div>
                        <div className="text-violet-100">{c.criterion}</div>
                        {c.explanation && <div className="text-xs text-violet-300/70 mt-0.5">{c.explanation}</div>}
                      </div>
                    </div>
                  ))}
                  {detail.compliance_data.risk_notes && <p className="text-xs text-amber-300 mt-2">⚠ {detail.compliance_data.risk_notes}</p>}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-violet-400/15">
              <Button variant="gold" onClick={() => downloadQuote(detail)}><Download size={15} /> Download Quote</Button>
              <Button variant="primary"><Save size={15} /> Save to CRM</Button>
              <Button variant="secondary"><Send size={15} /> Send to Client</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
