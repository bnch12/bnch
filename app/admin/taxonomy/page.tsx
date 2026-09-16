import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/app/admin/components/ui'
import { Plus } from 'lucide-react'

type Term = { id: string; name: string; slug: string; postCount: number }

export default async function TaxonomyPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireAdmin()
  const params = await searchParams

  const [categories, tags] = await Promise.all([
    db.prepare(`SELECT c.id,c.name,c.slug,COUNT(DISTINCT CASE WHEN p.deleted_at IS NULL THEN pc.post_id END) AS postCount FROM categories c LEFT JOIN post_categories pc ON pc.category_id=c.id LEFT JOIN posts p ON p.id=pc.post_id WHERE c.deleted_at IS NULL GROUP BY c.id,c.name,c.slug ORDER BY c.name`).all<Term>(),
    db.prepare(`SELECT t.id,t.name,t.slug,COUNT(DISTINCT CASE WHEN p.deleted_at IS NULL THEN pt.post_id END) AS postCount FROM tags t LEFT JOIN post_tags pt ON pt.tag_id=t.id LEFT JOIN posts p ON p.id=pt.post_id WHERE t.deleted_at IS NULL GROUP BY t.id,t.name,t.slug ORDER BY t.name`).all<Term>(),
  ])

  const AddForm = ({ type, label }: { type: 'category' | 'tag'; label: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action="/api/admin/taxonomy" method="post" className="grid gap-4">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="intent" value="create" />
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input name="name" required />
          </div>
          <div className="grid gap-2">
            <Label>Slug</Label>
            <Input name="slug" placeholder="optional" />
          </div>
          <div>
            <Button type="submit">
              <Plus className="size-4" strokeWidth={2} /> {label}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )

  const TermTable = ({ title, type, prefix, items }: { title: string; type: 'category' | 'tag'; prefix: string; items: Term[] }) => (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge variant="secondary">{items.length}</Badge>
      </CardHeader>
      {items.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Slug</th>
                <th className="px-6 py-3 font-semibold">Posts</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-3 font-medium">{item.name}</td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{prefix}{item.slug}/</td>
                  <td className="px-6 py-3 tabular-nums text-muted-foreground">{item.postCount}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <details className="group">
                        <summary className="inline-flex h-8 cursor-pointer list-none items-center rounded-lg border border-input bg-card px-3 text-[13px] font-medium text-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">
                          Edit
                        </summary>
                        <form action="/api/admin/taxonomy" method="post" className="mt-2 grid min-w-60 gap-3 rounded-lg border border-border bg-muted/30 p-3">
                          <input type="hidden" name="type" value={type} />
                          <input type="hidden" name="intent" value="update" />
                          <input type="hidden" name="id" value={item.id} />
                          <div className="grid gap-1.5">
                            <Label>Name</Label>
                            <Input name="name" defaultValue={item.name} required />
                          </div>
                          <div className="grid gap-1.5">
                            <Label>Slug</Label>
                            <Input name="slug" defaultValue={item.slug} required />
                          </div>
                          <div>
                            <Button type="submit" size="sm">Save changes</Button>
                          </div>
                        </form>
                      </details>
                      <form action="/api/admin/taxonomy" method="post">
                        <input type="hidden" name="type" value={type} />
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={item.id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive hover:bg-rose-50 hover:text-destructive">
                          Move to Trash
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-6 py-5 text-sm text-muted-foreground">No active {title.toLowerCase()} yet.</p>
      )}
    </Card>
  )

  return (
    <>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Content structure</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">Categories &amp; tags</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your taxonomy and create new terms. Deleted terms are kept in Trash so they can be restored safely.</p>
      </div>

      {params.error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{params.error}</div> : null}
      {params.success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{params.success}</div> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <AddForm type="category" label="Add category" />
        <AddForm type="tag" label="Add tag" />
      </div>

      <TermTable title="Categories" type="category" prefix="/category/" items={categories.results} />
      <TermTable title="Tags" type="tag" prefix="/tag/" items={tags.results} />
    </>
  )
}
