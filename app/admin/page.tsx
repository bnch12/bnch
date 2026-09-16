import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import AdminDashboardInteractive from '@/app/admin/components/AdminDashboardInteractive'

const PAGE_SIZE = 24

type SearchParams = Promise<{ page?: string; tab?: string; q?: string }>

export default async function AdminDashboard({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin()

  const params = await searchParams
  const parsedPage = Number.parseInt(params.page || '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const tab = params.tab === 'published' || params.tab === 'drafts' ? params.tab : 'all'
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : ''

  const statusClause = tab === 'published' ? ` AND status='PUBLISHED'` : tab === 'drafts' ? ` AND status='DRAFT'` : ''
  const searchClause = query ? ` AND (title LIKE ? OR slug LIKE ?)` : ''
  const bindings = query ? [`%${query}%`, `%${query}%`] : []
  const offset = (page - 1) * PAGE_SIZE

  const posts = await db.prepare(`
    SELECT id,title,slug,status,cover_image AS coverImage,updated_at AS updatedAt
    FROM posts
    WHERE deleted_at IS NULL${statusClause}${searchClause}
    ORDER BY updated_at DESC, id DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, PAGE_SIZE + 1, offset).all<any>()

  const hasMore = posts.results.length > PAGE_SIZE
  const visiblePosts = posts.results.slice(0, PAGE_SIZE)

  const [postCounts, comments, categories, tags] = await Promise.all([
    db.prepare(`
      SELECT
        SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) AS allCount,
        SUM(CASE WHEN status='PUBLISHED' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS publishedCount,
        SUM(CASE WHEN status='DRAFT' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS draftsCount,
        SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS trashCount
      FROM posts
    `).first<any>(),
    db.prepare(`SELECT COUNT(*) AS count FROM comments WHERE status='PENDING' AND deleted_at IS NULL`).first<any>(),
    db.prepare(`SELECT COUNT(*) AS count FROM categories WHERE deleted_at IS NULL`).first<any>(),
    db.prepare(`SELECT COUNT(*) AS count FROM tags WHERE deleted_at IS NULL`).first<any>(),
  ])

  return (
    <AdminDashboardInteractive
      posts={visiblePosts}
      counts={{
        all: Number(postCounts?.allCount || 0),
        published: Number(postCounts?.publishedCount || 0),
        drafts: Number(postCounts?.draftsCount || 0),
        comments: Number(comments?.count || 0),
        categories: Number(categories?.count || 0),
        tags: Number(tags?.count || 0),
        trash: Number(postCounts?.trashCount || 0),
      }}
      page={page}
      pageSize={PAGE_SIZE}
      hasMore={hasMore}
      initialTab={tab}
      initialQuery={query}
    />
  )
}
