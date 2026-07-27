import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, InfoNote } from '../components/ui'
import { Plus, ShieldCheck, Trash2, Pencil, Sparkles } from 'lucide-react'
import { formatCurrency } from '../lib/utils'
import { useAICreate } from '../lib/useAICreate'

const RISK_LEVELS = ['Bajo','Medio','Alto']

export function Insurers() {
  const [insurers, setInsurers] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<any>({ name: '', risk_level: 'Bajo' })
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const { create, busy } = useAICreate()

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('insurers').select('*').order('created_at', { ascending: false })
    if (data) setInsurers(data)
  }
  async function save() {
    if (draft.id) await supabase.from('insurers').update(draft).eq('id', draft.id)
    else await supabase.from('insurers').insert(draft)
    setOpen(false); setDraft({ name: '', risk_level: 'Bajo' }); load()
  }
  async function remove(id: string) { await supabase.from('insurers').delete().eq('id', id); load() }

  async function aiCreate() {
    if (!aiPrompt.trim()) return
    const result = await create(aiPrompt)
    if (result.ok) { setAiOpen(false); setAiPrompt(''); load() }
  }

  const totalCapacity = insurers.reduce((s, i) => s + (i.available_capital || 0), 0)

  return (
    <div className="space-y-6">
      <Card className="p-5 navy-gradient neon-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><ShieldCheck size={20} className="text-fuchsia-400" /></div>
          <div>
            <h3 className="font-semibold text-white">Aseguradoras de Capital</h3>
            <p className="text-sm text-violet-200">Respaldo financiero si un inversionista incurre. Comisión configurable (ej. +5%).</p>
          </div>
          <Badge tone="gold">{formatCurrency(totalCapacity)}</Badge>
        </div>
      </Card>

      <InfoNote title="¿Qué es Aseguradoras?">
        <p>Administra las aseguradoras y pólizas asociadas a tus contratos: bonds, seguros de responsabilidad, fiadoras y coberturas.</p>
        <p>Registra el tipo de póliza, monto cubierto, vigencia y estado para saber qué coberturas tienes activas en cada momento.</p>
      </InfoNote>

      <div className="flex justify-end gap-2">
        <Button variant="primary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Crear con AI</Button>
        <Button variant="gold" onClick={() => { setDraft({ name: '', risk_level: 'Bajo' }); setOpen(true) }}><Plus size={16} /> Nueva Aseguradora</Button>
      </div>

      {insurers.length === 0 ? (
        <Card><EmptyState icon={<ShieldCheck size={22} />} title="Sin aseguradoras" subtitle="Registra aseguradoras que respaldan el capital de inversionistas." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Agregar</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {insurers.map((ins) => (
            <Card key={ins.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 neon-border"><ShieldCheck size={18} /></div>
                  <div>
                    <h3 className="font-semibold text-violet-100">{ins.name}</h3>
                    <Badge tone={ins.risk_level === 'Bajo' ? 'success' : ins.risk_level === 'Alto' ? 'error' : 'warning'}>{ins.risk_level}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-4 text-xs">
                <div><span className="text-violet-300/70">Capital disp.:</span> <span className="font-semibold text-violet-100">{formatCurrency(ins.available_capital)}</span></div>
                <div><span className="text-violet-300/70">Máximo:</span> <span className="text-violet-200">{formatCurrency(ins.max_capital)}</span></div>
                <div><span className="text-violet-300/70">Comisión:</span> <span className="text-violet-200">{ins.commission ? `${ins.commission}%` : '—'}</span></div>
                <div><span className="text-violet-300/70">Sectores:</span> <span className="text-violet-200">{ins.allowed_sectors || '—'}</span></div>
              </div>
              {ins.history && <p className="text-xs text-violet-300/70 mt-3 line-clamp-2">{ins.history}</p>}
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => { setDraft(ins); setOpen(true) }}><Pencil size={13} /> Editar</Button>
                <Button variant="danger" size="sm" onClick={() => remove(ins.id)}><Trash2 size={13} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? 'Editar aseguradora' : 'Nueva aseguradora'} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={draft.name || ''} onChange={(e) => setDraft((d:any) => ({ ...d, name: e.target.value }))} />
            <Input label="Contacto" value={draft.contact || ''} onChange={(e) => setDraft((d:any) => ({ ...d, contact: e.target.value }))} />
            <Input label="Email" value={draft.email || ''} onChange={(e) => setDraft((d:any) => ({ ...d, email: e.target.value }))} />
            <Select label="Nivel de riesgo" value={draft.risk_level} onChange={(e) => setDraft((d:any) => ({ ...d, risk_level: e.target.value }))}>
              {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
            <Input label="Capital disponible ($)" type="number" value={draft.available_capital || ''} onChange={(e) => setDraft((d:any) => ({ ...d, available_capital: +e.target.value }))} />
            <Input label="Capital máximo ($)" type="number" value={draft.max_capital || ''} onChange={(e) => setDraft((d:any) => ({ ...d, max_capital: +e.target.value }))} />
            <Input label="Comisión (%)" type="number" value={draft.commission || ''} onChange={(e) => setDraft((d:any) => ({ ...d, commission: +e.target.value }))} />
            <Input label="Sectores permitidos" value={draft.allowed_sectors || ''} onChange={(e) => setDraft((d:any) => ({ ...d, allowed_sectors: e.target.value }))} />
          </div>
          <Textarea label="Historial" value={draft.history || ''} onChange={(e) => setDraft((d:any) => ({ ...d, history: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={save} disabled={!draft.name}>Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="Crear aseguradora con AI">
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Describe la aseguradora y la AI la creará automáticamente.</p>
          <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Ej: Crea una aseguradora llamada SureBond, capital disponible 2000000, riesgo Bajo, comisión 5%, sectores construcción e IT" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAiOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={aiCreate} disabled={busy || !aiPrompt.trim()}>{busy ? 'Creando…' : 'Crear con AI'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
