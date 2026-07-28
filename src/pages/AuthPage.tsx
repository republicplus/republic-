import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Sparkles, ShieldCheck, Loader as Loader2, Phone } from 'lucide-react'
import { Button, Input } from '../components/ui'

const ADMIN_CODE = 'ARCABID2025'

export function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [adminError, setAdminError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { phone } },
        })
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

  async function signInWithGoogle() {
    setGoogleBusy(true); setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
    if (error) { setError(error.message); setGoogleBusy(false) }
  }

  function verifyAdmin() {
    setAdminError(null)
    if (adminCode.trim() === ADMIN_CODE) {
      navigate('/dashboard')
    } else {
      setAdminError('Código incorrecto. Intenta de nuevo.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0418]">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center mb-4">
            <Sparkles size={28} className="text-white" />
          </div>
          <div className="text-[11px] text-violet-200 tracking-wider uppercase">Government Contracting OS</div>
          <h1 className="font-display text-2xl font-bold text-violet-100 text-center">ArcaBid</h1>
        </div>

        <div className="rounded-2xl bg-violet-950/40 border border-violet-400/15 backdrop-blur-sm p-6">
          <p className="text-sm text-violet-300/70 text-center mb-6">
            {mode === 'signin' ? 'Inicia sesión para continuar' : 'Crea tu cuenta y empieza a gestionar contratos'}
          </p>

          {/* Google */}
          <button
            onClick={signInWithGoogle}
            disabled={googleBusy}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-violet-400/20 bg-white/5 hover:bg-white/10 hover:border-violet-400/40 transition text-sm font-medium text-white mb-4"
          >
            {googleBusy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.3 5.6-4.9 7.3v6h7.9c4.6-4.3 7.3-10.6 7.3-17.5z" fill="#4285F4"/>
                <path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.8 2.3-8 2.3-6.2 0-11.4-4.2-13.3-9.8H2.6v6.2C6.5 42.6 14.7 48 24 48z" fill="#34A853"/>
                <path d="M10.7 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7v-6.2H2.6C1 17 0 20.4 0 24s1 7 2.6 10.9l8.1-6.2z" fill="#FBBC05"/>
                <path d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.9 2.4 30.5 0 24 0 14.7 0 6.5 5.4 2.6 13.1l8.1 6.2C12.6 13.7 17.8 9.5 24 9.5z" fill="#EA4335"/>
              </svg>
            )}
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-violet-400/15" />
            <span className="text-xs text-violet-400/50">o con email</span>
            <div className="flex-1 h-px bg-violet-400/15" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
            <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-violet-300/70 mb-1.5 font-medium">Teléfono (opcional)</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400/50" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-violet-950/60 border border-violet-400/20 text-sm text-white placeholder-violet-400/40 focus:outline-none focus:border-fuchsia-400/60 transition"
                  />
                </div>
              </div>
            )}
            {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded-xl px-3 py-2">{error}</p>}
            <Button variant="gold" type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="text-sm text-violet-300/70 text-center mt-5">
            {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
              className="text-fuchsia-300 font-medium hover:underline"
            >
              {mode === 'signin' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>

          {/* Admin Access */}
          <div className="mt-6 pt-5 border-t border-violet-400/15">
            {!showAdmin ? (
              <button
                onClick={() => setShowAdmin(true)}
                className="w-full flex items-center justify-center gap-2 text-sm text-violet-300/50 hover:text-fuchsia-400 transition"
              >
                <ShieldCheck size={15} /> Acceso Admin
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-violet-100 font-medium">
                  <ShieldCheck size={15} className="text-fuchsia-400" /> Acceso Admin
                </div>
                <div>
                  <label className="block text-xs text-violet-300/70 mb-1.5 font-medium">Código de acceso</label>
                  <input
                    type="password"
                    value={adminCode}
                    onChange={(e) => { setAdminCode(e.target.value); setAdminError(null) }}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-violet-950/60 border border-violet-400/20 text-sm text-white placeholder-violet-400/40 focus:outline-none focus:border-fuchsia-400/60 transition"
                    onKeyDown={(e) => e.key === 'Enter' && verifyAdmin()}
                  />
                </div>
                {adminError && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded-xl px-3 py-2">{adminError}</p>}
                <Button variant="primary" className="w-full" onClick={verifyAdmin} disabled={!adminCode}>
                  Verificar
                </Button>
                <button
                  type="button"
                  onClick={() => { setShowAdmin(false); setAdminCode(''); setAdminError(null) }}
                  className="w-full text-xs text-violet-300/50 hover:text-violet-200 transition"
                >
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
