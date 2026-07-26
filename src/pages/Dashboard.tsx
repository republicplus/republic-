import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { AIOrb } from '../components/AIOrb'
import { Card, Button, Badge, Input } from '../components/ui'
import { Plus, Send, Save, Folder, Search, MessageSquare, Sparkles, Trash2 } from 'lucide-react'
import { cn, formatCurrency, formatDate, daysUntil } from '../lib/utils'

interface Chat { id: string; title: string; folder: string | null; updated_at: string }
interface Msg { id: string; role: string; content: string }

const SUGGESTIONS = [
  'Explícame la cláusula FAR 52.232-1',
  '¿Cómo registro mi empresa en SAM.gov?',
  '¿Qué códigos NAICS necesito para IT?',
  'Redacta un capability statement',
  'Calcula el margen de un contrato de $250k',
  'Recomienda proveedores Net 30 para office supplies',
]

function aiReply(prompt: string): string {
  const p = prompt.toLowerCase()
  if (p.includes('far')) return 'La Federal Acquisition Regulation (FAR) es el conjunto de reglas que rige las adquisiciones del gobierno federal de EE.UU. La cláusula FAR 52.232-1 establece que el gobierno paga en términos net 30 días tras recibir una factura adecuada y la aceptación de los bienes/servicios. Para cumplir, asegúrate de facturar a través del sistema correcto (WAWF/IPAC) y mantener documentación de aceptación.'
  if (p.includes('sam')) return 'Para registrarte en SAM.gov: 1) Crea una cuenta en login.gov con identidad verificada, 2) Inicia sesión en SAM.gov y selecciona "Register Entity", 3) Completa las secciones: Core Data, Assertions, Representations & Certifications, Points of Contact, y 4) Envía para validación (puede tardar 7-10 días). La renovación es anual.'
  if (p.includes('naics')) return 'Los códigos NAICS clasifican tu negocio por industria. Para IT, los comunes son: 541512 (Diseño de sistemas), 541511 (Programación), 518210 (Hosting). Verifica el size standard en SBA según tu revenue o empleados. Un código correcto es crítico para ganar set-aside contracts.'
  if (p.includes('capability')) return 'Un Capability Statement es tu tarjeta de presentación federal. Estructura: 1) Resumen ejecutivo (2-3 líneas), 2) Diferenciadores, 3) Capacidades core, 4) Set-aside certifications, 5) Past performance, 6) Datos de contacto. Mantenlo a 1-2 páginas en PDF con tu branding.'
  if (p.includes('margen') || p.includes('margin')) return 'Para un contrato de $250,000: si tus costos (producto + shipping + overhead) son $175,000, tu ganancia es $75,000 = 30% de margen. En government contracting, márgenes típicos son 15-35%. Considera overhead G&A (8-12%) y fees de cumplimiento.'
  if (p.includes('net 30') || p.includes('proveedor')) return 'Para office supplies Net 30, busca proveedores con: distribución nacional, términos de crédito establecidos, y capacidad de envío a agencias. Verifica que acepten POs gubernamentales y ofrezcan W-9. Plataformas como ArcaBid te permiten guardar y comparar proveedores por rating y estados.'
  if (p.includes('capital') || p.includes('financ')) return 'Opciones de capital para contratos: 1) Factoring (vender facturas, 1-3% fee), 2) Purchase Order Financing (cubrir costos del proveedor), 3) SBA CAPLines (líneas para contratos), 4) MCA (avance sobre efectivo, más caro), 5) Invoice Financing. Elige según tu ciclo de caja y margen.'
  if (p.includes('sba')) return 'La SBA ofrece: 8(a) Business Development (9 años, firmas en desventaja), HUBZone (áreas designadas), WOSB/EDWOSB (mujeres), SDVOSB (veteranos). Estas certificaciones abren set-aside contracts exclusivos. Reúne documentación y aplica en SBA.gov.'
  return 'Soy el Orbe AI de ArcaBid, especializado en Government Contracting. Puedo ayudarte con: cláusulas FAR, registro SAM.gov, códigos NAICS/PSC, redacción de propuestas, pricing y márgenes, proveedores Net 30, fuentes de capital, compliance, cronogramas de entrega y más. ¿Sobre cuál de estos temas quieres profundizar?'
}

export function Dashboard() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [thinking, setThinking] = useState(false)
  const [contracts, setContracts] = useState<any[]>([])
  const [wallet, setWallet] = useState<any[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadChats(); loadDashboard() }, [])

  useEffect(() => { if (activeChat) loadMessages(activeChat.id) }, [activeChat])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, thinking])

  async function loadChats() {
    const { data } = await supabase.from('ai_chats').select('*').order('updated_at', { ascending: false })
    if (data) setChats(data)
  }
  async function loadMessages(chatId: string) {
    const { data } = await supabase.from('ai_messages').select('*').eq('chat_id', chatId).order('created_at')
    if (data) setMessages(data as unknown as Msg[])
  }
  async function loadDashboard() {
    const { data: c } = await supabase.from('contracts').select('*').order('created_at', { ascending: false })
    if (c) setContracts(c)
    const { data: w } = await supabase.from('wallet_transactions').select('*').order('date', { ascending: false }).limit(5)
    if (w) setWallet(w)
  }

  async function newChat() {
    const { data } = await supabase.from('ai_chats').insert({ title: 'New chat' }).select().single()
    if (data) { setActiveChat(data); setMessages([]); loadChats(); }
  }

  async function send() {
    if (!input.trim()) return
    let chat = activeChat
    if (!chat) {
      const { data } = await supabase.from('ai_chats').insert({ title: input.slice(0, 40) }).select().single()
      if (data) { chat = data; setActiveChat(data); loadChats(); }
    }
    const userMsg = input.trim()
    setInput('')
    setThinking(true)
    await supabase.from('ai_messages').insert({ chat_id: chat!.id, role: 'user', content: userMsg })
    setMessages((m) => [...m, { id: 'tmp-u', role: 'user', content: userMsg }])
    if (chat!.title === 'New chat') {
      await supabase.from('ai_chats').update({ title: userMsg.slice(0, 40), updated_at: new Date().toISOString() }).eq('id', chat!.id)
      loadChats()
    }
    setTimeout(async () => {
      const reply = aiReply(userMsg)
      await supabase.from('ai_messages').insert({ chat_id: chat!.id, role: 'assistant', content: reply })
      setMessages((m) => [...m, { id: 'tmp-a', role: 'assistant', content: reply }])
      setThinking(false)
    }, 700)
  }

  async function deleteChat(id: string) {
    await supabase.from('ai_chats').delete().eq('id', id)
    if (activeChat?.id === id) { setActiveChat(null); setMessages([]) }
    loadChats()
  }

  const filteredChats = chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))

  const activeContracts = contracts.filter((c) => c.status === 'won' || c.status === 'awarded')
  const pending = contracts.filter((c) => c.status === 'pending' || c.status === 'applied' || c.status === 'review')
  const upcomingDeliveries = contracts.filter((c) => c.delivery_date && (daysUntil(c.delivery_date) ?? 999) >= 0).sort((a, b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime()).slice(0, 4)
  const upcomingPayments = contracts.filter((c) => c.payment_date && (daysUntil(c.payment_date) ?? 999) >= 0).sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()).slice(0, 4)
  const totalValue = activeContracts.reduce((s, c) => s + (c.total_value || 0), 0)
  const pendingValue = pending.reduce((s, c) => s + (c.total_value || 0), 0)

  const kpis = [
    { label: 'Contratos Activos', value: activeContracts.length.toString(), tone: 'success' as const, sub: formatCurrency(totalValue) },
    { label: 'Licitaciones Pendientes', value: pending.length.toString(), tone: 'warning' as const, sub: formatCurrency(pendingValue) },
    { label: 'Próximas Entregas', value: upcomingDeliveries.length.toString(), tone: 'info' as const, sub: 'en 30 días' },
    { label: 'Capital Disponible', value: formatCurrency(0), tone: 'gold' as const, sub: 'Wallet' },
  ]

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* AI section */}
      <div className="col-span-12 xl:col-span-8 space-y-6">
        <Card className="overflow-hidden">
          <div className="navy-gradient p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-gold-400/10 blur-3xl" />
            <AIOrb size={120} active={thinking} />
            <h2 className="font-display text-2xl font-bold text-white mt-6">Orbe de Inteligencia Artificial</h2>
            <p className="text-navy-200 text-sm mt-1.5 max-w-md">
              Especializado en Government Contracting — FAR, SAM.gov, SBA, NAICS, propuestas, pricing, capital y más.
            </p>
          </div>

          <div className="flex h-[420px]">
            {/* chat list */}
            <div className="w-56 border-r border-line flex flex-col">
              <div className="p-3 border-b border-line">
                <Button variant="gold" size="sm" className="w-full" onClick={newChat}><Plus size={14} /> Nuevo Chat</Button>
              </div>
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-navy-50 text-muted text-xs">
                  <Search size={13} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="bg-transparent outline-none flex-1" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-2 space-y-0.5">
                {filteredChats.length === 0 && <div className="text-xs text-muted text-center py-6">Sin conversaciones</div>}
                {filteredChats.map((c) => (
                  <div key={c.id} className={cn('group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition', activeChat?.id === c.id ? 'bg-navy-900 text-white' : 'hover:bg-navy-50 text-navy-700')} onClick={() => setActiveChat(c)}>
                    <MessageSquare size={14} className={activeChat?.id === c.id ? 'text-gold-400' : 'text-muted'} />
                    <span className="text-xs truncate flex-1">{c.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id) }} className="opacity-0 group-hover:opacity-100 text-muted hover:text-error-600 transition"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* messages */}
            <div className="flex-1 flex flex-col">
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
                {messages.length === 0 && !thinking && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Sparkles size={28} className="text-gold-400 mb-3" />
                    <p className="text-sm text-muted max-w-xs">Pregúntame sobre FAR, SAM.gov, NAICS, propuestas, pricing, capital o proveedores.</p>
                    <div className="grid grid-cols-2 gap-2 mt-5 max-w-md">
                      {SUGGESTIONS.slice(0, 4).map((s) => (
                        <button key={s} onClick={() => { setInput(s); }} className="text-left text-xs text-navy-700 px-3 py-2 rounded-xl border border-line hover:border-navy-200 hover:bg-navy-50 transition">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={cn('flex gap-3 animate-fade-up', m.role === 'user' ? 'justify-end' : '')}>
                    {m.role === 'assistant' && <div className="w-7 h-7 rounded-lg navy-gradient flex items-center justify-center shrink-0"><Sparkles size={13} className="text-gold-400" /></div>}
                    <div className={cn('max-w-[75%] px-4 py-2.5 rounded-2xl text-sm', m.role === 'user' ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-800')}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {thinking && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-7 h-7 rounded-lg navy-gradient flex items-center justify-center shrink-0"><Sparkles size={13} className="text-gold-400" /></div>
                    <div className="bg-navy-50 px-4 py-3 rounded-2xl flex gap-1">
                      {[0,1,2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-navy-400 animate-pulse-soft" style={{ animationDelay: `${i*0.2}s` }} />)}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-line flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Escribe tu pregunta…" className="flex-1" />
                <Button variant="primary" onClick={send}><Send size={15} /></Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* KPIs + activity */}
      <div className="col-span-12 xl:col-span-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {kpis.map((k) => (
            <Card key={k.label} hover className="p-5">
              <div className="text-xs text-muted">{k.label}</div>
              <div className="font-display text-2xl font-bold text-navy-900 mt-1">{k.value}</div>
              <div className="mt-2"><Badge tone={k.tone}>{k.sub}</Badge></div>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-navy-900">Próximas Entregas</h3>
            <Badge tone="info">{upcomingDeliveries.length}</Badge>
          </div>
          <div className="space-y-2.5">
            {upcomingDeliveries.length === 0 && <p className="text-sm text-muted">Sin entregas próximas.</p>}
            {upcomingDeliveries.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-navy-800">{c.title}</span>
                <span className="text-xs text-muted shrink-0 ml-2">{formatDate(c.delivery_date)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-navy-900">Próximos Pagos</h3>
            <Badge tone="gold">{upcomingPayments.length}</Badge>
          </div>
          <div className="space-y-2.5">
            {upcomingPayments.length === 0 && <p className="text-sm text-muted">Sin pagos próximos.</p>}
            {upcomingPayments.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-navy-800">{c.title}</span>
                <span className="text-xs text-muted shrink-0 ml-2">{formatCurrency(c.total_value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-navy-900 mb-3">Actividad Reciente</h3>
          <div className="space-y-2.5">
            {wallet.length === 0 && contracts.length === 0 && <p className="text-sm text-muted">Sin actividad aún.</p>}
            {contracts.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className={cn('w-2 h-2 rounded-full', c.status === 'won' ? 'bg-success-500' : 'bg-warning-500')} />
                <span className="truncate text-navy-800 flex-1">{c.title}</span>
                <span className="text-xs text-muted capitalize">{c.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
