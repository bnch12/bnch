import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { SITE } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags] = await Promise.all([
    db.prepare(`SELECT slug, updated_at AS updatedAt FROM posts WHERE status='PUBLISHED' AND deleted_at IS NULL AND (noindex IS NULL OR noindex=0) ORDER BY published_at DESC`).all<{ slug: string; updatedAt: string }>(),
    db.prepare(`SELECT c.slug, MAX(p.updated_at) AS updatedAt FROM categories c JOIN posts p ON p.category_id=c.id WHERE c.deleted_at IS NULL AND p.status='PUBLISHED' AND p.deleted_at IS NULL GROUP BY c.slug`).all<{ slug: string; updatedAt: string | null }>(),
    db.prepare(`SELECT t.slug, MAX(p.updated_at) AS updatedAt FROM tags t JOIN post_tags pt ON pt.tag_id=t.id JOIN posts p ON p.id=pt.post_id WHERE t.deleted_at IS NULL AND p.status='PUBLISHED' AND p.deleted_at IS NULL GROUP BY t.slug`).all<{ slug: string; updatedAt: string | null }>(),
  ])

  return [
    { url: `${SITE}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/about/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/privacy/`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ...posts.results.map((p) => ({ url: `${SITE}/${p.slug}/`, lastModified: new Date(p.updatedAt), changeFrequency: 'weekly' as const, priority: 0.9 })),
    ...categories.results.map((c) => ({ url: `${SITE}/category/${c.slug}/`, lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...tags.results.map((t) => ({ url: `${SITE}/tag/${t.slug}/`, lastModified: t.updatedAt ? new Date(t.updatedAt) : new Date(), changeFrequency: 'weekly' as const, priority: 0.5 })),
  ]
}
