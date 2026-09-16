import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Label, Select } from '@/app/admin/components/ui'
import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react'

type Category = { id: string; name: string; slug: string }
type MenuRow = { id: string; categoryId: string; categoryName: string; categorySlug: string; parentId: string | null; sortOrder: number }

export default async function HeaderMenuPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireAdmin()
  const params = await searchParams

  const [categories, menuResult] = await Promise.all([
    db.prepare(`SELECT id,name,slug FROM categories WHERE deleted_at IS NULL ORDER BY name`).all<Category>(),
    db.prepare(`SELECT m.id,m.category_id AS categoryId,c.name AS categoryName,c.slug AS categorySlug,m.parent_id AS parentId,m.sort_order AS sortOrder FROM header_menu_items m JOIN categories c ON c.id=m.category_id AND c.deleted_at IS NULL ORDER BY CASE WHEN m.parent_id IS NULL THEN 0 ELSE 1 END,m.parent_id,m.sort_order,m.id`).all<MenuRow>(),
  ])

  const menu = menuResult.results
  const used = new Set(menu.map((item) => item.categoryId))
  const available = categories.results.filter((category) => !used.has(category.id))
  const topLevel = menu.filter((item) => !item.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
  const childrenByParent = new Map<string, MenuRow[]>()
  for (const item of menu.filter((row) => row.parentId)) {
    const list = childrenByParent.get(item.parentId!) || []
    list.push(item)
    childrenByParent.set(item.parentId!, list)
  }

  return (
    <>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Site navigation</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">Header menu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose categories for the header and place categories under a top-level item to create a dropdown. Logo, search and theme controls are fixed.</p>
      </div>

      {params.error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{params.error}</div> : null}
      {params.success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{params.success}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Add category to header</CardTitle>
        </CardHeader>
        <CardContent>
          {available.length ? (
            <form action="/api/admin/navigation" method="post" className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <input type="hidden" name="intent" value="add" />
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select name="categoryId" defaultValue="" required>
                  <option value="" disabled>Select a category</option>
                  {available.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Parent</Label>
                <Select name="parentId" defaultValue="">
                  <option value="">Top level</option>
                  {topLevel.map((item) => <option key={item.id} value={item.id}>↳ {item.categoryName}</option>)}
                </Select>
              </div>
              <Button type="submit">
                <Plus className="size-4" strokeWidth={2} /> Add to menu
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">All active categories are already in the header menu.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Current header structure</CardTitle>
          <Badge variant="secondary">{menu.length} items</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {!topLevel.length ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">No categories are currently assigned to the header menu.</p>
          ) : (
            <div className="divide-y divide-border">
              {topLevel.map((item, index) => {
                const children = childrenByParent.get(item.id) || []
                return (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>{item.categoryName}</span>
                          {children.length ? <Badge>Dropdown · {children.length}</Badge> : null}
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">/category/{item.categorySlug}/</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <form action="/api/admin/navigation" method="post">
                          <input type="hidden" name="intent" value="move" />
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="direction" value="up" />
                          <Button type="submit" size="icon" variant="ghost" disabled={index === 0} aria-label="Move up"><ArrowUp className="size-4" /></Button>
                        </form>
                        <form action="/api/admin/navigation" method="post">
                          <input type="hidden" name="intent" value="move" />
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="direction" value="down" />
                          <Button type="submit" size="icon" variant="ghost" disabled={index === topLevel.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></Button>
                        </form>
                        <form action="/api/admin/navigation" method="post">
                          <input type="hidden" name="intent" value="remove" />
                          <input type="hidden" name="id" value={item.id} />
                          <Button type="submit" size="icon" variant="ghost" className="text-destructive hover:bg-rose-50 hover:text-destructive" disabled={children.length > 0} aria-label="Remove from menu"><Trash2 className="size-4" /></Button>
                        </form>
                      </div>
                    </div>

                    {children.length ? (
                      <div className="mt-3 ml-5 space-y-2 border-l border-border pl-4">
                        {children.map((child, childIndex) => (
                          <div key={child.id} className="flex items-center gap-3 rounded-lg bg-muted/35 px-3 py-2.5">
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium">{child.categoryName}</div>
                              <div className="font-mono text-[11px] text-muted-foreground">/category/{child.categorySlug}/</div>
                            </div>
                            <form action="/api/admin/navigation" method="post">
                              <input type="hidden" name="intent" value="parent" />
                              <input type="hidden" name="id" value={child.id} />
                              <input type="hidden" name="parentId" value="" />
                              <Button type="submit" size="sm" variant="ghost">Top level</Button>
                            </form>
                            <form action="/api/admin/navigation" method="post">
                              <input type="hidden" name="intent" value="move" />
                              <input type="hidden" name="id" value={child.id} />
                              <input type="hidden" name="direction" value="up" />
                              <Button type="submit" size="icon" variant="ghost" disabled={childIndex === 0} aria-label="Move up"><ArrowUp className="size-4" /></Button>
                            </form>
                            <form action="/api/admin/navigation" method="post">
                              <input type="hidden" name="intent" value="move" />
                              <input type="hidden" name="id" value={child.id} />
                              <input type="hidden" name="direction" value="down" />
                              <Button type="submit" size="icon" variant="ghost" disabled={childIndex === children.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></Button>
                            </form>
                            <form action="/api/admin/navigation" method="post">
                              <input type="hidden" name="intent" value="remove" />
                              <input type="hidden" name="id" value={child.id} />
                              <Button type="submit" size="icon" variant="ghost" className="text-destructive hover:bg-rose-50 hover:text-destructive" aria-label="Remove from menu"><Trash2 className="size-4" /></Button>
                            </form>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
