import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { Badge, Button, Card } from '@/app/admin/components/ui'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  SPAM: 'destructive',
  TRASH: 'secondary',
}

export default async function CommentsPage() {
  await requireAdmin()
  const comments = await db
    .prepare(
      `SELECT c.id,c.name,c.email,c.body,c.status,c.created_at AS createdAt,p.title,p.slug FROM comments c JOIN posts p ON p.id=c.post_id WHERE c.deleted_at IS NULL ORDER BY datetime(c.created_at) DESC LIMIT 100`,
    )
    .all<any>()

  return (
    <>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Moderation</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">Comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">Approve, hold or remove reader comments across your journal.</p>
      </div>

      {comments.results.length ? (
        <div className="grid gap-4">
          {comments.results.map((c: any) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border">
                    {(c.name || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold tracking-tight">{c.name}</p>
                    {c.email ? <p className="text-xs text-muted-foreground">{c.email}</p> : null}
                  </div>
                </div>
                <Badge variant={statusVariant[c.status] || 'secondary'}>{c.status}</Badge>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{c.body}</p>

              <p className="mt-3 text-xs text-muted-foreground">
                On{' '}
                <Link href={`/${c.slug}/`} className="font-medium text-primary hover:underline">
                  {c.title}
                </Link>
              </p>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {(['APPROVED', 'PENDING', 'SPAM', 'TRASH'] as const).map((s) => (
                  <form key={s} action="/api/admin/comments" method="post">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value={s} />
                    <Button
                      type="submit"
                      size="sm"
                      variant={s === 'APPROVED' ? 'default' : s === 'TRASH' ? 'destructive' : 'outline'}
                      disabled={c.status === s}
                      aria-disabled={c.status === s}
                    >
                      {s === 'APPROVED' ? 'Approve' : s === 'PENDING' ? 'Pending' : s === 'SPAM' ? 'Spam' : 'Trash'}
                    </Button>
                  </form>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm font-semibold">No comments yet</p>
          <p className="text-sm text-muted-foreground">Reader comments will appear here for moderation.</p>
        </Card>
      )}
    </>
  )
}
