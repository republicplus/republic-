import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, EmptyState } from '../components/ui'
import { AIOrb } from '../components/AIOrb'
import { Sparkles, Send, Plus, MessageSquare, Trash2, FileText } from 'lucide-react'
import { cn } from '../lib/utils'

type Msg = { id: string; role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  '¿Cuál es el valor total de mis contratos?',
  '¿Qué contratos vencen pronto?',
  '¿Cuál es mi margen promedio?',
  '¿Qué pasos me faltan en el checklist?',
  '¿Qué contratos están en riesgo?',
]

export function AIAssistant() {
  const { session } = useAuth()
  const [chats, setChats] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadChats() }, [])

  useEffect(() => {
    if (activeChat) loadMessages(activeChat)
    else setMessages([])
  }, [activeChat])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function loadChats() {
    const { data } = await supabase.from('ai_chats').select('*').order('updated_at', { ascending: false })
    if (data) setChats(data)
  }

  async function loadMessages(chatId: string) {
    const { data } = await supabase.from('ai_messages').select('*').eq('chat_id', chatId).order('created_at')
    if (data) setMessages(data.map((m: any) => ({ id: m.id, role: m.role, content: m.content })))
  }

  async function newChat() {
    const { data } = await supabase.from('ai_chats').insert({ title: 'Nueva consulta' }).select().single()
    if (data) {
      setChats((c) => [data, ...c])
      setActiveChat(data.id)
      setMessages([])
    }
  }

  async function deleteChat(id: string) {
    await supabase.from('ai_chats').delete().eq('id', id)
    setChats((c) => c.filter((x) => x.id !== id))
    if (activeChat === id) { setActiveChat(null); setMessages([]) }
  }

  async function ask(question: string) {
    if (!question.trim() || busy) return
    setError(null)

    let chatId = activeChat
    if (!chatId) {
      const { data } = await supabase.from('ai_chats').insert({ title: question.slice(0, 50) }).select().single()
      if (data) {
        chatId = data.id
        setChats((c) => [data, ...c])
        setActiveChat(data.id)
      }
    } else {
      const chat = chats.find((c) => c.id === chatId)
      if (chat && chat.title === 'Nueva consulta') {
        await supabase.from('ai_chats').update({ title: question.slice(0, 50), updated_at: new Date().toISOString() }).eq('id', chatId)
        setChats((cs) => cs.map((c) => c.id === chatId ? { ...c, title: question.slice(0, 50) } : c))
      }
    }

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: question }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setBusy(true)

    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          question,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `Error ${res.status}`)
      }

      const data = await res.json()
      const answer = data.answer

      const aiMsg: Msg = { id: crypto.randomUUID(), role: 'assistant', content: answer }
      setMessages((m) => [...m, aiMsg])

      if (chatId) {
        await supabase.from('ai_messages').insert([
          { chat_id: chatId, role: 'user', content: question },
          { chat_id: chatId, role: 'assistant', content: answer },
        ])
        await supabase.from('ai_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId)
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el asistente')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AIOrb size={44} active={busy} />
          <div>
            <h1 className="text-xl font-bold text-navy-900">Orbe AI</h1>
            <p className="text-sm text-muted">Pregunta sobre tus contratos del gobierno</p>
          </div>
        </div>
        <Button variant="gold" onClick={newChat}><Plus size={16} /> Nueva consulta</Button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <Card className="p-3 h-fit max-h-[70vh] overflow-y-auto no-scrollbar">
          {chats.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">Sin consultas aún</p>
          ) : (
            <div className="space-y-1">
              {chats.map((c) => (
                <div key={c.id} className={cn('group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition', activeChat === c.id ? 'bg-navy-900 text-white' : 'hover:bg-navy-50 text-navy-700')}>
                  <button onClick={() => setActiveChat(c.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                    <MessageSquare size={14} className="shrink-0" />
                    <span className="text-sm truncate">{c.title}</span>
                  </button>
                  <button onClick={() => deleteChat(c.id)} className={cn('opacity-0 group-hover:opacity-100 transition', activeChat === c.id ? 'text-white/60 hover:text-white' : 'text-muted hover:text-error-600')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col h-[70vh]">
          {!activeChat && messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <EmptyState
                icon={<Sparkles size={24} />}
                title="Pregunta sobre tus contratos"
                subtitle="Ejemplo: ¿Cuál es el valor total de mis contratos? ¿Qué vence pronto?"
              />
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mt-2 px-6">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => ask(s)} className="text-xs px-3 py-1.5 rounded-full border border-line bg-white text-navy-700 hover:border-navy-200 hover:bg-navy-50 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {m.role === 'assistant' && <div className="shrink-0 mt-1"><AIOrb size={28} /></div>}
                  <div className={cn('max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed', m.role === 'user' ? 'bg-navy-900 text-white rounded-br-sm' : 'bg-navy-50 text-navy-800 rounded-bl-sm')}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex gap-3">
                  <AIOrb size={28} active />
                  <div className="bg-navy-50 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-navy-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-navy-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-navy-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <div className="px-5 py-2 text-sm text-error-600 bg-red-50 border-t border-red-100">{error}</div>}

          <div className="border-t border-line p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask(input))}
                placeholder="Escribe tu pregunta sobre contratos…"
                disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-xl border border-line bg-white text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/40 focus:border-navy-300 transition disabled:opacity-50"
              />
              <Button variant="gold" onClick={() => ask(input)} disabled={busy || !input.trim()}>
                <Send size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
