import type { Post, Category, Tag } from './types'
import { env } from 'cloudflare:workers'

type BlogEnv = typeof env & { BLOG_DB: D1Database }
const db = (env as BlogEnv).BLOG_DB

const postSelect = `p.id,p.title,p.slug,p.excerpt,p.content,p.content_format AS contentFormat,p.cover_image AS coverImage,p.status,p.published_at AS publishedAt,p.created_at AS createdAt,p.updated_at AS updatedAt,p.category_id AS categoryId,p.seo_title AS seoTitle,p.seo_description AS seoDescription,p.seo_keywords AS seoKeywords,p.og_image AS ogImage,p.canonical_url AS canonicalUrl,p.noindex`

// Lean column set for list/card views. These never render the article body or
// SEO metadata, so we avoid pulling the (potentially large) `content` column
// and unused SEO fields out of D1 — less data over the wire and less Worker
// CPU per request. Only `getPostBySlug` (the article page) needs `postSelect`.
const cardSelect = `p.id,p.title,p.slug,p.excerpt,p.cover_image AS coverImage,p.published_at AS publishedAt,p.category_id AS categoryId`

// ---------------------------------------------------------------------------
// In-isolate read cache
//
// The public pages are dynamic (rendered per request), so without this every
// visit re-runs the same read-only queries against D1 and burns `rows_read`.
// This is a small time-based memoizer that lives in the Worker isolate's
// memory: the first request after the TTL expires hits D1, and every request
// the same warm isolate serves within the TTL reuses the result. It is
// best-effort — not shared across isolates/colos and cleared when an isolate
// recycles — and only ever serves data at most `CACHE_TTL_MS` old. Only the
// public read helpers below use it; admin queries are never cached, so a change
// made in the CMS appears on the public site within one TTL window.
const CACHE_TTL_MS = 60_000
const CACHE_MAX_ENTRIES = 500
const readCache = new Map<string, { expires: number; value: unknown }>()

async function cachedRead<T>(key: string, loader: () => Promise<T>, ttlMs = CACHE_TTL_MS): Promise<T> {
  const now = Date.now()
  const hit = readCache.get(key)
  if (hit && hit.expires > now) return hit.value as T
  const value = await loader()
  // Keep memory bounded: purge expired entries (then the oldest if still over
  // the cap) before recording the fresh one. Map preserves insertion order.
  if (readCache.size >= CACHE_MAX_ENTRIES) {
    for (const [k, v] of readCache) if (v.expires <= now) readCache.delete(k)
    while (readCache.size >= CACHE_MAX_ENTRIES) {
      const oldest = readCache.keys().next().value
      if (oldest === undefined) break
      readCache.delete(oldest)
    }
  }
  readCache.set(key, { expires: now + ttlMs, value })
  return value
}

export type HeaderMenuItem = {
  id: string
  categoryId: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  children: HeaderMenuItem[]
}

export async function listPublishedPosts(limit = 20, offset = 0): Promise<Post[]> {
  return cachedRead(`posts:${limit}:${offset}`, async () => {
    const result = await db.prepare(`SELECT ${cardSelect}, c.name AS categoryName,c.slug AS categorySlug FROM posts p LEFT JOIN categories c ON c.id=p.category_id AND c.deleted_at IS NULL WHERE p.status='PUBLISHED' AND p.published_at IS NOT NULL AND p.deleted_at IS NULL ORDER BY p.published_at DESC LIMIT ? OFFSET ?`).bind(limit, offset).all<Post>()
    return result.results
  })
}

export async function listTechnologyPosts(limit = 6): Promise<Post[]> {
  return cachedRead(`tech:${limit}`, async () => {
    const result = await db.prepare(`SELECT ${cardSelect}, c.name AS categoryName,c.slug AS categorySlug FROM posts p JOIN categories c ON c.id=p.category_id WHERE c.deleted_at IS NULL AND (c.slug IN ('technology','tech-gossip') OR c.name IN ('প্রযুক্তি কথন','Technology')) AND p.status='PUBLISHED' AND p.published_at IS NOT NULL AND p.deleted_at IS NULL ORDER BY p.published_at DESC LIMIT ?`).bind(limit).all<Post>()
    return result.results
  })
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return cachedRead(`post:${slug}`, async () =>
    await db.prepare(`SELECT ${postSelect},c.name AS categoryName,c.slug AS categorySlug FROM posts p LEFT JOIN categories c ON c.id=p.category_id AND c.deleted_at IS NULL WHERE p.slug=? AND p.status='PUBLISHED' AND p.deleted_at IS NULL LIMIT 1`).bind(slug).first<Post>(),
  )
}

export async function getCategories(): Promise<Category[]> {
  return cachedRead('categories', async () => {
    const result = await db.prepare(`SELECT id,name,slug FROM categories WHERE deleted_at IS NULL ORDER BY name`).all<Category>()
    return result.results
  })
}

export async function getHeaderMenu(): Promise<HeaderMenuItem[]> {
  return cachedRead('header-menu', async () => {
  try {
    const result = await db.prepare(`SELECT m.id,m.category_id AS categoryId,c.name,c.slug,m.parent_id AS parentId,m.sort_order AS sortOrder FROM header_menu_items m JOIN categories c ON c.id=m.category_id AND c.deleted_at IS NULL ORDER BY CASE WHEN m.parent_id IS NULL THEN 0 ELSE 1 END,m.parent_id,m.sort_order,m.id`).all<Omit<HeaderMenuItem, 'children'>>()
    const rows = result.results
    if (!rows.length) return []

    const nodes = new Map<string, HeaderMenuItem>()
    for (const row of rows) nodes.set(row.id, { ...row, children: [] })
    const roots: HeaderMenuItem[] = []
    for (const node of nodes.values()) {
      if (node.parentId && nodes.has(node.parentId)) nodes.get(node.parentId)!.children.push(node)
      else roots.push(node)
    }
    return roots
  } catch {
    return (await getCategories()).slice(0, 7).map((category, index) => ({
      id: `fallback-${category.id}`,
      categoryId: category.id,
      name: category.name,
      slug: category.slug,
      parentId: null,
      sortOrder: index,
      children: [],
    }))
  }
  })
}

const TAXONOMY_PAGE_SIZE = 24

type TaxonomyPosts = {
  posts: Post[]
  hasMore: boolean
}

export async function getCategoryBySlug(slug: string, page = 1) {
  const safePage = Math.max(1, Math.floor(page) || 1)
  const offset = (safePage - 1) * TAXONOMY_PAGE_SIZE
  return cachedRead(`category:${slug}:${safePage}`, async () => {
    const category = await db.prepare(`SELECT id,name,slug FROM categories WHERE slug=? AND deleted_at IS NULL LIMIT 1`).bind(slug).first<Category>()
    if (!category) return null
    const posts = await db.prepare(`SELECT ${cardSelect},c.name AS categoryName,c.slug AS categorySlug FROM posts p JOIN categories c ON c.id=p.category_id WHERE c.slug=? AND c.deleted_at IS NULL AND p.status='PUBLISHED' AND p.deleted_at IS NULL ORDER BY p.published_at DESC LIMIT ? OFFSET ?`).bind(slug, TAXONOMY_PAGE_SIZE + 1, offset).all<Post>()
    const result: TaxonomyPosts = {
      posts: posts.results.slice(0, TAXONOMY_PAGE_SIZE),
      hasMore: posts.results.length > TAXONOMY_PAGE_SIZE,
    }
    return { category, ...result }
  })
}

export async function getTagBySlug(slug: string, page = 1) {
  const safePage = Math.max(1, Math.floor(page) || 1)
  const offset = (safePage - 1) * TAXONOMY_PAGE_SIZE
  return cachedRead(`tag:${slug}:${safePage}`, async () => {
    const tag = await db.prepare(`SELECT id,name,slug FROM tags WHERE slug=? AND deleted_at IS NULL LIMIT 1`).bind(slug).first<Tag>()
    if (!tag) return null
    const posts = await db.prepare(`SELECT ${cardSelect},c.name AS categoryName,c.slug AS categorySlug FROM posts p JOIN post_tags pt ON pt.post_id=p.id JOIN tags t ON t.id=pt.tag_id LEFT JOIN categories c ON c.id=p.category_id AND c.deleted_at IS NULL WHERE t.slug=? AND t.deleted_at IS NULL AND p.status='PUBLISHED' AND p.deleted_at IS NULL ORDER BY p.published_at DESC LIMIT ? OFFSET ?`).bind(slug, TAXONOMY_PAGE_SIZE + 1, offset).all<Post>()
    const result: TaxonomyPosts = {
      posts: posts.results.slice(0, TAXONOMY_PAGE_SIZE),
      hasMore: posts.results.length > TAXONOMY_PAGE_SIZE,
    }
    return { tag, ...result }
  })
}

export type PublicComment = {
  id: string
  name: string
  body: string
  createdAt: string
  parentCommentId: string | null
}

export async function getComments(postId: string): Promise<PublicComment[]> {
  return cachedRead(`comments:${postId}`, async () => {
    const result = await db.prepare(`SELECT id,name,body,created_at AS createdAt,parent_comment_id AS parentCommentId FROM comments WHERE post_id=? AND status='APPROVED' AND deleted_at IS NULL ORDER BY created_at ASC`).bind(postId).all<PublicComment>()
    return result.results
  })
}

export { db }
