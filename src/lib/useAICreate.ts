import { useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

export function useAICreate() {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(instruction: string): Promise<{ ok: boolean; record?: any; table?: string; error?: string }> {
    setBusy(true)
    setError(null)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ question: instruction, mode: 'create' }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `Error ${res.status}`)
      }
      const data = await res.json()
      return { ok: true, record: data.record, table: data.table }
    } catch (err: any) {
      setError(err.message)
      return { ok: false, error: err.message }
    } finally {
      setBusy(false)
    }
  }

  return { create, busy, error }
}
