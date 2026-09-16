import { isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

function redirect(request: Request, params: Record<string, string>) {
  const url = new URL('/admin/navigation/', request.url)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return Response.redirect(url, 303)
}

async function reorder(parentId: string | null) {
  const rows = await db.prepare(`SELECT id FROM header_menu_items WHERE parent_id IS ? ORDER BY sort_order, id`).bind(parentId).all<{ id: string }>()
  const statements = rows.results.map((row, index) =>
    db.prepare(`UPDATE header_menu_items SET sort_order=?,updated_at=? WHERE id=?`).bind(index, new Date().toISOString(), row.id),
  )
  if (statements.length) await db.batch(statements)
  return rows.results.map((row) => row.id)
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) return new Response('Unauthorized', { status: 401 })

  try {
    const form = await request.formData()
    const intent = String(form.get('intent') || '')
    const categoryId = String(form.get('categoryId') || '').trim()
    const parentIdValue = String(form.get('parentId') || '').trim()
    const parentId = parentIdValue || null
    const id = String(form.get('id') || '').trim()

    if (intent === 'add') {
      if (!categoryId) return redirect(request, { error: 'Choose a category.' })
      const category = await db.prepare(`SELECT id,name FROM categories WHERE id=? AND deleted_at IS NULL LIMIT 1`).bind(categoryId).first<{ id: string; name: string }>()
      if (!category) return redirect(request, { error: 'That category is not available.' })

      const existing = await db.prepare(`SELECT id FROM header_menu_items WHERE category_id=? LIMIT 1`).bind(categoryId).first<{ id: string }>()
      if (existing) return redirect(request, { error: 'That category is already in the header menu.' })

      if (parentId) {
        const parent = await db.prepare(`SELECT id FROM header_menu_items WHERE id=? AND parent_id IS NULL LIMIT 1`).bind(parentId).first<{ id: string }>()
        if (!parent) return redirect(request, { error: 'Choose a valid top-level menu item as the parent.' })
      }

      const now = new Date().toISOString()
      const max = await db.prepare(`SELECT COALESCE(MAX(sort_order),-1) AS maxOrder FROM header_menu_items WHERE parent_id IS ?`).bind(parentId).first<{ maxOrder: number }>()
      await db.prepare(`INSERT INTO header_menu_items (id,category_id,parent_id,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?)`)
        .bind(`menu-${crypto.randomUUID()}`, categoryId, parentId, Number(max?.maxOrder || -1) + 1, now, now)
        .run()
      return redirect(request, { success: `${category.name} added to the header menu.` })
    }

    if (intent === 'remove') {
      if (!id) return redirect(request, { error: 'Menu item is required.' })
      const item = await db.prepare(`SELECT id,parent_id AS parentId FROM header_menu_items WHERE id=? LIMIT 1`).bind(id).first<{ id: string; parentId: string | null }>()
      if (!item) return redirect(request, { error: 'That menu item no longer exists.' })
      const childCount = await db.prepare(`SELECT COUNT(*) AS count FROM header_menu_items WHERE parent_id=?`).bind(id).first<{ count: number }>()
      if (Number(childCount?.count || 0) > 0) return redirect(request, { error: 'Remove child items before removing a dropdown parent.' })
      await db.prepare(`DELETE FROM header_menu_items WHERE id=?`).bind(id).run()
      await reorder(item.parentId)
      return redirect(request, { success: 'Menu item removed.' })
    }

    if (intent === 'parent') {
      if (!id) return redirect(request, { error: 'Menu item is required.' })
      const item = await db.prepare(`SELECT id,parent_id AS parentId FROM header_menu_items WHERE id=? LIMIT 1`).bind(id).first<{ id: string; parentId: string | null }>()
      if (!item) return redirect(request, { error: 'That menu item no longer exists.' })
      if (parentId === id) return redirect(request, { error: 'A menu item cannot be its own parent.' })

      if (parentId) {
        const parent = await db.prepare(`SELECT id FROM header_menu_items WHERE id=? AND parent_id IS NULL LIMIT 1`).bind(parentId).first<{ id: string }>()
        if (!parent) return redirect(request, { error: 'Choose a valid top-level menu item as the parent.' })
      }

      const now = new Date().toISOString()
      const max = await db.prepare(`SELECT COALESCE(MAX(sort_order),-1) AS maxOrder FROM header_menu_items WHERE parent_id IS ?`).bind(parentId).first<{ maxOrder: number }>()
      await db.prepare(`UPDATE header_menu_items SET parent_id=?,sort_order=?,updated_at=? WHERE id=?`).bind(parentId, Number(max?.maxOrder || -1) + 1, now, id).run()
      await reorder(item.parentId)
      return redirect(request, { success: 'Menu hierarchy updated.' })
    }

    if (intent === 'move') {
      if (!id) return redirect(request, { error: 'Menu item is required.' })
      const direction = String(form.get('direction') || '')
      if (!['up', 'down'].includes(direction)) return redirect(request, { error: 'Invalid move direction.' })

      const item = await db.prepare(`SELECT id,parent_id AS parentId,sort_order AS sortOrder FROM header_menu_items WHERE id=? LIMIT 1`).bind(id).first<{ id: string; parentId: string | null; sortOrder: number }>()
      if (!item) return redirect(request, { error: 'That menu item no longer exists.' })

      const neighbor = await db.prepare(
        direction === 'up'
          ? `SELECT id,sort_order AS sortOrder FROM header_menu_items WHERE parent_id IS ? AND sort_order < ? ORDER BY sort_order DESC LIMIT 1`
          : `SELECT id,sort_order AS sortOrder FROM header_menu_items WHERE parent_id IS ? AND sort_order > ? ORDER BY sort_order ASC LIMIT 1`,
      ).bind(item.parentId, item.sortOrder).first<{ id: string; sortOrder: number }>()

      if (neighbor) {
        const now = new Date().toISOString()
        await db.batch([
          db.prepare(`UPDATE header_menu_items SET sort_order=?,updated_at=? WHERE id=?`).bind(neighbor.sortOrder, now, item.id),
          db.prepare(`UPDATE header_menu_items SET sort_order=?,updated_at=? WHERE id=?`).bind(item.sortOrder, now, neighbor.id),
        ])
      }
      return redirect(request, { success: 'Menu order updated.' })
    }

    return redirect(request, { error: 'Unknown navigation action.' })
  } catch (error) {
    console.error('navigation mutation failed', error)
    return redirect(request, { error: 'Could not save the header menu. Please try again.' })
  }
}
