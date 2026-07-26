import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Badge, SectionTitle, Modal, EmptyState } from '../components/ui'
import { Plus, Folder, FileText, ExternalLink, Search, Star, Wrench } from 'lucide-react'
import { cn } from '../lib/utils'

const LINKS = [
  { name: 'SAM.gov', url: 'https://sam.gov', desc: 'Registro federal de entidades' },
  { name: 'SBA', url: 'https://sba.gov', desc: 'Small Business Administration' },
  { name: 'DSBS', url: 'https://dsbs.sba.gov', desc: 'Dynamic Small Business Search' },
  { name: 'FPDS', url: 'https://fpds.gov', desc: 'Federal Procurement Data System' },
  { name: 'USAspending', url: 'https://usaspending.gov', desc: 'Gasto federal público' },
  { name: 'Beta SAM', url: 'https://beta.sam.gov', desc: 'Portal de oportunidades' },
]

const AI_TOOLS = [
  { name: 'Proposal Software', desc: 'Redacta propuestas con IA' },
  { name: 'Capability Statement Builder', desc: 'Genera tu capability statement' },
  { name: 'Website Builders', desc: 'Crea tu sitio corporativo' },
  { name: 'Email & Branding', desc: 'Logo, identidad y correo' },
]

export function Tools() {
  const [docs, setDocs] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<any>({ name: '', folder: '', tags: '', notes: '' })
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    if (data) setDocs(data)
  }
  async function add() {
    await supabase.from('documents').insert(draft)
    setOpen(false); setDraft({ name: '', folder: '', tags: '', notes: '' }); load()
  }
  async function remove(id: string) {
    await supabase.from('documents').delete().eq('id', id); load()
  }

  const filtered = docs.filter((d) => d.name?.toLowerCase().includes(search.toLowerCase()) || d.folder?.toLowerCase().includes(search.toLowerCase()))
  const folders = [...new Set(docs.map((d) => d.folder).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <SectionTitle title="Links Importantes" subtitle="Recursos gubernamentales clave" />
          <div className="grid sm:grid-cols-2 gap-3">
            {LINKS.map((l) => (
              <a key={l.name} href={l.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3.5 rounded-xl border border-line hover:border-navy-200 hover:bg-navy-50/50 transition group">
                <div>
                  <div className="text-sm font-medium text-navy-900">{l.name}</div>
                  <div className="text-xs text-muted">{l.desc}</div>
                </div>
                <ExternalLink size={15} className="text-muted group-hover:text-navy-700 transition" />
              </a>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle title="AI Tools" subtitle="Herramientas de productividad" />
          <div className="grid sm:grid-cols-2 gap-3">
            {AI_TOOLS.map((t) => (
              <div key={t.name} className="p-3.5 rounded-xl border border-line hover:border-navy-200 transition cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy-600"><Wrench size={15} /></div>
                  <div className="text-sm font-medium text-navy-900">{t.name}</div>
                </div>
                <p className="text-xs text-muted mt-2">{t.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-navy-900">Biblioteca de Documentos</h2>
            <p className="text-sm text-muted mt-0.5">Organiza certificaciones, PDFs y versiones</p>
          </div>
          <Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Subir Documento</Button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-line text-sm text-muted mb-4 max-w-sm">
          <Search size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar documentos…" className="bg-transparent outline-none flex-1" />
        </div>

        {folders.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {folders.map((f) => <Badge key={f} tone="neutral"><Folder size={11} /> {f}</Badge>)}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon={<FileText size={22} />} title="Sin documentos" subtitle="Sube certificaciones, capability statements, PDFs y más." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus size={16} /> Subir</Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((d) => (
              <div key={d.id} className="group p-4 rounded-xl border border-line hover:border-navy-200 hover:bg-navy-50/40 transition">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-gold-50 flex items-center justify-center text-gold-600"><FileText size={16} /></div>
                  <button onClick={() => remove(d.id)} className="text-muted hover:text-error-600 transition opacity-0 group-hover:opacity-100 text-xs">Eliminar</button>
                </div>
                <div className="text-sm font-medium text-navy-900 mt-3 truncate">{d.name}</div>
                <div className="text-xs text-muted mt-0.5">{d.folder || 'Sin carpeta'} {d.version && `· v${d.version}`}</div>
                {d.tags && <div className="flex flex-wrap gap-1 mt-2">{d.tags.split(',').map((t:string) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-navy-50 text-navy-600">{t.trim()}</span>)}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo documento">
        <div className="space-y-4">
          <Input label="Nombre" value={draft.name} onChange={(e) => setDraft((d:any) => ({ ...d, name: e.target.value }))} />
          <Input label="Carpeta" value={draft.folder} onChange={(e) => setDraft((d:any) => ({ ...d, folder: e.target.value }))} placeholder="Ej. Certificaciones" />
          <Input label="Etiquetas (coma)" value={draft.tags} onChange={(e) => setDraft((d:any) => ({ ...d, tags: e.target.value }))} />
          <Input label="Versión" value={draft.version} onChange={(e) => setDraft((d:any) => ({ ...d, version: e.target.value }))} placeholder="1.0" />
          <Textarea label="Notas" value={draft.notes} onChange={(e) => setDraft((d:any) => ({ ...d, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gold" onClick={add} disabled={!draft.name}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
