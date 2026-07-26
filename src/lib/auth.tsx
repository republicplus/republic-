import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

type Role = 'contractor' | 'investor' | 'insurer' | 'admin'

const ADMIN_EMAIL = 'admin@arcabid.app'
const ADMIN_CODE = '27101991'

interface AuthState {
  session: Session | null
  user: User | null
  role: Role
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, role: Role) => Promise<{ error: string | null }>
  adminSignIn: (code: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  setRole: (r: Role) => void
}

const Ctx = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role>(() => (localStorage.getItem('arcabid_role') as Role) || 'contractor')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn: AuthState['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  const signUp: AuthState['signUp'] = async (email, password, r) => {
    setRole(r)
    localStorage.setItem('arcabid_role', r)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: r } },
    })
    if (error) return { error: error.message }
    if (data.session) setSession(data.session)
    return { error: null }
  }

  const adminSignIn: AuthState['adminSignIn'] = async (code) => {
    if (code !== ADMIN_CODE) return { error: 'Código de administrador incorrecto.' }
    const { data: sess, error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_CODE })
    if (error) {
      const { error: upErr } = await supabase.auth.signUp({ email: ADMIN_EMAIL, password: ADMIN_CODE, options: { data: { role: 'admin' } } })
      if (upErr) return { error: upErr.message }
      const { data: s2, error: s2Err } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_CODE })
      if (s2Err) return { error: s2Err.message }
      if (s2.session) setSession(s2.session)
    } else if (sess.session) {
      setSession(sess.session)
    }
    handleSetRole('admin')
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  const handleSetRole = (r: Role) => {
    setRole(r)
    localStorage.setItem('arcabid_role', r)
  }

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, role, loading, signIn, signUp, adminSignIn, signOut, setRole: handleSetRole }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
