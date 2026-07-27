import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Badge, SectionTitle, InfoNote } from '../components/ui'
import { Building2, Save, Loader as Loader2, CircleCheck as CheckCircle2 } from 'lucide-react'

const CERTS = ['sam_registration','small_business','minority_owned','woman_owned','veteran_owned','eight_a','hubzone','wosb','edwosb','sdvosb']

export function Company() {
  const { session } = useAuth()
  const [company, setCompany] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('companies').select('*').eq('user_id', session?.user?.id).maybeSingle()
    if (data) setCompany(data)
    else setCompany({ user_id: session?.user?.id })
  }

  function set(k: string, v: any) { setCompany((c: any) => ({ ...c, [k]: v })); setSaved(false) }

  async function save() {
    setBusy(true)
    if (company.id) {
      await supabase.from('companies').update(company).eq('id', company.id)
    } else {
      const { data } = await supabase.from('companies').insert({ ...company, user_id: session?.user?.id }).select().single()
      if (data) setCompany(data)
    }
    setBusy(false); setSaved(true)
  }

  if (!company) return <div className="text-violet-300/70">Cargando…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-violet-100">Mi Empresa</h1>
        <p className="text-sm text-violet-300/70 mt-1">Perfil de tu compañía para licitaciones del gobierno</p>
      </div>
      <InfoNote title="¿Qué es Mi Empresa?">
        <p>Esta es la ficha de tu compañía. Aquí registras tu información fiscal, códigos NAICS, certificaciones gubernamentales, capacidad financiera y de bonding.</p>
        <p>Mantén estos datos actualizados: se usan al presentar propuestas y registrar contratos con el gobierno.</p>
      </InfoNote>
      <Card className="p-6 space-y-6">
        <SectionTitle title="1. Identidad" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nombre legal" value={company.legal_name || ''} onChange={(e) => set('legal_name', e.target.value)} />
          <Input label="DBA (alias)" value={company.dba || ''} onChange={(e) => set('dba', e.target.value)} />
          <Input label="EIN" value={company.ein || ''} onChange={(e) => set('ein', e.target.value)} />
          <Input label="UEI" value={company.uei || ''} onChange={(e) => set('uei', e.target.value)} />
          <Input label="DUNS" value={company.duns || ''} onChange={(e) => set('duns', e.target.value)} />
          <Input label="CAGE Code" value={company.cage_code || ''} onChange={(e) => set('cage_code', e.target.value)} />
          <Input label="NAICS" value={company.naics_codes || ''} onChange={(e) => set('naics_codes', e.target.value)} />
          <Input label="PSC" value={company.psc_codes || ''} onChange={(e) => set('psc_codes', e.target.value)} />
        </div>
        <SectionTitle title="2. Certificaciones" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CERTS.map((c) => (
            <label key={c} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 cursor-pointer hover:border-fuchsia-400/40 transition">
              <input type="checkbox" checked={company[c] || false} onChange={(e) => set(c, e.target.checked)} className="accent-fuchsia-500" />
              <span className="text-sm text-violet-200">{c.replace(/_/g,' ').replace(/\b\w/g, (m) => m.toUpperCase())}</span>
            </label>
          ))}
        </div>
        <SectionTitle title="3. Contacto" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Website" value={company.website || ''} onChange={(e) => set('website', e.target.value)} />
          <Input label="Email" type="email" value={company.email || ''} onChange={(e) => set('email', e.target.value)} />
          <Input label="Teléfono" value={company.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Dirección" value={company.address || ''} onChange={(e) => set('address', e.target.value)} />
        </div>
        <SectionTitle title="4. Capacidad Financiera" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Años de operación" type="number" value={company.years_in_operation || ''} onChange={(e) => set('years_in_operation', +e.target.value)} />
          <Input label="Empleados" type="number" value={company.employee_count || ''} onChange={(e) => set('employee_count', +e.target.value)} />
          <Input label="Capacidad financiera ($)" type="number" value={company.financial_capacity || ''} onChange={(e) => set('financial_capacity', +e.target.value)} />
          <Input label="Capacidad de bonding ($)" type="number" value={company.bonding_capacity || ''} onChange={(e) => set('bonding_capacity', +e.target.value)} />
        </div>
        <Textarea label="Notas" value={company.notes || ''} onChange={(e) => set('notes', e.target.value)} />
        <div className="flex items-center justify-between pt-2">
          {saved && <span className="text-sm text-teal-300 flex items-center gap-1"><CheckCircle2 size={16} /> Guardado</span>}
          <Button variant="gold" onClick={save} disabled={busy} className="ml-auto">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar empresa
          </Button>
        </div>
      </Card>
    </div>
  )
}
