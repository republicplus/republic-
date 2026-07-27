import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Textarea, Badge, Modal, EmptyState, SectionTitle, InfoNote } from '../components/ui'
import { Plus, Search, Trash2, FileText, Image as ImageIcon, StickyNote, Upload, Download, Filter } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'

type DocItem = {
  id: string; name: string; folder: string | null; tags: string | null
  file_url: string | null; file_type: string; file_name: string | null
  file_size: number | null; mime_type: string | null; notes: string | null
  created_at: string
}

const TYPE_META: Record<string, { label: string; icon: any; tone: string }> = {
  pdf: { label: 'PDF', icon: FileText, tone: 'gold' },
  image: { label: 'Imagen', icon: ImageIcon, tone: 'info' },
  note: { label: 'Nota', icon: StickyNote, tone: 'neutral' },
}

function detectType(mime: string, fileName: string): string {
  if (mime?.startsWith('image/')) return 'image'
  if (mime === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf')) return 'pdf'
  return 'note'
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Documents() {
  const [docs, setDocs] = useState<DocItem[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pdf' | 'image' | 'note'>('all')
  const [open, setOpen] = useState(false)
  const [uploadMode, setUploadMode] = useState(false)
  const [draft, setDraft] = useState({ name: '', notes: '', tags: '', folder: '' })
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    if (data) setDocs(data)
  }

  async function save() {
    if (!draft.name.trim()) return
    setBusy(true)
    try {
      let fileUrl: string | null = null
      let fileSize: number | null = null
      let mimeType: string | null = null
      let fileName: string | null = null
      let fileType = 'note'

      if (file) {
        const ext = file.name.split('.').pop()
        const path = `${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('documents').getPublicUrl(path)
        fileUrl = pub.publicUrl
        fileSize = file.size
        mimeType = file.type
        fileName = file.name
        fileType = detectType(file.type, file.name)
      }

      const payload = {
        name: draft.name,
        notes: draft.notes || null,
        tags: draft.tags || null,
        folder: draft.folder || null,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
      }
      const { data } = await supabase.from('documents').insert(payload).select().single()
      if (data) setDocs((d) => [data, ...d])
      close()
    } catch (err: any) {
      alert('Error al subir: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string, fileUrl: string | null) {
    if (fileUrl) {
      const path = fileUrl.split('/documents/').pop()
      if (path) await supabase.storage.from('documents').remove([path])
    }
    await supabase.from('documents').delete().eq('id', id)
    setDocs((d) => d.filter((x) => x.id !== id))
  }

  function close() {
    setOpen(false); setDraft({ name: '', notes: '', tags: '', folder: '' }); setFile(null)
  }

  const filtered = docs.filter((d) =>
    (filter === 'all' || d.file_type === filter) &&
    (d.name.toLowerCase().includes(search.toLowerCase()) || d.tags?.toLowerCase().includes(search.toLowerCase()))
  )

  const counts = {
    all: docs.length,
    pdf: docs.filter((d) => d.file_type === 'pdf').length,
    image: docs.filter((d) => d.file_type === 'image').length,
    note: docs.filter((d) => d.file_type === 'note').length,
  }

  return (
    <div className="space-y-6">
      <InfoNote title="¿Qué es Documentos?">
        <p>Centraliza todos los documentos de tus contratos, empresas y operaciones: contratos firmados, propuestas, facturas, certificaciones y más.</p>
        <p>Sube archivos PDF o imágenes, organízalos por tipo y carpeta, y mantenlos siempre accesibles para cuando los necesites.</p>
      </InfoNote>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-400/20 text-sm text-violet-300/70">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar documento…" className="bg-transparent outline-none w-48 placeholder:text-violet-400/40" />
          </div>
        </div>
        <Button variant="gold" onClick={() => { setUploadMode(true); setOpen(true) }}><Plus size={16} /> Nuevo Documento</Button>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pdf', 'image', 'note'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition',
              filter === t
                ? 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/30'
                : 'bg-violet-950/40 text-violet-300/70 border border-violet-400/15 hover:border-violet-400/30'
            )}
          >
            {t === 'all' ? <Filter size={14} /> : (() => { const I = TYPE_META[t].icon; return <I size={14} /> })()}
            <span className="capitalize">{t === 'all' ? 'Todos' : TYPE_META[t].label}</span>
            <span className="text-xs text-violet-400/60">{counts[t]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<FileText size={22} />} title="Sin documentos" subtitle="Sube PDFs, imágenes o crea notas de texto organizadas por tipo." action={<Button variant="gold" onClick={() => { setUploadMode(true); setOpen(true) }}><Plus size={16} /> Subir Documento</Button>} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => <DocCard key={d.id} doc={d} onDelete={() => remove(d.id, d.file_url)} />)}
        </div>
      )}

      <Modal open={open} onClose={close} title="Nuevo documento" wide>
        <div className="space-y-4">
          <Input label="Nombre" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Ej. Contrato SAM 2026" />

          {/* Upload zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-violet-400/30 rounded-xl p-6 text-center cursor-pointer hover:border-fuchsia-400/50 hover:bg-violet-500/5 transition"
          >
            <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="text-sm text-violet-100">
                <div className="font-medium">{file.name}</div>
                <div className="text-xs text-violet-300/70">{formatSize(file.size)}</div>
              </div>
            ) : (
              <div className="text-sm text-violet-300/70">
                <Upload size={20} className="mx-auto mb-2 text-fuchsia-400" />
                Haz clic para subir un PDF o imagen
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Carpeta" value={draft.folder} onChange={(e) => setDraft((d) => ({ ...d, folder: e.target.value }))} placeholder="Ej. Contratos" />
            <Input label="Etiquetas (coma)" value={draft.tags} onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))} placeholder="federal, 2026" />
          </div>
          <Textarea label="Notas" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="Notas sobre este documento…" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={close}>Cancelar</Button>
            <Button variant="gold" onClick={save} disabled={!draft.name || busy}>{busy ? 'Subiendo…' : 'Guardar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function DocCard({ doc, onDelete }: { doc: DocItem; onDelete: () => void }) {
  const meta = TYPE_META[doc.file_type] || TYPE_META.note
  const Icon = meta.icon
  const tone = meta.tone as 'gold' | 'info' | 'neutral' | 'success' | 'warning' | 'error'
  return (
    <div className="group p-4 rounded-xl border border-violet-400/20 hover:border-fuchsia-400/40 hover:bg-violet-500/5 transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center neon-border', doc.file_type === 'pdf' ? 'bg-fuchsia-500/10 text-fuchsia-300' : doc.file_type === 'image' ? 'bg-sky-500/10 text-sky-300' : 'bg-violet-500/10 text-violet-300')}>
            <Icon size={18} />
          </div>
          <div>
            <div className="text-sm font-medium text-violet-100">{doc.name}</div>
            <div className="text-xs text-violet-300/70">{formatDate(doc.created_at)} · {formatSize(doc.file_size)}</div>
          </div>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-violet-300 hover:text-rose-400 transition p-1"><Trash2 size={14} /></button>
      </div>

      {doc.notes && <p className="text-xs text-violet-300/70 mt-3 line-clamp-2">{doc.notes}</p>}

      {doc.tags && (
        <div className="flex flex-wrap gap-1 mt-3">
          {doc.tags.split(',').map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-400/20">{t.trim()}</span>)}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-violet-400/10">
        <Badge tone={tone}>{meta.label}</Badge>
        {doc.file_url ? (
          <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-fuchsia-300 hover:text-fuchsia-200 flex items-center gap-1 transition">
            <Download size={12} /> Ver
          </a>
        ) : (
          <span className="text-xs text-violet-400/50">Sin archivo</span>
        )}
      </div>
    </div>
  )
}
