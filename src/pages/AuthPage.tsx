import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { AIOrb } from '../components/AIOrb'
import { Button, Input } from '../components/ui'
import { Sparkles, ShieldCheck, Users, Building2 } from 'lucide-react'
import { cn } from '../lib/utils'

type Role = 'contractor' | 'investor' | 'insurer'

export function AuthPage() {
  const { session, signIn, signUp } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('contractor')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/app" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, role)
    setBusy(false)
    if (res.error) setError(res.error)
    else nav('/app')
  }

  const roles: { id: Role; label: string; icon: typeof Building2; desc: string }[] = [
    { id: 'contractor', label: 'Contratista', icon: Building2, desc: 'Gestiono contratos' },
    { id: 'investor', label: 'Inversionista', icon: Users, desc: 'Invierto en oportunidades' },
    { id: 'insurer', label: 'Aseguradora', icon: ShieldCheck, desc: 'Respaldo capital' },
  ]

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 navy-gradient overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-navy-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Sparkles size={20} className="text-gold-400" />
          </div>
          <div>
            <div className="font-display font-extrabold text-white text-xl">ArcaBid</div>
            <div className="text-[11px] text-navy-200 tracking-wider uppercase">Government Contracting OS</div>
          </div>
        </div>
        <div className="relative flex flex-col items-center justify-center flex-1 -mt-12">
          <AIOrb size={220} />
          <h2 className="font-display text-3xl font-bold text-white mt-10 text-center max-w-sm">
            El sistema operativo para contratistas gubernamentales
          </h2>
          <p className="text-navy-200 text-sm mt-3 text-center max-w-md">
            CRM + ERP + Marketplace + IA. Busca contratos, adminístralos, consigue capital y levanta inversión — todo en un solo lugar.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-3 text-center">
          {['FAR & SAM.gov', 'Capital & Inversión', 'IA Especializada'].map((t) => (
            <div key={t} className="text-xs text-navy-200 rounded-xl bg-white/5 border border-white/10 py-2.5">{t}</div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-8 bg-canvas">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8 lg:hidden">
            <AIOrb size={72} />
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-900 text-center">
            {mode === 'signin' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h1>
          <p className="text-sm text-muted text-center mt-1 mb-7">
            {mode === 'signin' ? 'Inicia sesión para continuar' : 'Empieza a operar con ArcaBid'}
          </p>

          {mode === 'signup' && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              {roles.map((r) => {
                const Icon = r.icon
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition',
                      role === r.id ? 'border-navy-900 bg-navy-50' : 'border-line bg-white hover:border-navy-200'
                    )}
                  >
                    <Icon size={18} className={role === r.id ? 'text-navy-900' : 'text-muted'} />
                    <span className={cn('text-xs font-medium', role === r.id ? 'text-navy-900' : 'text-muted')}>{r.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.com" />
            <Input label="Contraseña" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            {error && <p className="text-sm text-error-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Procesando…' : mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="text-sm text-muted text-center mt-6">
            {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-navy-900 font-medium hover:underline">
              {mode === 'signin' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
