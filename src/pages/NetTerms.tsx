import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, SectionTitle, InfoNote } from '../components/ui'
import { Plus, Search, Trash2, Pencil, CreditCard, Clock, Sparkles, Loader as Loader2, Link2, CircleCheck as CheckCircle2 } from 'lucide-react'
import { cn, formatCurrency } from '../lib/utils'

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Net 120', 'Prepay', 'Custom']
const STATUSES = ['active', 'paused', 'inactive']
const STATUS_TONE: Record<string, any> = { active: 'success', paused: 'warning', inactive: 'neutral' }
const CATEGORIES = ['Materials', 'Equipment', 'Services', 'Logistics', 'Technology', 'Office', 'Other']

type NetTermCompany = {
  id: string; company_name: string; contact_name: string | null; contact_email: string | null
  contact_phone: string | null; payment_terms: string | null; credit_limit: number | null
  available_balance: number | null; category: string | null; notes: string | null
  status: string; created_at: string
}

export function NetTerms() {
  const { session } = useAuth()
  const [rows, setRows] = useState<NetTermCompany[]>([])
  const [search, setSearch] = useState('')
  const [termsFilter, setTermsFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<any>({ company_name: '', payment_terms: 'Net 30', credit_limit: 0, available_balance: 0, status: 'active' })
  const [aiUrl, setAiUrl] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkPreview, setBulkPreview] = useState<any[]>([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkStep, setBulkStep] = useState<'input' | 'preview'>('input')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('net_terms_companies').select('*').order('created_at', { ascending: false })
    if (data) setRows(data as NetTermCompany[])
  }

  function set(k: string, v: any) { setDraft((d: any) => ({ ...d, [k]: v })) }

  async function save() {
    if (!draft.company_name?.trim()) return
    const payload = {
      company_name: draft.company_name,
      contact_name: draft.contact_name || null,
      contact_email: draft.contact_email || null,
      contact_phone: draft.contact_phone || null,
      payment_terms: draft.payment_terms || 'Net 30',
      credit_limit: draft.credit_limit ? +draft.credit_limit : 0,
      available_balance: draft.available_balance ? +draft.available_balance : 0,
      category: draft.category || null,
      notes: draft.notes || null,
      status: draft.status || 'active',
    }
    if (editId) {
      const { data } = await supabase.from('net_terms_companies').update(payload).eq('id', editId).select().single()
      if (data) setRows((r) => r.map((x) => x.id === editId ? data as NetTermCompany : x))
    } else {
      const { data } = await supabase.from('net_terms_companies').insert(payload).select().single()
      if (data) setRows((r) => [data as NetTermCompany, ...r])
    }
    close()
  }

  function edit(c: NetTermCompany) {
    setEditId(c.id)
    setDraft({
      company_name: c.company_name, contact_name: c.contact_name || '', contact_email: c.contact_email || '',
      contact_phone: c.contact_phone || '', payment_terms: c.payment_terms || 'Net 30',
      credit_limit: c.credit_limit || 0, available_balance: c.available_balance || 0,
      category: c.category || '', notes: c.notes || '', status: c.status || 'active',
    })
    setOpen(true)
  }

  async function remove(id: string) {
    await supabase.from('net_terms_companies').delete().eq('id', id)
    setRows((r) => r.filter((x) => x.id !== id))
  }

  function close() {
    setOpen(false); setEditId(null)
    setDraft({ company_name: '', payment_terms: 'Net 30', credit_limit: 0, available_balance: 0, status: 'active' })
  }

  async function aiCreateFromLink() {
    if (!aiUrl.trim()) return
    setAiBusy(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ question: 'Crea una empresa de términos de pago a partir de este enlace. Extrae nombre, contacto, email, teléfono, términos de pago, límite de crédito, categoría.', mode: 'create', linkUrl: aiUrl }),
      })
      if (!res.ok) throw new Error('Error al crear con AI')
      const data = await res.json()
      if (data.record) setRows((r) => [data.record as NetTermCompany, ...r])
      setAiOpen(false); setAiUrl('')
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setAiBusy(false) }
  }

  async function analyzeBulk() {
    if (!bulkText.trim()) return
    setBulkBusy(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ mode: 'bulk', bulkType: 'net_terms', bulkText }),
      })
      if (!res.ok) throw new Error('Error al analizar')
      const data = await res.json()
      const items = (data.net_terms || []).map((p: any) => ({ ...p, status: p.status || 'active' }))
      setBulkPreview(items)
      setBulkStep('preview')
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setBulkBusy(false) }
  }

  async function saveBulk() {
    const clean = bulkPreview.map((p) => {
      const c: any = {}
      for (const [k, v] of Object.entries(p)) { if (v !== null && v !== undefined && v !== '') c[k] = v }
      if (!c.status) c.status = 'active'
      if (!c.payment_terms) c.payment_terms = 'Net 30'
      return c
    })
    const { data } = await supabase.from('net_terms_companies').insert(clean).select()
    if (data) setRows((r) => [...(data as NetTermCompany[]), ...r])
    setBulkOpen(false); setBulkText(''); setBulkPreview([]); setBulkStep('input')
  }

  function updatePreviewItem(idx: number, field: string, value: any) {
    setBulkPreview((p) => p.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const filtered = rows.filter((c) => {
    const matchSearch = c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase())
    const matchTerms = termsFilter === 'all' || c.payment_terms === termsFilter
    return matchSearch && matchTerms
  })

  const totalCredit = rows.reduce((sum, c) => sum + (c.credit_limit || 0), 0)
  const totalAvailable = rows.reduce((sum, c) => sum + (c.available_balance || 0), 0)
  const termsCounts = PAYMENT_TERMS.map((t) => ({ term: t, count: rows.filter((c) => c.payment_terms === t).length }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-violet-100">Net 30 / 60 / 90</h1>
        <p className="text-sm text-violet-300/70 mt-1">Companies that let you pay on 30, 60, or 90-day terms</p>
      </div>

      <InfoNote title="What is Net 30 / 60 / 90?">
        <p>This is your directory of companies that extend you payment terms — meaning you can buy now and pay 30, 60, or 90 days later.</p>
        <p>Use this to manage your credit lines, track how much credit you have available with each company, and plan your cash flow around when payments are actually due.</p>
      </InfoNote>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 neon-border"><CreditCard size={18} /></div>
            <div>
              <div className="text-xs text-violet-300/70">Total Credit Lines</div>
              <div className="text-lg font-bold text-violet-100">{rows.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 neon-border"><CreditCard size={18} /></div>
            <div>
              <div className="text-xs text-violet-300/70">Total Credit Limit</div>
              <div className="text-lg font-bold text-teal-300">{formatCurrency(totalCredit)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 neon-border"><Clock size={18} /></div>
            <div>
              <div className="text-xs text-violet-300/70">Available Balance</div>
              <div className="text-lg font-bold text-amber-300">{formatCurrency(totalAvailable)}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company…" className="bg-transparent outline-none w-48 placeholder:text-violet-400/40" />
          </div>
          <Select value={termsFilter} onChange={(e) => setTermsFilter(e.target.value)} className="w-auto">
            <option value="all">All terms</option>
            {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => { setBulkStep('input'); setBulkText(''); setBulkPreview([]); setBulkOpen(true) }}><Sparkles size={16} /> Bulk upload with AI</Button>
          <Button variant="secondary" onClick={() => setAiOpen(true)}><Link2 size={16} /> Create with AI</Button>
          <Button variant="gold" onClick={() => { setEditId(null); setDraft({ company_name: '', payment_terms: 'Net 30', credit_limit: 0, available_balance: 0, status: 'active' }); setOpen(true) }}><Plus size={16} /> Add Company</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {termsCounts.filter((t) => t.count > 0).map((t) => (
          <button key={t.term} onClick={() => setTermsFilter(t.term)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition', termsFilter === t.term ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30' : 'bg-violet-950/40 text-violet-300/70 border-violet-400/15 hover:border-fuchsia-400/30')}>
            {t.term} ({t.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<CreditCard size={22} />} title="No companies yet" subtitle="Add companies that extend you Net 30, 60, or 90-day payment terms." action={<div className="flex gap-2"><Button variant="primary" onClick={() => setBulkOpen(true)}><Sparkles size={16} /> Bulk upload with AI</Button><Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Add Company</Button></div>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <Card key={c.id} hover className="p-5 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 neon-border"><CreditCard size={18} /></div>
                  <div>
                    <h3 className="font-semibold text-violet-100">{c.company_name}</h3>
                    <div className="flex gap-1 mt-0.5">
                      {c.payment_terms && <Badge tone="info">{c.payment_terms}</Badge>}
                      {c.status && <Badge tone={STATUS_TONE[c.status] || 'neutral'}>{c.status}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => edit(c)} className="p-1 text-violet-300 hover:text-fuchsia-400 transition"><Pencil size={13} /></button>
                  <button onClick={() => remove(c.id)} className="p-1 text-violet-300 hover:text-rose-400 transition"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div><span className="text-violet-300/70">Credit limit:</span> <span className="font-semibold text-teal-300">{formatCurrency(c.credit_limit)}</span></div>
                <div><span className="text-violet-300/70">Available:</span> <span className="font-semibold text-amber-300">{formatCurrency(c.available_balance)}</span></div>
                <div><span className="text-violet-300/70">Contact:</span> <span className="text-violet-200">{c.contact_name || '—'}</span></div>
                <div><span className="text-violet-300/70">Category:</span> <span className="text-violet-200">{c.category || '—'}</span></div>
              </div>
              {c.contact_email && <div className="mt-2 text-xs"><a href={`mailto:${c.contact_email}`} className="text-violet-300 hover:text-fuchsia-400 transition">{c.contact_email}</a></div>}
              {c.notes && <p className="text-xs text-violet-300/70 mt-3 line-clamp-2">{c.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      {/* Manual modal */}
      <Modal open={open} onClose={close} title={editId ? 'Edit company' : 'Add company'} wide>
        <div className="space-y-5">
          <SectionTitle title="Company info" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Company name" value={draft.company_name || ''} onChange={(e) => set('company_name', e.target.value)} placeholder="e.g. Home Depot Pro" />
            <Select label="Category" value={draft.category || ''} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>

          <SectionTitle title="Payment terms" />
          <div className="grid grid-cols-3 gap-4">
            <Select label="Terms" value={draft.payment_terms || 'Net 30'} onChange={(e) => set('payment_terms', e.target.value)}>
              {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Credit limit ($)" type="number" value={draft.credit_limit || ''} onChange={(e) => set('credit_limit', +e.target.value)} />
            <Input label="Available ($)" type="number" value={draft.available_balance || ''} onChange={(e) => set('available_balance', +e.target.value)} />
          </div>

          <SectionTitle title="Contact" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact name" value={draft.contact_name || ''} onChange={(e) => set('contact_name', e.target.value)} />
            <Input label="Email" type="email" value={draft.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} />
            <Input label="Phone" value={draft.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} />
            <Select label="Status" value={draft.status || 'active'} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </Select>
          </div>
          <Textarea label="Notes" value={draft.notes || ''} onChange={(e) => set('notes', e.target.value)} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button variant="gold" onClick={save} disabled={!draft.company_name?.trim()}>{editId ? 'Save changes' : 'Add company'}</Button>
          </div>
        </div>
      </Modal>

      {/* Single AI link modal */}
      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="Create company with AI">
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Paste the company link and the AI will extract name, contact, payment terms, credit limit and more.</p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20">
            <Link2 size={15} className="text-fuchsia-400" />
            <input value={aiUrl} onChange={(e) => setAiUrl(e.target.value)} placeholder="https://homedepotpro.com" className="flex-1 bg-transparent outline-none text-sm text-violet-50 placeholder:text-violet-400/40" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAiOpen(false)}>Cancel</Button>
            <Button variant="gold" onClick={aiCreateFromLink} disabled={aiBusy || !aiUrl.trim()}>
              {aiBusy ? <><Loader2 size={16} className="animate-spin" /> Extracting…</> : <><Sparkles size={16} /> Create with AI</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk AI modal */}
      <Modal open={bulkOpen} onClose={() => { setBulkOpen(false); setBulkStep('input'); setBulkText(''); setBulkPreview([]) }} title="Bulk upload companies with AI" wide>
        {bulkStep === 'input' ? (
          <div className="space-y-4">
            <p className="text-sm text-violet-300/70">Paste or upload a text with a list of companies that offer payment terms. The AI will extract and organize each company automatically.</p>
            <Textarea label="Text with companies" value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Paste your list of companies here…" className="min-h-[200px]" />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setBulkOpen(false); setBulkText('') }}>Cancel</Button>
              <Button variant="gold" onClick={analyzeBulk} disabled={bulkBusy || !bulkText.trim()}>
                {bulkBusy ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</> : <><Sparkles size={16} /> Analyze with AI</>}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-violet-300/70">Review and edit before saving. Found <span className="text-fuchsia-300 font-semibold">{bulkPreview.length}</span> companies.</p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {bulkPreview.map((p, i) => (
                <Card key={i} className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Company name" value={p.company_name || ''} onChange={(e) => updatePreviewItem(i, 'company_name', e.target.value)} />
                    <Input label="Contact name" value={p.contact_name || ''} onChange={(e) => updatePreviewItem(i, 'contact_name', e.target.value)} />
                    <Input label="Email" value={p.contact_email || ''} onChange={(e) => updatePreviewItem(i, 'contact_email', e.target.value)} />
                    <Input label="Phone" value={p.contact_phone || ''} onChange={(e) => updatePreviewItem(i, 'contact_phone', e.target.value)} />
                    <Input label="Payment terms" value={p.payment_terms || ''} onChange={(e) => updatePreviewItem(i, 'payment_terms', e.target.value)} placeholder="Net 30" />
                    <Input label="Credit limit" value={p.credit_limit || ''} onChange={(e) => updatePreviewItem(i, 'credit_limit', e.target.value)} />
                    <Input label="Category" value={p.category || ''} onChange={(e) => updatePreviewItem(i, 'category', e.target.value)} />
                    <Input label="Available" value={p.available_balance || ''} onChange={(e) => updatePreviewItem(i, 'available_balance', e.target.value)} />
                  </div>
                  <Textarea label="Notes" value={p.notes || ''} onChange={(e) => updatePreviewItem(i, 'notes', e.target.value)} className="mt-2" />
                </Card>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setBulkStep('input')}>Back</Button>
              <Button variant="gold" onClick={saveBulk}><CheckCircle2 size={16} /> Save companies</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
