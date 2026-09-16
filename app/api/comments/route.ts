import { db } from '@/lib/db'

export async function POST(request: Request) {
  const form = await request.formData()
  const postId = String(form.get('postId') || '').trim()
  const parentCommentId = String(form.get('parentCommentId') || '').trim() || null
  const name = String(form.get('name') || '').trim().slice(0, 80)
  const email = String(form.get('email') || '').trim().slice(0, 160)
  const body = String(form.get('body') || '').trim().slice(0, 5000)
  if (!postId || !name || !body) return new Response('Missing required fields', { status: 400 })

  if (parentCommentId) {
    const parent = await db.prepare(`SELECT id FROM comments WHERE id=? AND post_id=? AND status='APPROVED' AND deleted_at IS NULL LIMIT 1`).bind(parentCommentId, postId).first<{ id: string }>()
    if (!parent) return new Response('Parent comment not found', { status: 400 })
  }

  const id = crypto.randomUUID()
  await db.prepare(`INSERT INTO comments (id, post_id, name, email, body, status, created_at, comment_type, parent_comment_id) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`)
    .bind(id, postId, name, email || null, body, new Date().toISOString(), parentCommentId ? 'reply' : 'comment', parentCommentId).run()

  return Response.redirect(new URL(request.headers.get('referer') || '/', request.url), 303)
}
