import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, SectionTitle, Badge, Modal, EmptyState, Toggle } from '../components/ui'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'

export function Companies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
    if (data) setCompanies(data)
  }

  function openNew() { setEditing({ legal_name: '' }); setOpen(true) }
  function openEdit(c: any) { setEditing(c); setOpen(true) }

  async function save() {
    if (editing.id) {
      await supabase.from('companies').update(editing).eq('id', editing.id)
    } else {
      await supabase.from('companies').insert(editing)
    }
    setOpen(false); setEditing(null); load()
  }

  async function remove(id: string) {
    await supabase.from('companies').delete().eq('id', id); load()
  }

  function set(k: string, v: any) { setEditing((e: any) => ({ ...e, [k]: v })) }

  const certs = ['small_business','minority_owned','woman_owned','veteran_owned','eight_a','hubzone','wosb','edwosb','sdvosb']
  const certLabels: Record<string,string> = {
    small_business:'Small Business', minority_owned:'Minority Owned', woman_owned:'Woman Owned',
    veteran_owned:'Veteran Owned', eight_a:'8(a)', hubzone:'HUBZone', wosb:'WOSB', edwosb:'EDWOSB', sdvosb:'SDVOSB'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted">{companies.length} empresa(s) registrada(s)</p>
        <Button variant="gold" onClick={openNew}><Plus size={16} /> Nueva Empresa</Button>
      </div>

      {companies.length === 0 ? (
        <Card><EmptyState icon={<Building2 size={22} />} title="Sin empresas" subtitle="Crea tu perfil empresarial con certificaciones set-aside, NAICS, SAM y más." action={<Button variant="gold" onClick={openNew}><Plus size={16} /> Crear empresa</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {companies.map((c) => (
            <Card key={c.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600"><Building2 size={18} /></div>
                  <div>
                    <h3 className="font-semibold text-navy-900">{c.legal_name}</h3>
                    {c.dba && <p className="text-xs text-muted">DBA: {c.dba}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="text-muted hover:text-navy-900 transition p-1.5"><Pencil size={15} /></button>
                  <button onClick={() => remove(c.id)} className="text-muted hover:text-error-600 transition p-1.5"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {certs.filter((k) => c[k]).map((k) => <Badge key={k} tone="gold">{certLabels[k]}</Badge>)}
                {c.sam_registration && <Badge tone="success">SAM Activo</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div><span className="text-muted">UEI:</span> <span className="text-navy-800">{c.uei || '—'}</span></div>
                <div><span className="text-muted">CAGE:</span> <span className="text-navy-800">{c.cage_code || '—'}</span></div>
                <div><span className="text-muted">NAICS:</span> <span className="text-navy-800">{c.naics_codes || '—'}</span></div>
                <div><span className="text-muted">SAM vence:</span> <span className="text-navy-800">{c.sam_expiration || '—'}</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? 'Editar empresa' : 'Nueva empresa'} wide>
        {editing && (
          <div className="space-y-5">
            <SectionTitle title="Identificación" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre Legal" value={editing.legal_name || ''} onChange={(e) => set('legal_name', e.target.value)} />
              <Input label="DBA" value={editing.dba || ''} onChange={(e) => set('dba', e.target.value)} />
              <Input label="EIN" value={editing.ein || ''} onChange={(e) => set('ein', e.target.value)} />
              <Input label="Reseller Permit" value={editing.reseller_permit || ''} onChange={(e) => set('reseller_permit', e.target.value)} />
              <Input label="UEI" value={editing.uei || ''} onChange={(e) => set('uei', e.target.value)} />
              <Input label="DUNS" value={editing.duns || ''} onChange={(e) => set('duns', e.target.value)} />
              <Input label="CAGE Code" value={editing.cage_code || ''} onChange={(e) => set('cage_code', e.target.value)} />
              <Input label="SAM Expiration" type="date" value={editing.sam_expiration || ''} onChange={(e) => set('sam_expiration', e.target.value)} />
            </div>
            <div className="flex items-center gap-2"><Toggle checked={!!editing.sam_registration} onChange={(v) => set('sam_registration', v)} label="SAM Registration activa" /></div>

            <SectionTitle title="Códigos & Certificaciones" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="NAICS Codes" value={editing.naics_codes || ''} onChange={(e) => set('naics_codes', e.target.value)} />
              <Input label="PSC Codes" value={editing.psc_codes || ''} onChange={(e) => set('psc_codes', e.target.value)} />
              <Input label="ISO Certifications" value={editing.iso_certifications || ''} onChange={(e) => set('iso_certifications', e.target.value)} />
              <Input label="Licencias" value={editing.licenses || ''} onChange={(e) => set('licenses', e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-4">
              {certs.map((k) => <Toggle key={k} checked={!!editing[k]} onChange={(v) => set(k, v)} label={certLabels[k]} />)}
            </div>

            <SectionTitle title="Contacto & Capacidad" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Website" value={editing.website || ''} onChange={(e) => set('website', e.target.value)} />
              <Input label="Email" value={editing.email || ''} onChange={(e) => set('email', e.target.value)} />
              <Input label="Teléfono" value={editing.phone || ''} onChange={(e) => set('phone', e.target.value)} />
              <Input label="Dirección" value={editing.address || ''} onChange={(e) => set('address', e.target.value)} />
              <Input label="Estados donde opera" value={editing.operating_states || ''} onChange={(e) => set('operating_states', e.target.value)} />
              <Input label="Años en operación" type="number" value={editing.years_in_operation || ''} onChange={(e) => set('years_in_operation', +e.target.value)} />
              <Input label="Número de empleados" type="number" value={editing.employee_count || ''} onChange={(e) => set('employee_count', +e.target.value)} />
              <Input label="Capacidad financiera ($)" type="number" value={editing.financial_capacity || ''} onChange={(e) => set('financial_capacity', +e.target.value)} />
              <Input label="Líneas de crédito ($)" type="number" value={editing.credit_lines || ''} onChange={(e) => set('credit_lines', +e.target.value)} />
              <Input label="Bonding Capacity ($)" type="number" value={editing.bonding_capacity || ''} onChange={(e) => set('bonding_capacity', +e.target.value)} />
              <Input label="Seguros" value={editing.insurance || ''} onChange={(e) => set('insurance', e.target.value)} />
              <Input label="Bank Reference" value={editing.bank_reference || ''} onChange={(e) => set('bank_reference', e.target.value)} />
            </div>
            <Textarea label="Past Performance" value={editing.past_performance || ''} onChange={(e) => set('past_performance', e.target.value)} />
            <Textarea label="Capability Statement" value={editing.capability_statement || ''} onChange={(e) => set('capability_statement', e.target.value)} />
            <Textarea label="Certificaciones" value={editing.certifications || ''} onChange={(e) => set('certifications', e.target.value)} />
            <Textarea label="Notas" value={editing.notes || ''} onChange={(e) => set('notes', e.target.value)} />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="gold" onClick={save}>Guardar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
