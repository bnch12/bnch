'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { BriefcaseBusiness, ChevronDown, Loader2, Menu, Moon, Search, Sun, X } from 'lucide-react'

type MenuItem = { id: string; categoryId: string; name: string; slug: string; parentId: string | null; sortOrder: number; children: MenuItem[] }
type Result = { title: string; slug: string; excerpt: string | null; coverImage: string | null; categoryName: string | null }
type Category = { id: string; name: string; slug: string }

export default function PublicHeader({ categories, menu }: { categories: Category[]; menu: MenuItem[] }) {
  const nav = menu.length ? menu : categories.slice(0, 7).map((c, index) => ({ id: `fallback-${c.id}`, categoryId: c.id, name: c.name, slug: c.slug, parentId: null, sortOrder: index, children: [] }))
  const [scrolled, setScrolled] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const current = root.dataset.theme
    if (!current) root.dataset.theme = 'light'
    setDark(current === 'dark')
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function toggleTheme() {
    const root = document.documentElement
    const next = dark ? 'light' : 'dark'
    root.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch {}
    setDark(!dark)
  }

  function closeDrawer() {
    setDrawer(false)
    setExpandedMobile(null)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .site-public .mag-nav { overflow: visible; }
        .site-public .mag-nav-dropdown { position: relative; }
        .site-public .mag-nav-link { display: inline-flex; align-items: center; gap: 4px; }
        .site-public .mag-nav-chevron { transition: transform .18s ease; }
        .site-public .mag-nav-dropdown:hover .mag-nav-chevron,
        .site-public .mag-nav-dropdown:focus-within .mag-nav-chevron { transform: rotate(180deg); }
        .site-public .mag-nav-submenu { position: absolute; top: calc(100% + 8px); left: 50%; min-width: 190px; padding: 8px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-lg); opacity: 0; visibility: hidden; pointer-events: none; transform: translate(-50%, -6px); transition: opacity .16s ease, transform .16s ease, visibility .16s ease; z-index: 260; }
        .site-public .mag-nav-submenu::before { content: ''; position: absolute; left: 50%; top: -6px; width: 10px; height: 10px; background: var(--surface); border-left: 1px solid var(--line); border-top: 1px solid var(--line); transform: translateX(-50%) rotate(45deg); }
        .site-public .mag-nav-submenu a { display: block; padding: 9px 11px; border-radius: 8px; font-size: 14px; line-height: 1.35; color: var(--fg); }
        .site-public .mag-nav-submenu a::after { display: none; }
        .site-public .mag-nav-submenu a:hover { background: var(--bg-2); color: var(--accent); }
        .site-public .mag-nav-dropdown:hover .mag-nav-submenu,
        .site-public .mag-nav-dropdown:focus-within .mag-nav-submenu { opacity: 1; visibility: visible; pointer-events: auto; transform: translate(-50%, 0); }
        .site-public .mag-drawer-portfolio { display: flex !important; align-items: center; justify-content: center; gap: 8px; margin: 0 0 14px; padding: 11px 14px !important; border: 1px solid var(--line) !important; border-radius: 10px; background: var(--surface); color: var(--fg); font-size: 17px !important; }
        .site-public .mag-drawer-group { border-bottom: 1px solid var(--line-2); }
        .site-public .mag-drawer-row { display: flex; align-items: center; gap: 8px; }
        .site-public .mag-drawer-row > a { flex: 1; border-bottom: 0 !important; }
        .site-public .mag-drawer-toggle { flex: 0 0 auto; width: 40px; height: 40px; display: inline-grid; place-items: center; border: 0; background: transparent; color: var(--muted); cursor: pointer; border-radius: 8px; }
        .site-public .mag-drawer-toggle:hover { background: var(--bg-2); color: var(--fg); }
        .site-public .mag-drawer-toggle svg { transition: transform .18s ease; }
        .site-public .mag-drawer-group.is-expanded .mag-drawer-toggle svg { transform: rotate(180deg); }
        .site-public .mag-drawer-children { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .2s ease; }
        .site-public .mag-drawer-group.is-expanded .mag-drawer-children { grid-template-rows: 1fr; }
        .site-public .mag-drawer-children-inner { min-height: 0; overflow: hidden; padding-left: 12px; }
        .site-public .mag-drawer-children-inner a { font-size: 17px; padding: 10px 0 10px 14px; border-bottom: 0; color: var(--muted); }
        .site-public .mag-drawer-children-inner a:hover { color: var(--accent); }
        .site-public .mag-search-all { display: block; flex: 0 0 auto; margin-top: 10px; padding: 12px 2px 2px; border-top: 1px solid var(--line-2); color: var(--accent); font-size: 13px; font-weight: 600; text-align: center; }
        .site-public .mag-search { overflow: hidden; }
        .site-public .mag-search-box { width: min(720px, 100%); align-self: flex-start; height: calc(100dvh - 8vh - 20px); max-height: calc(100dvh - 32px); min-height: 0; display: flex; flex-direction: column; }
        .site-public .mag-search-results { margin-top: 14px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; scrollbar-width: thin; touch-action: pan-y; flex: 1 1 auto; min-height: 0; max-height: none; }
        .site-public .mag-search-field { flex: 0 0 auto; }
        .site-public .mag-search-item { display: flex; gap: 14px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--line-2); transition: background 0.15s ease; }
        .site-public .mag-search-item:last-child { border-bottom: 0; }
        .site-public .mag-search-item:hover { background: var(--bg-2); }
        .site-public .mag-search-item img { width: 64px; height: 48px; object-fit: cover; border-radius: 8px; background: var(--bg-2); flex: 0 0 auto; }
        .site-public .mag-search-item h4 { margin: 0; font-size: 17px; font-weight: 700; line-height: 1.3; }
        .site-public .mag-search-item span { font-size: 12.5px; color: var(--muted); }
        .site-public .mag-search-empty { padding: 22px 18px; color: var(--muted); font-size: 15px; }
        @media (max-width: 720px) {
          .site-public .mag-nav { display: none; }
          .site-public .mag-search { align-items: flex-start; padding: max(16px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom)); overflow: hidden; }
          .site-public .mag-search-box { width: 100%; height: calc(100dvh - max(16px, env(safe-area-inset-top)) - max(12px, env(safe-area-inset-bottom)) - 16px); max-height: none; min-height: 0; }
          .site-public .mag-search-field { border-radius: 14px; padding-left: 14px; }
          .site-public .mag-search-field input { font-size: 18px; padding: 10px 0; }
          .site-public .mag-search-results { width: 100%; flex: 1 1 auto; height: auto; max-height: none; min-height: 0; margin-top: 10px; border-radius: 14px; overflow-y: scroll; touch-action: pan-y; -webkit-overflow-scrolling: touch; }
          .site-public .mag-search-item { padding: 13px 14px; }
          .site-public .mag-search-item h4 { font-size: 16px; }
          .site-public .mag-search-item span { font-size: 12px; }
          .site-public .mag-search-all { flex: 0 0 auto; margin-top: 0; padding: 14px 2px 2px; }
        }
      ` }} />

      <header className={`mag-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="mag-container mag-header-inner">
          <button className="mag-icon-btn mag-menu-btn" aria-label="Menu" onClick={() => setDrawer(true)}>
            <Menu size={19} strokeWidth={1.9} />
          </button>
          <Link href="/" className="mag-logo">সোহানুর{'\u00a0'}<b>রহমান</b><span style={{ fontSize: '0.5em', color: 'var(--accent)', marginLeft: 6, fontWeight: 600 }}>জার্নাল</span></Link>
          <nav className="mag-nav" aria-label="Sections">
            {nav.map((item) => (
              <div key={item.id} className={item.children.length ? 'mag-nav-dropdown' : 'mag-nav-item'}>
                <Link href={`/category/${item.slug}/`} className="mag-nav-link">
                  {item.name}
                  {item.children.length ? <ChevronDown className="mag-nav-chevron" size={13} strokeWidth={1.8} /> : null}
                </Link>
                {item.children.length ? (
                  <div className="mag-nav-submenu" role="menu">
                    {item.children.map((child) => <Link key={child.id} href={`/category/${child.slug}/`} role="menuitem">{child.name}</Link>)}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>
          <div className="mag-tools">
            <button className="mag-icon-btn" aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={18} strokeWidth={1.9} /></button>
            <a className="mag-portfolio" href="https://suhanurrahman.com/" target="_blank" rel="noreferrer" aria-label="Portfolio"><BriefcaseBusiness size={17} strokeWidth={1.8} /><span>পোর্টফলিও</span></a>
            <button className="mag-icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>{dark ? <Sun size={18} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}</button>
          </div>
        </div>
      </header>

      {drawer && (
        <div className="mag-drawer is-open" role="dialog" aria-modal="true">
          <div className="mag-drawer-scrim" onClick={closeDrawer} />
          <div className="mag-drawer-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="mag-logo">সোহানুর{'\u00a0'}<b>রহমান</b><span style={{ fontSize: '0.5em', color: 'var(--accent)', marginLeft: 6, fontWeight: 600 }}>জার্নাল</span></span>
              <button className="mag-icon-btn" aria-label="Close" onClick={closeDrawer}><X size={18} /></button>
            </div>

            <a className="mag-drawer-portfolio" href="https://suhanurrahman.com/" target="_blank" rel="noreferrer">
              <BriefcaseBusiness size={17} strokeWidth={1.8} />
              পোর্টফলিও
            </a>

            <Link href="/" onClick={closeDrawer}>হোম</Link>
            {nav.map((item) => (
              <div key={item.id} className={`mag-drawer-group${expandedMobile === item.id ? ' is-expanded' : ''}`}>
                <div className="mag-drawer-row">
                  <Link href={`/category/${item.slug}/`} onClick={closeDrawer}>{item.name}</Link>
                  {item.children.length ? (
                    <button
                      type="button"
                      className="mag-drawer-toggle"
                      aria-label={`${item.name} submenu`}
                      aria-expanded={expandedMobile === item.id}
                      onClick={() => setExpandedMobile((current) => current === item.id ? null : item.id)}
                    >
                      <ChevronDown size={19} strokeWidth={1.9} />
                    </button>
                  ) : null}
                </div>
                {item.children.length ? (
                  <div className="mag-drawer-children">
                    <div className="mag-drawer-children-inner">
                      {item.children.map((child) => (
                        <Link key={child.id} href={`/category/${child.slug}/`} onClick={closeDrawer}>{child.name}</Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  useEffect(() => {
    const term = q.trim()
    if (!term) { setResults([]); setTouched(false); return }
    setLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        const data = await res.json()
        setResults(data.results || [])
        setTouched(true)
      } catch {} finally { setLoading(false) }
    }, 250)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [q])

  return (
    <div className="mag-search" onMouseDown={onClose}>
      <div className="mag-search-box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mag-search-field">
          {loading ? <Loader2 className="spin" style={{ width: 20, height: 20 }} /> : <Search size={20} strokeWidth={1.9} />}
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="লেখা খুঁজুন…" aria-label="Search" />
          <button className="mag-icon-btn" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        {results.length > 0 && <div className="mag-search-results">{results.map((r) => (
          <Link key={r.slug} href={`/${r.slug}/`} className="mag-search-item" onClick={onClose}>
            {r.coverImage ? <img src={r.coverImage} alt="" /> : <span className="mag-search-item" style={{ padding: 0, width: 64, height: 48, background: 'var(--bg-2)', borderRadius: 8 }} />}
            <span style={{ minWidth: 0 }}><h4>{r.title}</h4><span>{r.categoryName || 'Journal'}</span></span>
          </Link>
        ))}</div>}
        {touched && !loading && !results.length && q.trim() && <div className="mag-search-results"><div className="mag-search-empty">“{q}” — কোনো ফলাফল পাওয়া যায়নি।</div></div>}
        {q.trim() && !loading && <Link className="mag-search-all" href={`/search/?q=${encodeURIComponent(q.trim())}`} onClick={onClose}>সব ফলাফল দেখুন ↗</Link>}
      </div>
    </div>
  )
}