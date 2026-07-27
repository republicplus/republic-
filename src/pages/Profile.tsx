import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, SectionTitle, Badge } from '../components/ui'
import { User, Save, Check } from 'lucide-react'

export function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (data) setProfile(data)
    else setProfile({ id: user.id, email: user.email })
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert(profile)
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  function set(k: string, v: any) { setProfile((p: any) => ({ ...p, [k]: v })) }

  if (!profile) return <div className="text-violet-300/70">Cargando…</div>

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl navy-gradient flex items-center justify-center text-white text-xl font-bold neon-border">
            {(profile.first_name?.[0] || 'U')}{(profile.last_name?.[0] || '')}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-violet-100">{profile.first_name} {profile.last_name}</h2>
            <p className="text-sm text-violet-300/70">{profile.email}</p>
            <div className="mt-1.5"><Badge tone="gold" >{profile.role || 'contractor'}</Badge></div>
          </div>
        </div>

        <SectionTitle title="Información Personal" subtitle="Datos básicos de contacto" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nombre" value={profile.first_name || ''} onChange={(e) => set('first_name', e.target.value)} />
          <Input label="Apellido" value={profile.last_name || ''} onChange={(e) => set('last_name', e.target.value)} />
          <Input label="Email" value={profile.email || ''} onChange={(e) => set('email', e.target.value)} />
          <Input label="Teléfono" value={profile.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Dirección" value={profile.address || ''} onChange={(e) => set('address', e.target.value)} />
          <Input label="Estado" value={profile.state || ''} onChange={(e) => set('state', e.target.value)} />
          <Input label="País" value={profile.country || ''} onChange={(e) => set('country', e.target.value)} />
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle title="Profesional" subtitle="Licencias, especialidad y firmas" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Licencias" value={profile.licenses || ''} onChange={(e) => set('licenses', e.target.value)} />
          <Input label="Especialidad" value={profile.specialty || ''} onChange={(e) => set('specialty', e.target.value)} />
          <Input label="Firma Digital" value={profile.digital_signature || ''} onChange={(e) => set('digital_signature', e.target.value)} />
          <Input label="Firma Electrónica" value={profile.electronic_signature || ''} onChange={(e) => set('electronic_signature', e.target.value)} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="gold" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : saved ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar perfil</>}
        </Button>
      </div>
    </div>
  )
}
