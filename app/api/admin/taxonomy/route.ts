import { isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify } from '@/lib/slug'

const TYPES = ['category', 'tag'] as const
type TaxonomyType = typeof TYPES[number]

function tableFor(type: TaxonomyType) {
  return type === 'category' ? 'categories' : 'tags'
}

function redirect(request: Request, params: Record<string, string>) {
  const url = new URL('/admin/taxonomy/', request.url)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return Response.redirect(url, 303)
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) return new Response('Unauthorized', { status: 401 })

  try {
    const form = await request.formData()
    const type = String(form.get('type') || '') as TaxonomyType
    const intent = String(form.get('intent') || 'create')
    const id = String(form.get('id') || '').trim()
    const name = String(form.get('name') || '').trim().slice(0, 100)

    if (!TYPES.includes(type)) return redirect(request, { error: 'Invalid taxonomy type.' })

    const table = tableFor(type)
    const prefix = type === 'category' ? 'cat' : 'tag'
    const now = new Date().toISOString()

    if (intent === 'delete' || intent === 'trash') {
      if (!id) return redirect(request, { error: 'Taxonomy ID is required.' })
      const existing = await db.prepare(`SELECT id FROM ${table} WHERE id=? LIMIT 1`).bind(id).first<{ id: string }>()
      if (!existing) return redirect(request, { error: 'That item no longer exists.' })
      await db.prepare(`UPDATE ${table} SET deleted_at=? WHERE id=?`).bind(now, id).run()
      return redirect(request, { success: `${type === 'category' ? 'Category' : 'Tag'} moved to Trash.` })
    }

    if (!name) return redirect(request, { error: 'Name is required.' })

    const slug = slugify(String(form.get('slug') || name))
    if (!slug) return redirect(request, { error: 'A valid slug is required.' })

    if (intent === 'update') {
      if (!id) return redirect(request, { error: 'Taxonomy ID is required.' })

      const duplicate = await db.prepare(`SELECT id,deleted_at AS deletedAt FROM ${table} WHERE (name=? OR slug=?) AND id<>? LIMIT 1`)
        .bind(name, slug, id)
        .first<{ id: string; deletedAt: string | null }>()

      if (duplicate && !duplicate.deletedAt) {
        return redirect(request, { error: `A ${type} with that name or slug already exists.` })
      }
      if (duplicate && duplicate.deletedAt) {
        return redirect(request, { error: `A deleted ${type} already uses that name or slug. Restore it from Trash first.` })
      }

      const result = await db.prepare(`UPDATE ${table} SET name=?,slug=?,deleted_at=NULL WHERE id=?`).bind(name, slug, id).run()
      if (!result.meta.changes) return redirect(request, { error: 'Nothing was updated. The item may have been removed.' })
      return redirect(request, { success: `${type === 'category' ? 'Category' : 'Tag'} updated.` })
    }

    const existing = await db.prepare(`SELECT id,deleted_at AS deletedAt FROM ${table} WHERE name=? OR slug=? LIMIT 1`)
      .bind(name, slug)
      .first<{ id: string; deletedAt: string | null }>()

    if (existing) {
      if (existing.deletedAt) {
        await db.prepare(`UPDATE ${table} SET name=?,slug=?,deleted_at=NULL WHERE id=?`).bind(name, slug, existing.id).run()
        return redirect(request, { success: `Existing deleted ${type} restored.` })
      }
      return redirect(request, { error: `A ${type} with that name or slug already exists.` })
    }

    await db.prepare(`INSERT INTO ${table} (id,name,slug,deleted_at) VALUES (?,?,?,NULL)`)
      .bind(`${prefix}-${crypto.randomUUID()}`, name, slug)
      .run()

    return redirect(request, { success: `${type === 'category' ? 'Category' : 'Tag'} added.` })
  } catch (error) {
    console.error('taxonomy mutation failed', error)
    return redirect(request, { error: 'Could not save this taxonomy item. Please try again.' })
  }
}
