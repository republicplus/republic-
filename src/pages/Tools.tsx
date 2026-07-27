import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, InfoNote } from '../components/ui'
import { Plus, ExternalLink, Search, Trash2, Link2, Wrench, FileText, Pencil, Sparkles, Loader as Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

type LinkItem = {
  id: string; name: string; url: string; description: string | null; category: string; created_at: string
}

const DEFAULT_LINKS = [
  { name: 'SAM.gov', url: 'https://sam.gov', desc: 'Registro federal de entidades', category: 'bid' },
  { name: 'SBA', url: 'https://sba.gov', desc: 'Small Business Administration', category: 'bid' },
  { name: 'DSBS', url: 'https://dsbs.sba.gov', desc: 'Dynamic Small Business Search', category: 'bid' },
  { name: 'FPDS', url: 'https://fpds.gov', desc: 'Federal Procurement Data System', category: 'bid' },
  { name: 'USAspending', url: 'https://usaspending.gov', desc: 'Gasto federal público', category: 'bid' },
  { name: 'Beta SAM', url: 'https://beta.sam.gov', desc: 'Portal de oportunidades', category: 'bid' },
]

export function Tools() {
  const { session } = useAuth()
  const [links, setLinks] = useState<LinkItem[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: '', url: '', description: '', category: 'tool' })
  const [aiUrl, setAiUrl] = useState('')
  const [aiCategory, setAiCategory] = useState('tool')
  const [aiBusy, setAiBusy] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('tools_links').select('*').order('created_at', { ascending: false })
    if (data && data.length > 0) {
      setLinks(data)
    } else if (data && data.length === 0) {
      const inserts = DEFAULT_LINKS.map((l) => ({ name: l.name, url: l.url, description: l.desc, category: l.category }))
      const { data: seeded } = await supabase.from('tools_links').insert(inserts).select()
      if (seeded) setLinks(seeded)
    }
  }

  async function save() {
    if (!draft.name.trim() || !draft.url.trim()) return
    const payload = { name: draft.name, url: draft.url.startsWith('http') ? draft.url : `https://${draft.url}`, description: draft.description, category: draft.category }
    if (editId) {
      const { data } = await supabase.from('tools_links').update(payload).eq('id', editId).select().single()
      if (data) setLinks((l) => l.map((x) => x.id === editId ? data : x))
    } else {
      const { data } = await supabase.from('tools_links').insert(payload).select().single()
      if (data) setLinks((l) => [data, ...l])
    }
    close()
  }

  function edit(link: LinkItem) {
    setEditId(link.id)
    setDraft({ name: link.name, url: link.url, description: link.description || '', category: link.category })
    setOpen(true)
  }

  async function remove(id: string) {
    await supabase.from('tools_links').delete().eq('id', id)
    setLinks((l) => l.filter((x) => x.id !== id))
  }

  function close() {
    setOpen(false); setEditId(null); setDraft({ name: '', url: '', description: '', category: 'tool' })
  }

  async function aiCreateFromLink() {
    if (!aiUrl.trim()) return
    setAiBusy(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          question: `Crea un link de categoría ${aiCategory} a partir de este enlace web`,
          mode: 'create',
          linkUrl: aiUrl,
        }),
      })
      if (!res.ok) throw new Error('Error al crear con AI')
      const data = await res.json()
      if (data.record) setLinks((l) => [data.record, ...l])
      setAiOpen(false); setAiUrl(''); setAiCategory('tool')
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setAiBusy(false)
    }
  }

  const bidLinks = links.filter((l) => l.category === 'bid' && (l.name.toLowerCase().includes(search.toLowerCase()) || l.url.toLowerCase().includes(search.toLowerCase())))
  const toolLinks = links.filter((l) => l.category === 'tool' && (l.name.toLowerCase().includes(search.toLowerCase()) || l.url.toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="space-y-6">
      <InfoNote title="¿Qué es Tools?">
        <p>Reúne en un solo lugar todos los portales de licitación y herramientas que usas: SAM.gov, SBA, FPDS y más. Agrega enlaces personalizados o crea nuevos con IA.</p>
        <p>Las Bid Pages son portales donde buscas oportunidades; los Tools Links son recursos y utilidades para tu operación diaria.</p>
      </InfoNote>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
          <Search size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar link…" className="bg-transparent outline-none w-56 placeholder:text-violet-400/40" />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Crear con AI</Button>
          <Button variant="gold" onClick={() => { setEditId(null); setDraft({ name: '', url: '', description: '', category: 'tool' }); setOpen(true) }}><Plus size={16} /> Nuevo Link</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bid Pages */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 neon-border"><FileText size={16} /></div>
            <div>
              <h3 className="font-semibold text-violet-100">Bid Pages</h3>
              <p className="text-xs text-violet-300/70">Portales de licitación</p>
            </div>
            <Badge tone="gold" >{bidLinks.length}</Badge>
          </div>
          {bidLinks.length === 0 ? (
            <p className="text-sm text-violet-300/70 text-center py-6">Sin bid pages</p>
          ) : (
            <div className="space-y-2">
              {bidLinks.map((l) => <LinkRow key={l.id} link={l} onEdit={() => edit(l)} onDelete={() => remove(l.id)} />)}
            </div>
          )}
        </Card>

        {/* Tools Links */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-300 neon-border"><Wrench size={16} /></div>
            <div>
              <h3 className="font-semibold text-violet-100">Tools Links</h3>
              <p className="text-xs text-violet-300/70">Herramientas y recursos</p>
            </div>
            <Badge tone="info">{toolLinks.length}</Badge>
          </div>
          {toolLinks.length === 0 ? (
            <p className="text-sm text-violet-300/70 text-center py-6">Sin tools links</p>
          ) : (
            <div className="space-y-2">
              {toolLinks.map((l) => <LinkRow key={l.id} link={l} onEdit={() => edit(l)} onDelete={() => remove(l.id)} />)}
            </div>
          )}
        </Card>
      </div>

      {/* Manual modal */}
      <Modal open={open} onClose={close} title={editId ? 'Editar link' : 'Nuevo link'}>
        <div className="space-y-4">
          <Input label="Nombre" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Ej. SAM.gov" />
          <Input label="URL" value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://…" />
          <Textarea label="Descripción" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
          <Select label="Categoría" value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>
            <option value="tool">Tool Link</option>
            <option value="bid">Bid Page</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={close}>Cancelar</Button>
            <Button variant="gold" onClick={save} disabled={!draft.name || !draft.url}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* AI modal */}
      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="Crear link con AI">
        <div className="space-y-4">
          <p className="text-sm text-violet-300/70">Pega el enlace web y la AI extraerá el nombre y descripción automáticamente.</p>
          <Input label="URL del enlace" value={aiUrl} onChange={(e) => setAiUrl(e.target.value)} placeholder="https://sam.gov" />
          <Select label="Categoría" value={aiCategory} onChange={(e) => setAiCategory(e.target.value)}>
            <option value="tool">Tool Link</option>
            <option value="bid">Bid Page</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAiOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={aiCreateFromLink} disabled={aiBusy || !aiUrl.trim()}>
              {aiBusy ? <><Loader2 size={16} className="animate-spin" /> Extrayendo…</> : <><Sparkles size={16} /> Crear con AI</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function LinkRow({ link, onEdit, onDelete }: { link: LinkItem; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl border border-violet-400/15 hover:border-fuchsia-400/30 hover:bg-violet-500/5 transition">
      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-fuchsia-400 shrink-0">
        <Link2 size={14} />
      </div>
      <a href={link.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0">
        <div className="text-sm font-medium text-violet-100 hover:text-fuchsia-300 transition flex items-center gap-1 truncate">
          {link.name} <ExternalLink size={11} className="opacity-50 shrink-0" />
        </div>
        <div className="text-xs text-violet-300/70 truncate">{link.description || link.url}</div>
      </a>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
        <button onClick={onEdit} className="p-1 text-violet-300 hover:text-fuchsia-400 transition"><Pencil size={13} /></button>
        <button onClick={onDelete} className="p-1 text-violet-300 hover:text-rose-400 transition"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}
