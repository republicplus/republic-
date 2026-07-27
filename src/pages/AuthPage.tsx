import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Sparkles, ShieldCheck, Loader as Loader2 } from 'lucide-react'
import { Button, Input } from '../components/ui'
import { cn } from '../lib/utils'

const ROLES = [
  { id: 'contractor', label: 'Contratista', icon: ShieldCheck },
  { id: 'investor', label: 'Inversionista', icon: ShieldCheck },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
]

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('contractor')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0418]">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center animate-pulse-glow mb-4">
            <Sparkles size={28} className="text-white" />
          </div>
          <div className="text-[11px] text-violet-200 tracking-wider uppercase">Government Contracting OS</div>
          <h1 className="font-display text-2xl font-bold text-violet-100 text-center neon-text">ArcaBid</h1>
        </div>

        <div className="rounded-2xl bg-violet-950/40 border border-violet-400/15 backdrop-blur-sm p-6">
          <p className="text-sm text-violet-300/70 text-center mt-1 mb-7">
            {mode === 'signin' ? 'Inicia sesión para continuar' : 'Crea tu cuenta y empieza a gestionar contratos'}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {ROLES.map((r) => {
              const Icon = r.icon
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition',
                    role === r.id ? 'border-fuchsia-400 bg-fuchsia-500/10' : 'border-violet-400/20 bg-violet-950/40 hover:border-fuchsia-400/40'
                  )}
                >
                  <Icon size={18} className={role === r.id ? 'text-fuchsia-400' : 'text-violet-400'} />
                  <span className={cn('text-xs font-medium', role === r.id ? 'text-fuchsia-200' : 'text-violet-300/70')}>{r.label}</span>
                </button>
              )
            })}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
            <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded-xl px-3 py-2">{error}</p>}
            <Button variant="gold" type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="text-sm text-violet-300/70 text-center mt-6">
            {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-fuchsia-300 font-medium hover:underline">
              {mode === 'signin' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>

          <div className="mt-8 pt-6 border-t border-violet-400/15">
            {!showAdmin ? (
              <button onClick={() => setShowAdmin(true)} className="w-full flex items-center justify-center gap-2 text-sm text-violet-300/70 hover:text-fuchsia-400 transition">
                <ShieldCheck size={16} /> Acceso Super Admin
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-violet-100 font-medium">
                  <ShieldCheck size={16} className="text-fuchsia-400" /> Acceso Super Admin
                </div>
                <Input label="Código de acceso" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="••••••••" type="password" />
                <Button variant="primary" className="w-full" disabled={!adminCode}>Verificar</Button>
                <button type="button" onClick={() => { setShowAdmin(false); setAdminCode(''); setError(null) }} className="w-full text-xs text-violet-300/70 hover:text-violet-200 transition">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
