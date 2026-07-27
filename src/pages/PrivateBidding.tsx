import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Select, Badge, Modal, SectionTitle, EmptyState } from '../components/ui'
import { ShieldCheck, Crown, Rocket, Send, Loader as Loader2, CircleCheck as CheckCircle2, Clock, FileText } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '../lib/utils'

export function PrivateBidding() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [planSelected, setPlanSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [apps, setApps] = useState<any[]>([])
  const [draft, setDraft] = useState<any>({
    full_name: '', company_name: '', phone: '', email: '', website: '',
    product_service: '', industry: '', registered_gov: false, sam_active: false,
    has_ein: false, prior_experience: false, max_invest: '', min_contract: '',
    states: '', contract_type: 'ambos', wholesale_capacity: false, has_suppliers: false, notes: '',
  })

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('private_bidding_applications').select('*').order('created_at', { ascending: false })
    if (data) setApps(data)
  }

  function set(k: string, v: any) { setDraft((d: any) => ({ ...d, [k]: v })) }

  function openForm(plan: string) {
    setPlanSelected(plan)
    setSubmitted(false)
    setOpen(true)
  }

  async function submit() {
    if (!draft.full_name?.trim()) return
    setBusy(true)
    const payload = { ...draft, plan_selected: planSelected, user_id: session?.user?.id }
    const { data } = await supabase.from('private_bidding_applications').insert(payload).select().single()
    setBusy(false)
    if (data) {
      setApps((a) => [data, ...a])
      setSubmitted(true)
    }
  }

  function close() {
    setOpen(false); setPlanSelected(null); setSubmitted(false)
    setDraft({
      full_name: '', company_name: '', phone: '', email: '', website: '',
      product_service: '', industry: '', registered_gov: false, sam_active: false,
      has_ein: false, prior_experience: false, max_invest: '', min_contract: '',
      states: '', contract_type: 'ambos', wholesale_capacity: false, has_suppliers: false, notes: '',
    })
  }

  const plans = [
    {
      id: 'setup_commission', name: 'Setup + Comisión', icon: Rocket,
      price: '$5,000', priceLabel: 'Setup fee', extra: '+ 5% de cada contrato ganado',
      desc: 'Ideal para empresas que quieren que nuestro equipo prepare, aplique y gestione oportunidades.',
      features: ['Setup y onboarding completo', 'Búsqueda y aplicación a oportunidades', 'Gestión de propuestas', '5% comisión por contrato ganado'],
      tone: 'gold' as const,
    },
    {
      id: 'flat_fee', name: 'Flat Fee Done For You', icon: Crown,
      price: '$10,000', priceLabel: 'Flat fee', extra: '100% del contrato es tuyo',
      desc: 'Servicio 100% Done For You. El cliente mantiene el 100% del contrato sin pagar comisión.',
      features: ['Servicio completamente Done For You', '0% comisión por contrato', 'Estrategia personalizada', 'Soporte dedicado'],
      tone: 'gold' as const,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/20 text-fuchsia-300 text-xs font-medium mb-4">
          <ShieldCheck size={14} /> Servicio Done For You
        </div>
        <h1 className="font-display text-3xl font-bold text-violet-100">Licitaciones Privadas</h1>
        <p className="text-lg text-violet-200/80 mt-3">
          Accede a licitar con el gobierno de Estados Unidos de forma <span className="text-fuchsia-300 font-semibold">100% Done For You</span>.
        </p>
        <p className="text-sm text-violet-300/70 mt-2">
          Llena el formulario para que nuestro equipo revise tu caso y prepare una estrategia de licitación.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((p) => {
          const Icon = p.icon
          return (
            <Card key={p.id} className="p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center animate-pulse-glow">
                    <Icon size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-violet-100">{p.name}</h3>
                    <Badge tone={p.tone}>{p.priceLabel}</Badge>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display text-3xl font-bold text-violet-50">{p.price}</span>
                  <span className="text-sm text-fuchsia-300">{p.extra}</span>
                </div>
                <p className="text-sm text-violet-300/70 mb-4">{p.desc}</p>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-violet-200">
                      <CheckCircle2 size={15} className="text-teal-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant="gold" className="w-full" onClick={() => openForm(p.id)}>
                  Apply Now
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {apps.length > 0 && (
        <Card className="p-6 max-w-4xl mx-auto">
          <SectionTitle title="Mis solicitudes" subtitle="Estado de tus aplicaciones a Licitaciones Privadas" />
          <div className="space-y-2">
            {apps.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-violet-400/15">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400"><FileText size={16} /></div>
                  <div>
                    <div className="text-sm font-medium text-violet-100">{a.full_name} · {a.company_name || 'Sin empresa'}</div>
                    <div className="text-xs text-violet-300/70">{formatDate(a.created_at)} · {a.plan_selected === 'flat_fee' ? 'Flat Fee' : 'Setup + Comisión'}</div>
                  </div>
                </div>
                <Badge tone={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'error' : 'warning'}>
                  {a.status === 'approved' ? 'Aprobado' : a.status === 'rejected' ? 'Rechazado' : a.status === 'reviewing' ? 'En revisión' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={open} onClose={close} title="Solicitud de Licitación Privada" wide>
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-teal-400" />
            </div>
            <h3 className="font-display text-lg font-semibold text-violet-100">¡Solicitud enviada!</h3>
            <p className="text-sm text-violet-300/70 mt-2 max-w-sm mx-auto">Nuestro equipo revisará tu caso y se pondrá en contacto contigo pronto.</p>
            <Button variant="gold" className="mt-6" onClick={close}>Cerrar</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <SectionTitle title="1. Datos personales y de empresa" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre completo" value={draft.full_name} onChange={(e) => set('full_name', e.target.value)} />
              <Input label="Nombre de la empresa" value={draft.company_name} onChange={(e) => set('company_name', e.target.value)} />
              <Input label="Teléfono" value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
              <Input label="Email" type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
              <Input label="Website de la empresa" value={draft.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" />
              <Input label="Tipo de producto o servicio" value={draft.product_service} onChange={(e) => set('product_service', e.target.value)} />
              <Input label="Industria / categoría" value={draft.industry} onChange={(e) => set('industry', e.target.value)} />
            </div>

            <SectionTitle title="2. Registro gubernamental" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: 'registered_gov', l: 'Registrada para vender al gobierno' },
                { k: 'sam_active', l: 'SAM.gov activo' },
                { k: 'has_ein', l: 'Tiene EIN' },
                { k: 'prior_experience', l: 'Experiencia previa con gobierno' },
              ].map((c) => (
                <label key={c.k} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 cursor-pointer hover:border-fuchsia-400/40 transition">
                  <input type="checkbox" checked={draft[c.k] || false} onChange={(e) => set(c.k, e.target.checked)} className="accent-fuchsia-500" />
                  <span className="text-sm text-violet-200">{c.l}</span>
                </label>
              ))}
            </div>

            <SectionTitle title="3. Inversión y preferencias" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Monto máximo a invertir ($)" type="number" value={draft.max_invest} onChange={(e) => set('max_invest', +e.target.value)} />
              <Input label="Monto mínimo de contrato ($)" type="number" value={draft.min_contract} onChange={(e) => set('min_contract', +e.target.value)} />
              <Input label="Estados / zonas" value={draft.states} onChange={(e) => set('states', e.target.value)} placeholder="Ej. CA, TX, FL o Nacional" />
              <Select label="Tipo de contrato" value={draft.contract_type} onChange={(e) => set('contract_type', e.target.value)}>
                <option value="productos">Productos</option>
                <option value="servicios">Servicios</option>
                <option value="ambos">Ambos</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 cursor-pointer hover:border-fuchsia-400/40 transition">
                <input type="checkbox" checked={draft.wholesale_capacity} onChange={(e) => set('wholesale_capacity', e.target.checked)} className="accent-fuchsia-500" />
                <span className="text-sm text-violet-200">Capacidad de entrega al por mayor</span>
              </label>
              <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 cursor-pointer hover:border-fuchsia-400/40 transition">
                <input type="checkbox" checked={draft.has_suppliers} onChange={(e) => set('has_suppliers', e.target.checked)} className="accent-fuchsia-500" />
                <span className="text-sm text-violet-200">Tiene proveedores actualmente</span>
              </label>
            </div>

            <Textarea label="Notas adicionales" value={draft.notes} onChange={(e) => set('notes', e.target.value)} />

            {planSelected && (
              <div className="px-4 py-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/20 text-sm text-fuchsia-200">
                Plan seleccionado: <span className="font-semibold">{planSelected === 'flat_fee' ? 'Flat Fee Done For You ($10,000)' : 'Setup + Comisión ($5,000 + 5%)'}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={close}>Cancelar</Button>
              <Button variant="gold" onClick={submit} disabled={busy || !draft.full_name?.trim()}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Enviar solicitud
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
