import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, EmptyState } from '../components/ui'
import { AIOrb } from '../components/AIOrb'
import { Sparkles, Send, Plus, MessageSquare, Trash2, FileText, Upload, Loader as Loader2, Paperclip } from 'lucide-react'
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
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null)
  const [attachedFileUrl, setAttachedFileUrl] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
    if ((!question.trim() && !attachedFile) || busy) return
    setError(null)

    let imageUrl = attachedImageUrl
    let fileUrl = attachedFileUrl
    let fileType = attachedFile?.type

    // Upload PDF to storage if needed
    if (attachedFile && attachedFile.type === 'application/pdf' && !fileUrl) {
      const ext = attachedFile.name.split('.').pop()
      const path = `ai-uploads/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('documents').upload(path, attachedFile)
      if (!upErr) {
        const { data: pub } = supabase.storage.from('documents').getPublicUrl(path)
        fileUrl = pub.publicUrl
      }
    }

    const q = question.trim() || 'Analiza este documento y dame un resumen completo.'

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
        await supabase.from('ai_chats').update({ title: q.slice(0, 50), updated_at: new Date().toISOString() }).eq('id', chatId)
        setChats((cs) => cs.map((c) => c.id === chatId ? { ...c, title: q.slice(0, 50) } : c))
      }
    }

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: q + (attachedFile ? ` \n📎 ${attachedFile.name}` : '') }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setAttachedFile(null); setAttachedImageUrl(null); setAttachedFileUrl(null)
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
          question: q,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          imageUrl,
          fileUrl,
          fileType,
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
          { chat_id: chatId, role: 'user', content: q },
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
            <h1 className="text-xl font-bold text-violet-100">Orbe AI</h1>
            <p className="text-sm text-violet-300/70">Pregunta sobre tus contratos del gobierno</p>
          </div>
        </div>
        <Button variant="gold" onClick={newChat}><Plus size={16} /> Nueva consulta</Button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <Card className="p-3 h-fit max-h-[70vh] overflow-y-auto no-scrollbar">
          {chats.length === 0 ? (
            <p className="text-sm text-violet-300/70 text-center py-6">Sin consultas aún</p>
          ) : (
            <div className="space-y-1">
              {chats.map((c) => (
                <div key={c.id} className={cn('group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition', activeChat === c.id ? 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/30' : 'hover:bg-violet-500/10 text-violet-300/80')}>
                  <button onClick={() => setActiveChat(c.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                    <MessageSquare size={14} className="shrink-0" />
                    <span className="text-sm truncate">{c.title}</span>
                  </button>
                  <button onClick={() => deleteChat(c.id)} className={cn('opacity-0 group-hover:opacity-100 transition', activeChat === c.id ? 'text-white/60 hover:text-white' : 'text-violet-400 hover:text-rose-400')}>
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
                  <button key={s} onClick={() => ask(s)} className="text-xs px-3 py-1.5 rounded-full border border-violet-400/20 bg-violet-950/40 text-violet-200 hover:border-fuchsia-400/40 hover:bg-violet-500/10 transition">
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
                  <div className={cn('max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed', m.role === 'user' ? 'bg-violet-900 text-white rounded-br-sm' : 'bg-violet-500/10 text-violet-100 rounded-bl-sm')}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex gap-3">
                  <AIOrb size={28} active />
                  <div className="bg-violet-500/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <div className="px-5 py-2 text-sm text-rose-300 bg-rose-500/10 border-t border-rose-400/20">{error}</div>}

          <div className="border-t border-violet-400/15 p-4">
            {attachedFile && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-400/20 text-sm text-violet-200">
                <Paperclip size={14} className="text-fuchsia-400" />
                <span className="truncate flex-1">{attachedFile.name}</span>
                <button onClick={() => { setAttachedFile(null); setAttachedImageUrl(null); setAttachedFileUrl(null) }} className="text-violet-300 hover:text-rose-400 transition">×</button>
              </div>
            )}
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setAttachedFile(f)
                if (f.type.startsWith('image/')) {
                  const reader = new FileReader()
                  reader.onload = () => setAttachedImageUrl(reader.result as string)
                  reader.readAsDataURL(f)
                }
              }} />
              <button onClick={() => fileRef.current?.click()} className="w-10 h-10 rounded-xl border border-violet-400/20 bg-violet-950/40 flex items-center justify-center text-violet-300 hover:text-fuchsia-400 hover:border-fuchsia-400/40 transition shrink-0" title="Subir imagen o PDF">
                <Upload size={16} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask(input))}
                placeholder="Escribe tu pregunta o sube un documento…"
                disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 text-sm text-violet-50 placeholder:text-violet-400/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/50 transition disabled:opacity-50"
              />
              <Button variant="gold" onClick={() => ask(input)} disabled={busy || (!input.trim() && !attachedFile)}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
