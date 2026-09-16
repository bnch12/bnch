import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { Badge, Button, Card, CardHeader, CardTitle, ConfirmSubmit } from '@/app/admin/components/ui'
import { RotateCcw, Trash2 } from 'lucide-react'

export default async function TrashPage() {
  await requireAdmin()
  const [posts, comments, categories, tags, media] = await Promise.all([
    db.prepare(`SELECT id,title,slug,deleted_at AS deletedAt FROM posts WHERE deleted_at IS NOT NULL ORDER BY datetime(deleted_at) DESC`).all<any>(),
    db.prepare(`SELECT id,name,body,deleted_at AS deletedAt FROM comments WHERE deleted_at IS NOT NULL ORDER BY datetime(deleted_at) DESC`).all<any>(),
    db.prepare(`SELECT id,name,slug,deleted_at AS deletedAt FROM categories WHERE deleted_at IS NOT NULL ORDER BY datetime(deleted_at) DESC`).all<any>(),
    db.prepare(`SELECT id,name,slug,deleted_at AS deletedAt FROM tags WHERE deleted_at IS NOT NULL ORDER BY datetime(deleted_at) DESC`).all<any>(),
    db.prepare(`SELECT id,filename,url,deleted_at AS deletedAt FROM media_assets WHERE deleted_at IS NOT NULL ORDER BY datetime(deleted_at) DESC`).all<any>(),
  ])

  const totalTrash = posts.results.length + comments.results.length + categories.results.length + tags.results.length + media.results.length

  const Section = ({ title, type, items }: { title: string; type: string; items: any[] }) => (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge variant="secondary">{items.length}</Badge>
      </CardHeader>
      <div>
        {items.length ? (
          items.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-4 border-t border-border px-6 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{x.title || x.name || x.filename || 'Item'}</p>
                <p className="truncate text-xs text-muted-foreground">{x.slug || x.body?.slice(0, 80) || x.url || ''}</p>
              </div>
              <form action="/api/admin/trash" method="post" className="flex shrink-0 items-center gap-2">
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="id" value={x.id} />
                <Button type="submit" name="action" value="restore" size="sm" variant="outline">
                  <RotateCcw className="size-3.5" strokeWidth={1.75} /> Restore
                </Button>
                <ConfirmSubmit
                  name="action"
                  value="delete"
                  size="sm"
                  message={`Permanently delete this ${type}? This cannot be undone.`}
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} /> Delete forever
                </ConfirmSubmit>
              </form>
            </div>
          ))
        ) : (
          <p className="px-6 py-5 text-sm text-muted-foreground">Trash is empty.</p>
        )}
      </div>
    </Card>
  )

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Recycle bin</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">Trash</h1>
          <p className="mt-1 text-sm text-muted-foreground">Items are soft-deleted so they can be restored without damaging migrated content.</p>
        </div>
        {totalTrash > 0 && (
          <form action="/api/admin/trash" method="post" className="shrink-0">
            <ConfirmSubmit
              name="action"
              value="delete-all"
              variant="destructive"
              message={`Permanently delete all ${totalTrash} items in Trash? This cannot be undone.`}
            >
              <Trash2 className="size-4" strokeWidth={1.75} /> Delete everything
            </ConfirmSubmit>
          </form>
        )}
      </div>

      <div className="grid gap-5">
        <Section title="Posts" type="post" items={posts.results} />
        <Section title="Comments" type="comment" items={comments.results} />
        <Section title="Categories" type="category" items={categories.results} />
        <Section title="Tags" type="tag" items={tags.results} />
        <Section title="Media" type="media" items={media.results} />
      </div>
    </>
  )
}
