'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Archive, Check, ChevronLeft, ChevronRight, Eye, FilePen, FileText, Grid2X2, LayoutList, MessageSquare, Pencil, Plus, Search, SendHorizontal, Trash2, X } from 'lucide-react'
import { Badge, Button, buttonVariants, cn } from '@/app/admin/components/ui'

type Post = { id: string; title: string; slug: string; status: 'PUBLISHED' | 'DRAFT'; coverImage: string | null; updatedAt: string }
type Counts = { all: number; published: number; drafts: number; comments: number; categories: number; tags: number; trash: number }
type Tab = 'all' | 'published' | 'drafts'

const fmtDate = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function StatCard({ icon: Icon, tint, label, value }: { icon: typeof FileText; tint: string; label: string; value: number }) {
  return <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"><span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', tint)}><Icon className="size-5" strokeWidth={1.75} /></span><div className="min-w-0"><p className="text-[13px] font-medium text-muted-foreground">{label}</p><p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</p></div></div>
}

export default function AdminDashboardInteractive({ posts, counts, page, pageSize, hasMore, initialTab = 'all', initialQuery = '' }: { posts: Post[]; counts: Counts; page: number; pageSize: number; hasMore: boolean; initialTab?: Tab; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [tab, setTab] = useState<Tab>(initialTab)
  const [selected, setSelected] = useState<string[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  function navigate(next: { page?: number; tab?: Tab; query?: string } = {}) {
    const nextPage = Math.max(1, next.page ?? page)
    const nextTab = next.tab ?? tab
    const nextQuery = (next.query ?? query).trim().slice(0, 100)
    const params = new URLSearchParams()
    if (nextPage > 1) params.set('page', String(nextPage))
    if (nextTab !== 'all') params.set('tab', nextTab)
    if (nextQuery) params.set('q', nextQuery)
    window.location.href = `/admin/${params.toString() ? `?${params.toString()}` : ''}`
  }

  function toggle(id: string) { setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]) }
  const allVisibleSelected = posts.length > 0 && posts.every(post => selected.includes(post.id))
  function selectAll() { setSelected(allVisibleSelected ? [] : posts.map(post => post.id)) }

  async function bulkAction(action: 'publish' | 'draft' | 'trash') {
    if (!selected.length || busy) return
    setBusy(true); setNotice(null)
    try {
      const response = await fetch('/api/admin/posts/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected, action }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Action failed')
      const label = action === 'trash' ? 'moved to Trash' : action === 'publish' ? 'published' : 'saved as drafts'
      setNotice(`${selected.length} post${selected.length > 1 ? 's' : ''} ${label}.`); setSelected([]); window.location.reload()
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Action failed') } finally { setBusy(false) }
  }

  function editSelected() { if (selected.length === 1) window.location.href = `/admin/posts/${selected[0]}/edit/` }
  const tabs: { key: Tab; label: string; count: number }[] = [{ key: 'all', label: 'All', count: counts.all }, { key: 'published', label: 'Published', count: counts.published }, { key: 'drafts', label: 'Drafts', count: counts.drafts }]
  const currentTotal = tab === 'all' ? counts.all : tab === 'published' ? counts.published : counts.drafts
  const rangeStart = currentTotal === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, currentTotal)

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Manage your journal posts and publishing workflow.</p></div><Link href="/admin/posts/new/" className={buttonVariants()}><Plus className="size-4" strokeWidth={2} /> Add post</Link></div>

    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><StatCard icon={FileText} tint="bg-primary/10 text-primary" label="Total posts" value={counts.all} /><StatCard icon={SendHorizontal} tint="bg-emerald-50 text-emerald-600" label="Published" value={counts.published} /><StatCard icon={FilePen} tint="bg-amber-50 text-amber-600" label="Drafts" value={counts.drafts} /><StatCard icon={MessageSquare} tint="bg-rose-50 text-rose-600" label="Pending comments" value={counts.comments} /></div>

    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">{tabs.map(t => <button key={t.key} onClick={() => { setTab(t.key); navigate({ page: 1, tab: t.key }) }} className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors', tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{t.label}<span className={cn('tabular-nums', tab === t.key ? 'text-primary' : 'text-muted-foreground/70')}>{t.count}</span></button>)}</div>
        <form className="relative ml-auto w-full sm:w-72" onSubmit={event => { event.preventDefault(); navigate({ page: 1, query }) }}><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search posts…" aria-label="Search posts" className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-8 text-sm shadow-xs placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />{query && <button type="button" onClick={() => { setQuery(''); navigate({ page: 1, query: '' }) }} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>}</form>
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1"><button type="button" onClick={() => setView('grid')} aria-label="Grid view" className={cn('grid size-8 place-items-center rounded-md transition-colors', view === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground')}><Grid2X2 className="size-4" strokeWidth={1.75} /></button><button type="button" onClick={() => setView('list')} aria-label="List view" className={cn('grid size-8 place-items-center rounded-md transition-colors', view === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground')}><LayoutList className="size-4" strokeWidth={1.75} /></button></div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5 sm:px-5"><button type="button" onClick={selectAll} className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"><span className={cn('grid size-4 place-items-center rounded border', allVisibleSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input')}>{allVisibleSelected && <Check className="size-3" strokeWidth={3} />}</span>{allVisibleSelected ? 'Clear' : 'Select all'}</button>{selected.length > 0 && <span className="text-[13px] text-muted-foreground">{selected.length} selected</span>}<div className="ml-auto flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" onClick={editSelected} disabled={selected.length !== 1}><Pencil className="size-3.5" strokeWidth={1.75} /> Edit</Button><Button variant="outline" size="sm" onClick={() => bulkAction('publish')} disabled={!selected.length || busy}><SendHorizontal className="size-3.5" strokeWidth={1.75} /> Publish</Button><Button variant="outline" size="sm" onClick={() => bulkAction('draft')} disabled={!selected.length || busy}><Archive className="size-3.5" strokeWidth={1.75} /> Draft</Button><Button variant="outline" size="sm" onClick={() => bulkAction('trash')} disabled={!selected.length || busy} className="text-destructive hover:bg-rose-50 hover:text-destructive"><Trash2 className="size-3.5" strokeWidth={1.75} /> Delete</Button></div></div>

      {notice && <div className="mx-4 mt-3 rounded-lg border border-primary/20 bg-accent px-3 py-2 text-[13px] text-accent-foreground sm:mx-5">{notice}</div>}

      <div className="p-4 sm:p-5">{!posts.length ? <div className="flex flex-col items-center gap-3 py-16 text-center"><span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><Search className="size-5" strokeWidth={1.75} /></span><div><p className="text-sm font-semibold">No posts found</p><p className="text-sm text-muted-foreground">Try a different search or status filter.</p></div><Link href="/admin/posts/new/" className={buttonVariants({ size: 'sm' })}><Plus className="size-4" strokeWidth={2} /> New post</Link></div> : view === 'grid' ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{posts.map(post => { const isSel = selected.includes(post.id); return <article key={post.id} className={cn('group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-all hover:shadow-md', isSel ? 'border-primary ring-2 ring-ring/30' : 'border-border')}><div className="flex h-11 items-center justify-between border-b border-border px-3"><input type="checkbox" checked={isSel} onChange={() => toggle(post.id)} aria-label={`Select ${post.title}`} className="size-4 rounded accent-primary" /><div className="flex items-center gap-1"><Link href={`/admin/posts/${post.id}/edit/`} aria-label={`Edit ${post.title}`} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="size-3.5" strokeWidth={1.75} /></Link><Link href={`/${post.slug}/`} aria-label={`View ${post.title}`} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Eye className="size-3.5" strokeWidth={1.75} /></Link></div></div><Link href={`/admin/posts/${post.id}/edit/`} className="block aspect-[1.7/1] overflow-hidden bg-muted">{post.coverImage ? <img src={post.coverImage} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <span className="grid size-full place-items-center bg-gradient-to-br from-muted to-secondary text-muted-foreground/50"><FileText className="size-6" strokeWidth={1.5} /></span>}</Link><div className="flex flex-col gap-2.5 p-3.5"><Link href={`/admin/posts/${post.id}/edit/`} className="line-clamp-2 text-sm font-semibold tracking-tight hover:text-primary">{post.title}</Link><div className="flex items-center justify-between gap-2"><Badge variant={post.status === 'PUBLISHED' ? 'success' : 'secondary'}>{post.status === 'PUBLISHED' ? 'Published' : 'Draft'}</Badge><span className="text-xs text-muted-foreground">{fmtDate(post.updatedAt)}</span></div></div></article> })}</div> : <div className="overflow-hidden rounded-xl border border-border">{posts.map((post, i) => { const isSel = selected.includes(post.id); return <div key={post.id} className={cn('grid grid-cols-[auto_44px_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2.5 sm:px-4', i > 0 && 'border-t border-border', isSel ? 'bg-accent' : 'hover:bg-muted/40')}><input type="checkbox" checked={isSel} onChange={() => toggle(post.id)} aria-label={`Select ${post.title}`} className="size-4 rounded accent-primary" /><span className="hidden size-11 overflow-hidden rounded-md bg-muted sm:block">{post.coverImage ? <img src={post.coverImage} alt="" className="size-full object-cover" /> : null}</span><div className="min-w-0"><Link href={`/admin/posts/${post.id}/edit/`} className="block truncate text-sm font-semibold tracking-tight hover:text-primary">{post.title}</Link><span className="block truncate text-xs text-muted-foreground">/{post.slug}</span></div><Badge variant={post.status === 'PUBLISHED' ? 'success' : 'secondary'} className="hidden sm:inline-flex">{post.status === 'PUBLISHED' ? 'Published' : 'Draft'}</Badge><div className="flex items-center gap-2"><span className="hidden text-xs text-muted-foreground md:block">{fmtDate(post.updatedAt)}</span><Link href={`/admin/posts/${post.id}/edit/`} aria-label={`Edit ${post.title}`} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="size-4" strokeWidth={1.75} /></Link></div></div> })}</div>}</div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:px-5"><div className="text-xs text-muted-foreground">{initialQuery ? `Search: “${initialQuery}”` : `${rangeStart}-${rangeEnd} of ${currentTotal} posts`}<span className="mx-2">·</span>Page {page}</div><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => navigate({ page: page - 1 })} disabled={page <= 1 || busy}><ChevronLeft className="size-4" strokeWidth={1.8} /> Previous</Button><Button variant="outline" size="sm" onClick={() => navigate({ page: page + 1 })} disabled={!hasMore || busy}>Next <ChevronRight className="size-4" strokeWidth={1.8} /></Button></div></div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:px-5"><span>{counts.categories} categories</span><span>{counts.tags} tags</span><Link href="/admin/trash/" className="hover:text-primary">{counts.trash} in trash</Link></div>
    </div>
  </>
}
