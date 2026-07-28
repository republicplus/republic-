import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, SectionTitle, InfoNote } from '../components/ui'
import { ContractFlowPanel, type Flow } from '../components/ContractFlowPanel'
import { Sparkles, Loader as Loader2, Upload, FileText, Search, Filter, Eye, Download, Save, Send, Plus, Trash2, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Circle as XCircle, CircleHelp as HelpCircle, ArrowLeft } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const STATUS = ['nuevo','analizando','cotizado','enviado','ganado','perdido']
const STATUS_LABEL: Record<string,string> = { nuevo:'Nuevo', analizando:'En análisis', cotizado:'Cotizado', enviado:'Enviado', ganado:'Ganado', perdido:'Perdido' }
const STATUS_TONE: Record<string,any> = { nuevo:'neutral', analizando:'info', cotizado:'gold', enviado:'info', ganado:'success', perdido:'error' }
const COMPLIANCE_TONE: Record<string,any> = { cumple:'success', cumple_parcial:'warning', no_cumple:'error', revision:'info' }
const COMPLIANCE_LABEL: Record<string,string> = { cumple:'Compliant', cumple_parcial:'Partially Compliant', no_cumple:'Non-Compliant', revision:'Manual Review' }

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
  const [files, setFiles] = useState<{ name: string; type: string; dataUrl?: string; storageUrl?: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const MAX_FILES = 10

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('contract_flows').select('*').order('created_at', { ascending: false })
    if (data) setFlows(data as Flow[])
  }

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return
    const room = MAX_FILES - files.length
    if (room <= 0) { alert(`Máximo ${MAX_FILES} archivos`); return }
    const toAdd = selected.slice(0, room)
    const newFiles: { name: string; type: string; dataUrl?: string; storageUrl?: string }[] = []
    for (const f of toAdd) {
      if (f.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f) })
        newFiles.push({ name: f.name, type: 'image', dataUrl })
      } else if (f.type === 'application/pdf') {
        const ext = f.name.split('.').pop()
        const path = `flow-uploads/${crypto.randomUUID()}.${ext}`
        const { error } = await supabase.storage.from('documents').upload(path, f)
        if (!error) {
          const { data: pub } = supabase.storage.from('documents').getPublicUrl(path)
          newFiles.push({ name: f.name, type: 'pdf', storageUrl: pub.publicUrl })
        }
      }
    }
    setFiles((prev) => [...prev, ...newFiles])
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function analyze() {
    if (!inputText.trim() && files.length === 0) return
    setBusy(true)
    try {
      const imageUrls = files.filter((f) => f.type === 'image' && f.dataUrl).map((f) => f.dataUrl!)
      const pdfUrls = files.filter((f) => f.type === 'pdf' && f.storageUrl).map((f) => f.storageUrl!)
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token}` },
        body: JSON.stringify({ mode: 'flow', question: inputText, imageUrls, pdfUrls, flowType: inputType }),
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
        solicitation_number: data.extracted?.solicitation_number || null,
        agency: data.extracted?.agency || null,
        naics: data.extracted?.naics || null,
        due_date: data.extracted?.due_date || null,
        award_date: data.extracted?.award_date || null,
        delivery_date: data.extracted?.delivery_date || null,
        total_value: data.extracted?.total_value || null,
        executive_analysis: data.executive_analysis || {},
        technical_requirements: data.technical_requirements || {},
        supplier_review: data.supplier_review || {},
        financial_analysis: data.financial_analysis || {},
        risk_decision: data.risk_decision || {},
      }
      const { data: inserted } = await supabase.from('contract_flows').insert(insertPayload).select().single()
      if (inserted) {
        setFlows((f) => [inserted as Flow, ...f])
        setDetail(inserted as Flow)
        setDetailOpen(true)
        setNewOpen(false); setInputText(''); setFiles([])
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
      `QUOTE - ARCA BID`,
      `Date: ${formatDate(flow.created_at)}`,
      ``,
      `Contract: ${flow.contract_name || 'N/A'}`,
      `Agency: ${e.agency || 'N/A'}`,
      `Type: ${flow.contract_type}`,
      ``,
      `PRODUCT / SERVICE`,
      `Name: ${e.product_name || e.service_type || 'N/A'}`,
      `Quantity: ${e.quantity || 'N/A'}`,
      `Specifications: ${e.specifications || e.service_description || 'N/A'}`,
      ``,
      `COST ANALYSIS`,
      ...(ca.items || []).map((i: any) => `${i.label}: ${formatCurrency(i.amount)}`),
      `Total cost: ${formatCurrency(ca.total_cost)}`,
      `Margin: ${ca.margin_percent || flow.margin || 0}%`,
      `Recommended price: ${formatCurrency(ca.recommended_price || flow.recommended_price)}`,
      `Estimated profit: ${formatCurrency(ca.estimated_profit || flow.estimated_profit)}`,
      ``,
      `COMPLIANCE`,
      `Level: ${COMPLIANCE_LABEL[flow.compliance_level || ''] || flow.compliance_level || 'N/A'}`,
      `Risk notes: ${comp.risk_notes || 'N/A'}`,
      ``,
      `SUMMARY`,
      flow.extracted_data?.summary || '',
    ].join('\n')
    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `quote-${flow.contract_name || 'arcabid'}.txt`; a.click()
  }

  async function rejectOpportunity(id: string) {
    await supabase.from('contract_flows').update({ status: 'rejected' }).eq('id', id)
    setDetailOpen(false); load()
  }

  async function moveToContracts(id: string) {
    const { data: flow } = await supabase.from('contract_flows').select('*').eq('id', id).maybeSingle()
    if (!flow) return
    const e = flow.extracted_data || {}
    const ca = flow.cost_analysis || {}
    const fin = flow.financial_analysis || {}
    await supabase.from('contracts').insert({
      title: flow.contract_name || 'Imported from Analyzer',
      agency: e.agency || flow.agency || null,
      total_value: fin.revenue?.estimated_contract_value || ca.recommended_price || flow.recommended_price || flow.total_value || 0,
      estimated_cost: fin.results?.total_estimated_cost || ca.total_cost || flow.estimated_cost || 0,
      estimated_profit: fin.results?.net_profit || ca.estimated_profit || flow.estimated_profit || 0,
      capital_required: fin.results?.required_working_capital || ca.total_cost || flow.estimated_cost || 0,
      status: 'draft',
    })
    await supabase.from('contract_flows').update({ status: 'approved' }).eq('id', id)
    setDetailOpen(false); load()
  }

  async function saveForLater(id: string) {
    await supabase.from('contract_flows').update({ status: 'saved' }).eq('id', id)
    setDetailOpen(false); load()
  }

  async function saveAnalysis(id: string) {
    await supabase.from('contract_flows').update({ updated_at: new Date().toISOString() }).eq('id', id)
    alert('Análisis guardado')
  }

  async function reAnalyze(flow: Flow) {
    setBusy(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token}` },
        body: JSON.stringify({ mode: 'flow', question: flow.input_text || '', imageUrls: [], pdfUrls: [], flowType: flow.contract_type }),
      })
      if (!res.ok) throw new Error('Error al analizar')
      const data = await res.json()
      const ca = data.cost_analysis || {}
      const updates = {
        extracted_data: data.extracted || {},
        suppliers_data: data.suppliers || [],
        cost_analysis: ca,
        compliance_data: data.compliance || {},
        recommended_price: ca.recommended_price || null,
        estimated_cost: ca.total_cost || null,
        estimated_profit: ca.estimated_profit || null,
        margin: ca.margin_percent || null,
        compliance_level: data.compliance?.level || null,
        executive_analysis: data.executive_analysis || {},
        technical_requirements: data.technical_requirements || {},
        supplier_review: data.supplier_review || {},
        financial_analysis: data.financial_analysis || {},
        risk_decision: data.risk_decision || {},
      }
      await supabase.from('contract_flows').update(updates).eq('id', flow.id)
      setDetail((d) => d ? { ...d, ...updates } as Flow : d)
      load()
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setBusy(false) }
  }

  const filtered = flows.filter((f) =>
    (fStatus === 'all' || f.status === fStatus) &&
    (fType === 'all' || f.contract_type === fType) &&
    (fCompliance === 'all' || f.compliance_level === fCompliance) &&
    f.contract_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {!detailOpen && (<>
      <div>
        <h1 className="font-display text-2xl font-bold text-violet-100">Contract Analyzer Flow</h1>
        <p className="text-sm text-violet-300/70 mt-1">Upload a contract, text or screenshot and AI analyzes eligibility, FAR requirements, certifications, capital needed, estimated profit, risk score, suggested suppliers, timeline and competition</p>
      </div>

      <InfoNote title="¿Qué es Automatic Contract Flow?">
        <p>Sube un contrato (PDF, imagen o texto) y la IA analiza automáticamente: extrae el producto o servicio, busca proveedores, calcula costos, valida el cumplimiento y genera una cotización lista para presentar.</p>
        <p>Usa esta sección para acelerar tu proceso de licitación: de un documento crudo a una propuesta completa en minutos.</p>
      </InfoNote>

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
        <Card><EmptyState icon={<FileText size={22} />} title="No analysis yet" subtitle="Upload a contract, text or screenshot and AI will do the full analysis." action={<Button variant="gold" onClick={() => setNewOpen(true)}><Sparkles size={16} /> Analyze Contract</Button>} /></Card>
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
      </>

      )}

      {/* New analysis modal */}
      <Modal open={newOpen} onClose={() => { setNewOpen(false); setInputText(''); setFiles([]) }} title="Analyze Contract" wide>
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Sube hasta {MAX_FILES} archivos (PDFs, imágenes o ambos) y/o pega el texto del contrato. La IA extraerá producto/servicio, buscará proveedores, calculará costos, validará cumplimiento y generará una cotización.</p>
          <Select label="Tipo de contrato" value={inputType} onChange={(e) => setInputType(e.target.value)}>
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
            <option value="mixto">Producto + Servicio</option>
          </Select>
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-violet-400/30 rounded-xl p-6 text-center cursor-pointer hover:border-fuchsia-400/50 hover:bg-violet-500/5 transition">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={onFilesSelected} />
            <div className="text-sm text-violet-300/70"><Upload size={20} className="mx-auto mb-2 text-fuchsia-400" />Subir PDFs o imágenes ({files.length}/{MAX_FILES})</div>
          </div>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative group">
                  {f.type === 'image' && f.dataUrl ? (
                    <img src={f.dataUrl} alt={f.name} className="h-20 w-20 object-cover rounded-lg border border-violet-400/20" />
                  ) : (
                    <div className="h-20 w-20 rounded-lg border border-violet-400/20 flex flex-col items-center justify-center bg-violet-950/40">
                      <FileText size={18} className="text-rose-300" />
                      <span className="text-[9px] text-violet-300/70 mt-1 px-1 truncate w-full text-center">{f.name}</span>
                    </div>
                  )}
                  <button onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
          )}
          <Textarea label="O pega el texto del contrato" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Pega aquí el texto del RFQ, bid o contrato…" className="min-h-[150px]" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setNewOpen(false); setInputText(''); setFiles([]) }}>Cancelar</Button>
            <Button variant="gold" onClick={analyze} disabled={busy || (!inputText.trim() && files.length === 0)}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</> : <><Sparkles size={16} /> Analyze Contract</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail panel — full dashboard */}
      {detailOpen && detail && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDetailOpen(false)}><ArrowLeft size={14} /> Back to list</Button>
            <Button variant="secondary" size="sm" onClick={() => downloadQuote(detail)}><Download size={14} /> Download Quote</Button>
          </div>
          <ContractFlowPanel
            flow={detail}
            busy={busy}
            onAnalyze={() => reAnalyze(detail)}
            onUpload={() => fileRef.current?.click()}
            onSave={() => saveAnalysis(detail.id)}
            onMoveToContracts={() => moveToContracts(detail.id)}
            onReject={() => rejectOpportunity(detail.id)}
            onSaveForLater={() => saveForLater(detail.id)}
          />
        </div>
      )}
    </div>
  )
}
