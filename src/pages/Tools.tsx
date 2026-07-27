import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, SectionTitle } from '../components/ui'
import { Plus, ExternalLink, Search, Trash2, Link2, Wrench, FileText, Pencil } from 'lucide-react'
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
  const [links, setLinks] = useState<LinkItem[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'bid' | 'tool'>('all')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: '', url: '', description: '', category: 'tool' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('tools_links').select('*').order('created_at', { ascending: false })
    if (data && data.length > 0) {
      setLinks(data)
    } else if (data && data.length === 0) {
      // seed defaults for first-time user
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

  const filtered = links.filter((l) =>
    (filter === 'all' || l.category === filter) &&
    (l.name.toLowerCase().includes(search.toLowerCase()) || l.url.toLowerCase().includes(search.toLowerCase()))
  )

  const bidLinks = filtered.filter((l) => l.category === 'bid')
  const toolLinks = filtered.filter((l) => l.category === 'tool')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar link…" className="bg-transparent outline-none w-48 placeholder:text-violet-400/40" />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="w-auto">
            <option value="all">Todos</option>
            <option value="bid">Bid Pages</option>
            <option value="tool">Tools Links</option>
          </Select>
        </div>
        <Button variant="gold" onClick={() => { setEditId(null); setDraft({ name: '', url: '', description: '', category: 'tool' }); setOpen(true) }}><Plus size={16} /> Nuevo Link</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Link2 size={22} />} title="Sin links" subtitle="Agrega páginas de licitación o herramientas con su link web." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Agregar Link</Button>} /></Card>
      ) : (
        <>
          {(filter === 'all' || filter === 'bid') && bidLinks.length > 0 && (
            <Card className="p-6">
              <SectionTitle title="Bid Pages" subtitle="Portales de licitación y oportunidades" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {bidLinks.map((l) => <LinkCard key={l.id} link={l} onEdit={() => edit(l)} onDelete={() => remove(l.id)} />)}
              </div>
            </Card>
          )}
          {(filter === 'all' || filter === 'tool') && toolLinks.length > 0 && (
            <Card className="p-6">
              <SectionTitle title="Tools Links" subtitle="Herramientas y recursos" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {toolLinks.map((l) => <LinkCard key={l.id} link={l} onEdit={() => edit(l)} onDelete={() => remove(l.id)} />)}
              </div>
            </Card>
          )}
        </>
      )}

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
    </div>
  )
}

function LinkCard({ link, onEdit, onDelete }: { link: LinkItem; onEdit: () => void; onDelete: () => void }) {
  const Icon = link.category === 'bid' ? FileText : Wrench
  return (
    <div className="group p-4 rounded-xl border border-violet-400/20 hover:border-fuchsia-400/40 hover:bg-violet-500/5 transition">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-fuchsia-400 neon-border">
          <Icon size={16} />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onEdit} className="p-1 text-violet-300 hover:text-fuchsia-400 transition"><Pencil size={13} /></button>
          <button onClick={onDelete} className="p-1 text-violet-300 hover:text-rose-400 transition"><Trash2 size={13} /></button>
        </div>
      </div>
      <a href={link.url} target="_blank" rel="noreferrer" className="block mt-3">
        <div className="text-sm font-medium text-violet-100 hover:text-fuchsia-300 transition flex items-center gap-1">
          {link.name} <ExternalLink size={12} className="opacity-50" />
        </div>
        <div className="text-xs text-violet-300/70 mt-1">{link.description || link.url}</div>
      </a>
    </div>
  )
}
