'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import PublicHeader from '@/app/components/public/PublicHeader'
import { RevealInit } from '@/app/components/public/enhancers'

type Result = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  categoryName: string | null
}

type Category = { id: string; name: string; slug: string }
type MenuItem = { id: string; categoryId: string; name: string; slug: string; parentId: string | null; sortOrder: number; children: MenuItem[] }

const MIN_QUERY_LENGTH = 2

export default function SearchPageClient({ categories, menu, initialQuery = '' }: { categories: Category[]; menu: MenuItem[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery.slice(0, 100))
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(initialQuery.trim().length >= MIN_QUERY_LENGTH)
  const [error, setError] = useState('')

  useEffect(() => {
    const term = query.trim().slice(0, 100)

    if (term.length < MIN_QUERY_LENGTH) {
      setResults([])
      setSearched(false)
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Search is temporarily unavailable.')
        setResults(Array.isArray(data.results) ? data.results : [])
        setSearched(true)
      } catch (fetchError) {
        if ((fetchError as DOMException).name !== 'AbortError') {
          setResults([])
          setSearched(true)
          setError(fetchError instanceof Error ? fetchError.message : 'Search is temporarily unavailable.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 450)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function onChange(value: string) {
    const next = value.slice(0, 100)
    setQuery(next)
    const trimmed = next.trim()
    window.history.replaceState(window.history.state, '', trimmed ? `/search/?q=${encodeURIComponent(trimmed)}` : '/search/')
  }

  const normalizedQuery = query.trim()
  const tooShort = normalizedQuery.length > 0 && normalizedQuery.length < MIN_QUERY_LENGTH

  return (
    <>
      <PublicHeader categories={categories} menu={menu} />
      <style>{`
        .site-public .search-page { padding: 76px 0 110px; }
        .site-public .search-hero { width: min(920px, 100%); margin: 0 auto 52px; }
        .site-public .search-kicker { margin-bottom: 10px; font-size: 11px; font-weight: 700; letter-spacing: .12em; color: var(--accent); }
        .site-public .search-title { margin: 0; font-size: clamp(42px, 7vw, 78px); line-height: 1; letter-spacing: -.04em; color: var(--fg); }
        .site-public .search-dek { max-width: 700px; margin: 18px 0 28px; color: var(--muted); font-size: 17px; line-height: 1.8; }
        .site-public .search-form { display: flex; align-items: center; gap: 8px; padding: 9px; border: 1px solid var(--line); border-radius: 17px; background: var(--surface); box-shadow: var(--shadow-sm); }
        .site-public .search-input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--fg); padding: 11px 10px; font: inherit; font-size: 18px; }
        .site-public .search-input::placeholder { color: var(--muted); opacity: .9; }
        .site-public .search-icon { flex: 0 0 auto; display: grid; place-items: center; color: var(--muted); width: 36px; height: 36px; }
        .site-public .search-submit { flex: 0 0 auto; min-width: 112px; min-height: 46px; border: 0; border-radius: 12px; padding: 10px 17px; background: var(--accent); color: #fff; font: inherit; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 7px; white-space: nowrap; }
        .site-public .search-submit svg { flex: 0 0 auto; }
        .site-public .search-results-section,
        .site-public .search-empty-state { width: min(920px, 100%); margin: 0 auto; }
        .site-public .search-summary { margin: 0 0 18px; color: var(--muted); font-size: 14px; }
        .site-public .search-results { display: grid; gap: 0; border-top: 1px solid var(--line-2); }
        .site-public .search-result { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 22px; padding: 24px 0; border-bottom: 1px solid var(--line-2); }
        .site-public .search-result-thumb { width: 170px; height: 112px; object-fit: cover; border-radius: 10px; background: var(--bg-2); }
        .site-public .search-result-placeholder { display: grid; place-items: center; color: var(--muted); font-size: 11px; }
        .site-public .search-result-category { margin-bottom: 7px; font-size: 11px; font-weight: 700; color: var(--accent); }
        .site-public .search-result-title { margin: 0 0 7px; font-size: clamp(20px, 2.2vw, 28px); line-height: 1.25; color: var(--fg); }
        .site-public .search-result-title a:hover { color: var(--accent); }
        .site-public .search-result-excerpt { margin: 0; color: var(--muted); line-height: 1.75; font-size: 15px; }
        .site-public .search-loading { display: flex; align-items: center; gap: 9px; padding: 26px 0; color: var(--muted); border-top: 1px solid var(--line-2); }
        .site-public .search-empty { padding: 40px 0; border-top: 1px solid var(--line-2); color: var(--muted); font-size: 16px; }
        .site-public .search-empty strong { color: var(--fg); }
        .site-public .search-error { padding: 22px 0; border-top: 1px solid var(--line-2); color: #b91c1c; font-size: 15px; }
        .site-public .search-spin { animation: search-spin .8s linear infinite; }
        @keyframes search-spin { to { transform: rotate(360deg); } }
        @media (max-width: 720px) {
          .site-public .search-page { padding: 52px 0 80px; }
          .site-public .search-hero { width: 100%; margin-bottom: 36px; }
          .site-public .search-results-section,
          .site-public .search-empty-state { width: 100%; margin: 0; }
          .site-public .search-form { flex-direction: row; align-items: center; gap: 6px; padding: 7px; border-radius: 15px; min-height: 62px; }
          .site-public .search-icon { width: 34px; height: 36px; }
          .site-public .search-input { font-size: 17px; padding: 9px 4px; }
          .site-public .search-submit { min-width: 108px; width: auto; height: 48px; min-height: 48px; padding: 0 14px; border-radius: 12px; gap: 6px; font-size: 14px; }
          .site-public .search-submit .search-submit-label { display: inline; }
          .site-public .search-submit svg { width: 19px; height: 19px; }
          .site-public .search-result { grid-template-columns: 1fr; gap: 14px; }
          .site-public .search-result-thumb { width: 100%; height: 190px; }
        }
      `}</style>

      <main className="mag-main search-page">
        <div className="mag-container">
          <section className="search-hero reveal">
            <div className="search-kicker">Search</div>
            <h1 className="search-title">লেখা খুঁজুন</h1>
            <p className="search-dek">শিরোনাম, সংক্ষিপ্ত বর্ণনা বা লেখার ভেতরের শব্দ দিয়ে জার্নালের লেখা খুঁজে দেখুন। লিখতে শুরু করলেই ফলাফল স্বয়ংক্রিয়ভাবে আপডেট হবে।</p>
            <form className="search-form" onSubmit={(event) => event.preventDefault()} role="search">
              <span className="search-icon" aria-hidden="true"><Search size={20} strokeWidth={1.9} /></span>
              <input className="search-input" type="search" value={query} onChange={(event) => onChange(event.target.value)} placeholder="যা খুঁজছেন লিখুন…" aria-label="Search query" autoComplete="off" enterKeyHint="search" />
              <button className="search-submit" type="submit" aria-label="লাইভ সার্চ" title="লাইভ সার্চ">
                <Search size={20} strokeWidth={2} />
                <span className="search-submit-label">লাইভ সার্চ</span>
              </button>
            </form>
          </section>

          {tooShort ? (
            <div className="search-empty-state">
              <div className="search-empty">সার্চ করার জন্য কমপক্ষে ২টি অক্ষর লিখুন।</div>
            </div>
          ) : query.trim() ? (
            <section className="search-results-section">
              <p className="search-summary">{loading ? 'ফলাফল খোঁজা হচ্ছে…' : `${results.length}টি ফলাফল`} · “{query.trim()}”</p>
              {loading ? (
                <div className="search-loading"><Loader2 className="search-spin" size={18} strokeWidth={1.9} /> ফলাফল আপডেট হচ্ছে…</div>
              ) : error ? (
                <div className="search-error">সার্চ চালাতে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।</div>
              ) : results.length ? (
                <div className="search-results">
                  {results.map((post) => (
                    <article className="search-result reveal" key={post.id}>
                      {post.coverImage ? <img className="search-result-thumb" src={post.coverImage} alt="" /> : <div className="search-result-thumb search-result-placeholder">No image</div>}
                      <div>
                        <div className="search-result-category">{post.categoryName || 'Journal'}</div>
                        <h2 className="search-result-title"><Link href={`/${post.slug}/`}>{post.title}</Link></h2>
                        {post.excerpt ? <p className="search-result-excerpt">{post.excerpt}</p> : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : searched ? (
                <div className="search-empty">“<strong>{query.trim()}</strong>” নামে, বর্ণনায় বা লেখার ভেতরে কোনো প্রকাশিত লেখা পাওয়া যায়নি।</div>
              ) : null}
            </section>
          ) : (
            <div className="search-empty-state">
              <div className="search-empty">সার্চ বক্সে লিখলেই প্রকাশিত লেখাগুলো থেকে ফলাফল দেখাবে।</div>
            </div>
          )}
        </div>
      </main>
      <RevealInit />
    </>
  )
}
