'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, ImageOff, Loader2, Search, Trash2, UploadCloud, X } from 'lucide-react'
import { Button, Input, Label, cn } from '@/app/admin/components/ui'

export type MediaItem = {
  id: string
  url: string
  filename: string | null
  alt: string | null
  mimeType: string | null
  size: number | null
  createdAt: string
}

function formatBytes(n?: number | null) {
  if (!n) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = n
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

export default function MediaLibrary({
  mode = 'page',
  onPick,
  onClose,
}: {
  mode?: 'page' | 'picker'
  onPick?: (item: MediaItem) => void
  onClose?: () => void
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [active, setActive] = useState<MediaItem | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/media')
      const data = await response.json()
      setItems(data.media || [])
    } catch {
      setError('Could not load media.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? items.filter((i) => (i.filename || '').toLowerCase().includes(q) || i.url.toLowerCase().includes(q)) : items
  }, [items, query])

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of list) {
        const fd = new FormData()
        fd.append('file', file)
        const response = await fetch('/api/admin/media', { method: 'POST', body: fd })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Upload failed')
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function remove(ids: string[]) {
    if (!ids.length) return
    if (!window.confirm(`Move ${ids.length} item${ids.length > 1 ? 's' : ''} to Trash? You can restore or permanently delete from Trash.`)) return
    await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setSelected([])
    setActive(null)
    await load()
  }

  async function saveDetails(item: MediaItem, filename: string, alt: string) {
    await fetch('/api/admin/media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, filename, alt }),
    })
    await load()
    setActive(null)
  }

  function toggle(id: string) {
    if (mode === 'picker') {
      setSelected((s) => (s[0] === id ? [] : [id]))
    } else {
      setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
    }
  }

  const pickSelected = () => {
    const item = items.find((i) => i.id === selected[0])
    if (item && onPick) onPick(item)
  }

  const Toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) upload(e.target.files)
          e.currentTarget.value = ''
        }}
      />
      <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" strokeWidth={1.75} />}
        {uploading ? 'Uploading…' : 'Upload'}
      </Button>
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search media…" className="pl-9" />
      </div>
      {mode === 'page' && selected.length > 0 && (
        <Button type="button" variant="destructive" onClick={() => remove(selected)}>
          <Trash2 className="size-4" strokeWidth={1.75} /> Delete ({selected.length})
        </Button>
      )}
    </div>
  )

  const Grid = (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        if (e.dataTransfer.files) upload(e.dataTransfer.files)
      }}
      className={cn('rounded-xl border border-dashed p-3 transition-colors', drag ? 'border-primary bg-accent' : 'border-border')}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading media…
        </div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <ImageOff className="size-6" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">{query ? 'No matching media' : 'No media yet'}</p>
          <p className="text-sm">Drag &amp; drop images here, or use Upload.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((item) => {
            const isSel = selected.includes(item.id)
            return (
              <div
                key={item.id}
                className={cn(
                  'group relative overflow-hidden rounded-lg border bg-card text-left shadow-xs transition-all hover:shadow-md',
                  isSel ? 'border-primary ring-2 ring-ring/40' : 'border-border',
                )}
              >
                <button
                  type="button"
                  onClick={() => (mode === 'picker' ? toggle(item.id) : setActive(item))}
                  onDoubleClick={() => mode === 'picker' && onPick?.(item)}
                  className="block w-full"
                >
                  <span className="block aspect-square overflow-hidden bg-muted">
                    <img src={item.url} alt={item.alt || item.filename || ''} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  </span>
                  <span className="block truncate px-2.5 py-2 text-xs font-medium">{item.filename || 'image'}</span>
                </button>
                {mode === 'page' && (
                  <label className="absolute left-2 top-2 flex size-6 cursor-pointer items-center justify-center rounded-md bg-card/90 shadow-xs ring-1 ring-border">
                    <input type="checkbox" checked={isSel} onChange={() => toggle(item.id)} className="size-3.5 accent-primary" />
                  </label>
                )}
                {mode === 'picker' && (
                  <button
                    type="button"
                    onClick={() => onPick?.(item)}
                    className="absolute bottom-9 right-2 hidden rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm group-hover:block"
                  >
                    Use
                  </button>
                )}
                {isSel && mode === 'picker' && (
                  <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const body = (
    <div className="space-y-4">
      {Toolbar}
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</p>}
      {Grid}
    </div>
  )

  if (mode === 'picker') {
    return (
      <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
        <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 className="text-[15px] font-semibold tracking-tight">Media library</h3>
            <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{body}</div>
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={pickSelected} disabled={!selected.length}>Use image</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {body}
      {active && <DetailModal item={active} onClose={() => setActive(null)} onSave={saveDetails} onDelete={(id) => remove([id])} />}
    </>
  )
}

function DetailModal({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: MediaItem
  onClose: () => void
  onSave: (item: MediaItem, filename: string, alt: string) => void
  onDelete: (id: string) => void
}) {
  const [filename, setFilename] = useState(item.filename || '')
  const [alt, setAlt] = useState(item.alt || '')
  const [copied, setCopied] = useState(false)

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-[15px] font-semibold tracking-tight">Media details</h3>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-border bg-muted">
            <img src={item.url} alt={item.alt || ''} className="max-h-[46vh] w-full object-contain" />
          </div>
          <div className="grid content-start gap-4">
            <div className="grid gap-2">
              <Label>File name</Label>
              <Input value={filename} onChange={(e) => setFilename(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Alt text</Label>
              <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" />
            </div>
            <div className="grid gap-2">
              <Label>URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={item.url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(new URL(item.url, window.location.origin).href)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                >
                  <Copy className="size-4" strokeWidth={1.75} /> {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {item.mimeType} · {formatBytes(item.size)} · {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3.5">
          <Button type="button" variant="destructive" onClick={() => onDelete(item.id)}>
            <Trash2 className="size-4" strokeWidth={1.75} /> Move to Trash
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={() => onSave(item, filename, alt)}>Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
