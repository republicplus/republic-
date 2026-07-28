import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthCtx = {
  session: Session | null
  user: Session['user'] | null
  role: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ session: null, user: null, role: null, loading: false, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) setRole(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) { setRole(null); return }
    (async () => {
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      setRole(data?.role ?? 'contractor')
    })()
  }, [session?.user?.id])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return <Ctx.Provider value={{ session, user: session?.user ?? null, role, loading, signOut }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
