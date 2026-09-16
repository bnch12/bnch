import { env } from 'cloudflare:workers'
import { isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const TRASH_TYPES = ['post', 'comment', 'category', 'tag', 'media'] as const

type TrashType = typeof TRASH_TYPES[number]

function isTrashType(value: string): value is TrashType {
  return TRASH_TYPES.includes(value as TrashType)
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) return new Response('Unauthorized', { status: 401 })
  const f = await request.formData()
  const type = String(f.get('type') || '')
  const id = String(f.get('id') || '')
  const action = String(f.get('action') || 'restore')

  if (action === 'delete-all') {
    const posts = await db.prepare(`SELECT id FROM posts WHERE deleted_at IS NOT NULL`).all<{ id: string }>()
    const comments = await db.prepare(`SELECT id FROM comments WHERE deleted_at IS NOT NULL`).all<{ id: string }>()
    const categories = await db.prepare(`SELECT id FROM categories WHERE deleted_at IS NOT NULL`).all<{ id: string }>()
    const tags = await db.prepare(`SELECT id FROM tags WHERE deleted_at IS NOT NULL`).all<{ id: string }>()
    const media = await db.prepare(`SELECT id,key FROM media_assets WHERE deleted_at IS NOT NULL`).all<{ id: string; key: string }>()

    for (const post of posts.results) {
      await db.prepare(`DELETE FROM post_categories WHERE post_id=?`).bind(post.id).run()
      await db.prepare(`DELETE FROM post_tags WHERE post_id=?`).bind(post.id).run()
      await db.prepare(`DELETE FROM comments WHERE post_id=?`).bind(post.id).run()
      await db.prepare(`DELETE FROM posts WHERE id=? AND deleted_at IS NOT NULL`).bind(post.id).run()
    }

    for (const comment of comments.results) {
      await db.prepare(`DELETE FROM comments WHERE id=? AND deleted_at IS NOT NULL`).bind(comment.id).run()
    }

    for (const category of categories.results) {
      await db.prepare(`DELETE FROM post_categories WHERE category_id=?`).bind(category.id).run()
      await db.prepare(`DELETE FROM categories WHERE id=? AND deleted_at IS NOT NULL`).bind(category.id).run()
    }

    for (const tag of tags.results) {
      await db.prepare(`DELETE FROM post_tags WHERE tag_id=?`).bind(tag.id).run()
      await db.prepare(`DELETE FROM tags WHERE id=? AND deleted_at IS NOT NULL`).bind(tag.id).run()
    }

    for (const asset of media.results) {
      try {
        if (asset.key) await env.BLOG_MEDIA.delete(asset.key)
      } catch (error) {
        console.error('R2 delete failed', error)
      }
      await db.prepare(`DELETE FROM media_assets WHERE id=? AND deleted_at IS NOT NULL`).bind(asset.id).run()
    }

    return Response.redirect(new URL('/admin/trash/', request.url), 303)
  }

  if (!id || !isTrashType(type) || !['restore', 'delete'].includes(action)) {
    return new Response('Invalid request', { status: 400 })
  }
  const now = new Date().toISOString()

  if (action === 'restore') {
    if (type === 'post') await db.prepare(`UPDATE posts SET deleted_at=NULL,status='DRAFT',updated_at=? WHERE id=?`).bind(now, id).run()
    if (type === 'comment') await db.prepare(`UPDATE comments SET deleted_at=NULL,status='PENDING' WHERE id=?`).bind(id).run()
    if (type === 'category') await db.prepare(`UPDATE categories SET deleted_at=NULL WHERE id=?`).bind(id).run()
    if (type === 'tag') await db.prepare(`UPDATE tags SET deleted_at=NULL WHERE id=?`).bind(id).run()
    if (type === 'media') await db.prepare(`UPDATE media_assets SET deleted_at=NULL WHERE id=?`).bind(id).run()
    return Response.redirect(new URL('/admin/trash/', request.url), 303)
  }

  // action === 'delete' — permanent, only allowed for already-trashed items
  if (type === 'post') {
    const existing = await db.prepare(`SELECT id FROM posts WHERE id=? AND deleted_at IS NOT NULL`).bind(id).first<{ id: string }>()
    if (existing) {
      await db.prepare(`DELETE FROM post_categories WHERE post_id=?`).bind(id).run()
      await db.prepare(`DELETE FROM post_tags WHERE post_id=?`).bind(id).run()
      await db.prepare(`DELETE FROM comments WHERE post_id=?`).bind(id).run()
      await db.prepare(`DELETE FROM posts WHERE id=?`).bind(id).run()
    }
  }
  if (type === 'comment') {
    await db.prepare(`DELETE FROM comments WHERE id=? AND deleted_at IS NOT NULL`).bind(id).run()
  }
  if (type === 'category') {
    const existing = await db.prepare(`SELECT id FROM categories WHERE id=? AND deleted_at IS NOT NULL`).bind(id).first<{ id: string }>()
    if (existing) {
      await db.prepare(`DELETE FROM post_categories WHERE category_id=?`).bind(id).run()
      await db.prepare(`DELETE FROM categories WHERE id=?`).bind(id).run()
    }
  }
  if (type === 'tag') {
    const existing = await db.prepare(`SELECT id FROM tags WHERE id=? AND deleted_at IS NOT NULL`).bind(id).first<{ id: string }>()
    if (existing) {
      await db.prepare(`DELETE FROM post_tags WHERE tag_id=?`).bind(id).run()
      await db.prepare(`DELETE FROM tags WHERE id=?`).bind(id).run()
    }
  }
  if (type === 'media') {
    const asset = await db.prepare(`SELECT key FROM media_assets WHERE id=? AND deleted_at IS NOT NULL`).bind(id).first<{ key: string }>()
    if (asset) {
      try {
        if (asset.key) await env.BLOG_MEDIA.delete(asset.key)
      } catch (error) {
        console.error('R2 delete failed', error)
      }
      await db.prepare(`DELETE FROM media_assets WHERE id=?`).bind(id).run()
    }
  }
  return Response.redirect(new URL('/admin/trash/', request.url), 303)
}
