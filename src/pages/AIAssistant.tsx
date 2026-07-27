import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input } from '../components/ui'
import { Sparkles, Send, Plus, MessageSquare, Trash2, Upload, Loader as Loader2, Paperclip } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'

type Msg = { id: string; role: 'user' | 'assistant'; content: string }
type Chat = { id: string; title: string; updated_at: string }

export function AIAssistant() {
  const { session } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadChats() }, [])
  useEffect(() => { if (chatId) loadMessages(chatId) }, [chatId])
  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }) }, [messages])

  async function loadChats() {
    const { data } = await supabase.from('ai_chats').select('*').order('updated_at', { ascending: false })
    if (data) setChats(data as Chat[])
  }

  async function loadMessages(cid: string) {
    const { data } = await supabase.from('ai_messages').select('*').eq('chat_id', cid).order('created_at', { ascending: true })
    if (data) setMessages(data.map((m: any) => ({ id: m.id, role: m.role, content: m.content })))
  }

  async function newChat() {
    const { data } = await supabase.from('ai_chats').insert({ title: 'Nueva consulta' }).select().single()
    if (data) { setChats((c) => [data as Chat, ...c]); setChatId(data.id); setMessages([]) }
  }

  async function ask(question: string) {
    if ((!question.trim() && !attachedFile) || busy) return
    setError(null)

    let imageUrl = attachedImageUrl
    let fileUrl: string | null = null
    let fileType = attachedFile?.type

    if (attachedFile && attachedFile.type === 'application/pdf') {
      const ext = attachedFile.name.split('.').pop()
      const path = `ai-uploads/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('documents').upload(path, attachedFile)
      if (!upErr) {
        const { data: pub } = supabase.storage.from('documents').getPublicUrl(path)
        fileUrl = pub.publicUrl
      }
    }

    const q = question.trim() || 'Analiza este documento y dame un resumen completo.'

    if (!chatId) { await newChat() }

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: q + (attachedFile ? ` \n📎 ${attachedFile.name}` : '') }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setAttachedFile(null); setAttachedImageUrl(null)
    setBusy(true)

    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ question: q, history: messages.map((m) => ({ role: m.role, content: m.content })), imageUrl, fileUrl, fileType }),
      })
      if (!res.ok) throw new Error('Error en el asistente')
      const data = await res.json()
      const answer = data.answer || 'No pude generar una respuesta.'
      const aiMsg: Msg = { id: crypto.randomUUID(), role: 'assistant', content: answer }
      setMessages((m) => [...m, aiMsg])

      if (chatId) {
        await supabase.from('ai_messages').insert([
          { chat_id: chatId, role: 'user', content: q },
          { chat_id: chatId, role: 'assistant', content: answer },
        ])
        await supabase.from('ai_chats').update({ title: q.slice(0, 50), updated_at: new Date().toISOString() }).eq('id', chatId)
        loadChats()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteChat(id: string) {
    await supabase.from('ai_messages').delete().eq('chat_id', id)
    await supabase.from('ai_chats').delete().eq('id', id)
    setChats((c) => c.filter((x) => x.id !== id))
    if (chatId === id) { setChatId(null); setMessages([]) }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-3rem)]">
      {/* Chat list */}
      <div className="w-64 shrink-0 flex flex-col">
        <Button variant="gold" onClick={newChat} className="w-full mb-3"><Plus size={16} /> Nueva consulta</Button>
        <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar">
          {chats.map((c) => (
            <div key={c.id} className={cn('group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition', chatId === c.id ? 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/30' : 'text-violet-300/70 hover:bg-violet-500/5 border border-transparent')} onClick={() => setChatId(c.id)}>
              <MessageSquare size={14} className="shrink-0" />
              <span className="text-sm truncate flex-1">{c.title}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id) }} className="opacity-0 group-hover:opacity-100 text-violet-400 hover:text-rose-400 transition"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-violet-400/15">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center animate-float-orb">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-violet-100">Orbe AI</h2>
            <p className="text-xs text-violet-300/70">Asistente experto en contratos del gobierno</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center animate-pulse-glow mb-4">
                <Sparkles size={28} className="text-white" />
              </div>
              <h3 className="font-display text-lg font-semibold text-violet-100">Orbe AI</h3>
              <p className="text-sm text-violet-300/70 mt-1 max-w-sm">Pregúntame sobre tus contratos, sube un PDF o imagen para analizar, o pídame recomendaciones.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[80%] px-4 py-3 rounded-2xl text-sm', m.role === 'user' ? 'bg-violet-900/60 text-violet-50' : 'bg-violet-950/50 border border-violet-400/15 text-violet-100')}>{m.content}</div>
            </div>
          ))}
          {busy && <div className="flex justify-start"><div className="px-4 py-3 rounded-2xl bg-violet-950/50 border border-violet-400/15"><Loader2 size={16} className="animate-spin text-fuchsia-400" /></div></div>}
        </div>

        {error && <div className="px-5 py-2 text-sm text-rose-300 bg-rose-500/10 border-t border-rose-400/20">{error}</div>}

        <div className="border-t border-violet-400/15 p-4">
          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-400/20 text-sm text-violet-200">
              <Paperclip size={14} className="text-fuchsia-400" />
              <span className="truncate flex-1">{attachedFile.name}</span>
              <button onClick={() => { setAttachedFile(null); setAttachedImageUrl(null) }} className="text-violet-300 hover:text-rose-400 transition">×</button>
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
  )
}
