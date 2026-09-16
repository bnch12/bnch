'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { catColor, formatDate, shortText } from '@/lib/publicUi'

export type Card = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  categoryName: string | null
  categorySlug?: string | null
  publishedAt: string | null
}

export function PostCard({ post, instant }: { post: Card; instant?: boolean }) {
  const color = catColor(post.categoryName)
  return (
    <article className={instant ? 'mag-card' : 'mag-card reveal'} style={{ ['--cat' as string]: color }}>
      <Link href={`/${post.slug}/`} className={`mag-card-media${post.coverImage ? '' : ' placeholder'}`}>
        {post.coverImage ? <img src={post.coverImage} alt={post.title} loading="lazy" /> : null}
      </Link>
      <div className="mag-card-body">
        {post.categoryName && post.categorySlug ? <Link className="mag-chip" href={`/category/${post.categorySlug}/`}>{post.categoryName}</Link> : <span className="mag-chip">Journal</span>}
        <h3 className="mag-card-title"><Link href={`/${post.slug}/`}>{post.title}</Link></h3>
        <p className="mag-card-dek">{shortText(post.excerpt, 130)}</p>
        <div className="mag-card-foot">
          <span className="mag-meta">{formatDate(post.publishedAt)}</span>
          <a className="mag-meta" href="https://suhanurrahman.com/" target="_blank" rel="noreferrer">সোহানুর রহমান</a>
        </div>
      </div>
    </article>
  )
}

export default function PostGrid({
  initialPosts,
  offsetStart,
  hasMore: initialHasMore,
}: {
  initialPosts: Card[]
  offsetStart: number
  hasMore: boolean
}) {
  const [posts, setPosts] = useState<Card[]>(initialPosts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const initialCount = initialPosts.length

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts?offset=${offsetStart + posts.length}&limit=9`)
      const data = await res.json()
      setPosts((prev) => [...prev, ...(data.posts || [])])
      setHasMore(Boolean(data.hasMore))
      requestAnimationFrame(() => window.dispatchEvent(new Event('scroll')))
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mag-grid">
        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} instant={i >= initialCount} />
        ))}
      </div>
      {hasMore && (
        <div className="mag-loadmore">
          <button className="mag-btn" onClick={loadMore} disabled={loading}>
            {loading ? <Loader2 className="spin" /> : <Plus size={17} strokeWidth={2} />}
            {loading ? 'লোড হচ্ছে…' : 'আরও লেখা দেখুন'}
          </button>
        </div>
      )}
    </>
  )
}
