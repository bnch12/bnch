import { isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const allowed = new Set(['publish', 'draft', 'trash'])

export async function POST(request: Request) {
  if (!(await isAdmin(request))) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { ids?: unknown; action?: unknown } | null
  const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean).slice(0, 50) : []
  const action = String(body?.action || '')

  if (!ids.length || !allowed.has(action)) {
    return Response.json({ error: 'Invalid bulk action' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const placeholders = ids.map(() => '?').join(',')

  if (action === 'trash') {
    await db.prepare(`UPDATE posts SET deleted_at=?, updated_at=? WHERE id IN (${placeholders})`).bind(now, now, ...ids).run()
  } else if (action === 'publish') {
    await db.prepare(`UPDATE posts SET status='PUBLISHED', published_at=COALESCE(published_at,?), deleted_at=NULL, updated_at=? WHERE id IN (${placeholders})`).bind(now, now, ...ids).run()
  } else {
    await db.prepare(`UPDATE posts SET status='DRAFT', published_at=NULL, updated_at=? WHERE id IN (${placeholders})`).bind(now, ...ids).run()
  }

  return Response.json({ ok: true, updated: ids.length })
}
