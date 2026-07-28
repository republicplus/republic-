import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthCtx = { session: Session | null; user: Session['user'] | null; loading: boolean; isAdmin: boolean; signOut: () => Promise<void> }

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, isAdmin: false, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('arcabid_admin') === '1')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) {
        localStorage.removeItem('arcabid_admin')
        setIsAdmin(false)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    localStorage.removeItem('arcabid_admin')
    setIsAdmin(false)
    await supabase.auth.signOut()
  }

  return <Ctx.Provider value={{ session, user: session?.user ?? null, loading, isAdmin, signOut }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
