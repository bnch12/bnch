'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, Image as ImageIcon, LayoutDashboard, LogOut, MessageSquare, PenSquare, Tags, Trash2, Menu as MenuIcon } from 'lucide-react'
import { cn } from '@/app/admin/components/ui'

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; match: string }

const NAV: NavItem[] = [
  { href: '/admin/', label: 'Dashboard', icon: LayoutDashboard, match: '/admin' },
  { href: '/admin/posts/new/', label: 'New post', icon: PenSquare, match: '/admin/posts' },
  { href: '/admin/media/', label: 'Media', icon: ImageIcon, match: '/admin/media' },
  { href: '/admin/taxonomy/', label: 'Categories & tags', icon: Tags, match: '/admin/taxonomy' },
  { href: '/admin/navigation/', label: 'Header menu', icon: MenuIcon, match: '/admin/navigation' },
  { href: '/admin/comments/', label: 'Comments', icon: MessageSquare, match: '/admin/comments' },
  { href: '/admin/trash/', label: 'Trash', icon: Trash2, match: '/admin/trash' },
]

function normalize(path: string) { return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path }

function LogoTile({ className }: { className?: string }) {
  return <span className={cn('grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-xs', className)}>SR</span>
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = normalize(usePathname() || '/admin')
  if (pathname === '/admin/login') return <>{children}</>
  const isActive = (item: NavItem) => item.match === '/admin' ? pathname === '/admin' : pathname === item.match || pathname.startsWith(item.match + '/')

  return (
    <div className="admin-app min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-3 px-5 py-4"><LogoTile /><span className="flex flex-col leading-tight"><span className="text-sm font-semibold tracking-tight">Suhanur Rahman</span><span className="text-xs text-muted-foreground">CMS workspace</span></span></div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
          <ul className="flex flex-col gap-1">{NAV.map((item) => { const Icon = item.icon; const active = isActive(item); return <li key={item.href}><Link prefetch={false} href={item.href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}><Icon className="size-[18px]" strokeWidth={1.75} />{item.label}</Link></li> })}</ul>
        </nav>
        <div className="p-3"><div className="rounded-xl border border-border bg-muted/40 px-4 py-3"><p className="flex items-center gap-2 text-[13px] font-medium text-foreground"><span className="size-2 rounded-full bg-success" /> Cloudflare</p><p className="mt-1 text-xs text-muted-foreground">D1 database · R2 media</p></div></div>
      </aside>

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
          <Link prefetch={false} href="/admin/" className="flex items-center gap-2.5 md:hidden"><LogoTile className="size-8" /><span className="text-sm font-semibold tracking-tight">Suhanur Rahman</span></Link>
          <div className="ml-auto flex items-center gap-3">
            <a href="/" target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">View site <ExternalLink className="size-4" strokeWidth={1.75} /></a>
            <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1.5"><span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border">SR</span><span className="hidden flex-col leading-tight sm:flex"><span className="text-[13px] font-semibold tracking-tight">Suhanur Rahman</span><span className="text-xs text-muted-foreground">Administrator</span></span></div>
            <span className="hidden h-6 w-px bg-border sm:block" />
            <form action="/api/admin/logout" method="post"><button type="submit" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><LogOut className="size-4" strokeWidth={1.75} /><span className="hidden sm:inline">Sign out</span></button></form>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{NAV.map((item) => { const Icon = item.icon; const active = isActive(item); return <Link prefetch={false} key={item.href} href={item.href} className={cn('inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-colors', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')}><Icon className="size-4" strokeWidth={1.75} />{item.label}</Link> })}</nav>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
