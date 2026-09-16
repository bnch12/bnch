import { isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  if (!(await isAdmin(request))) return new Response('Unauthorized',{status:401})
  const form=await request.formData(); const id=String(form.get('id')||''); const status=String(form.get('status')||'PENDING')
  if (!id || !['APPROVED','PENDING','SPAM','TRASH'].includes(status)) return new Response('Invalid request',{status:400})

  const existing = await db.prepare(`SELECT id,status FROM comments WHERE id=? AND deleted_at IS NULL`).bind(id).first<{ id:string; status:string }>()
  if (!existing) return new Response('Comment not found',{status:404})
  if (existing.status === status) return Response.redirect(new URL('/admin/comments/',request.url),303)

  const now=new Date().toISOString()
  await db.prepare(`UPDATE comments SET status=?,deleted_at=? WHERE id=?`).bind(status,status==='TRASH'?now:null,id).run()
  return Response.redirect(new URL('/admin/comments/',request.url),303)
}
