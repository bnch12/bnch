import { isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify } from '@/lib/slug'

function values(form: FormData, name: string) {
  return form.getAll(name).map(v => String(v).trim()).filter(Boolean)
}

function wantsJson(request: Request) {
  return request.headers.get('accept')?.includes('application/json')
}

function json(data: Record<string, unknown>, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) return wantsJson(request) ? json({ ok: false, error: 'Unauthorized' }, 401) : new Response('Unauthorized', { status: 401 })

  try {
    const form = await request.formData()
    const intent = String(form.get('intent') || 'create')
    const action = String(form.get('action') || '')
    const id = String(form.get('id') || crypto.randomUUID())

    if (action === 'trash' || intent === 'trash' || intent === 'delete') {
      if (!String(form.get('id') || '').trim()) return wantsJson(request) ? json({ ok: false, error: 'Post ID is required' }, 400) : new Response('Post ID is required', { status: 400 })
      const existing = await db.prepare(`SELECT id FROM posts WHERE id=? LIMIT 1`).bind(id).first<{ id: string }>()
      if (!existing) return wantsJson(request) ? json({ ok: true, redirectTo: '/admin/' }) : Response.redirect(new URL('/admin/', request.url), 303)
      await db.prepare(`UPDATE posts SET deleted_at=?, updated_at=? WHERE id=?`).bind(new Date().toISOString(), new Date().toISOString(), id).run()
      return wantsJson(request) ? json({ ok: true, redirectTo: '/admin/' }) : Response.redirect(new URL('/admin/', request.url), 303)
    }

    const title = String(form.get('title') || '').trim().slice(0, 240)
    const slug = slugify(String(form.get('slug') || title))
    const excerpt = String(form.get('excerpt') || '').trim().slice(0, 500)
    const content = String(form.get('content') || '')
    const contentFormat = String(form.get('contentFormat') || 'MARKDOWN') === 'HTML' ? 'HTML' : 'MARKDOWN'
    const coverImage = String(form.get('coverImage') || '').trim().slice(0, 500)
    const categoryIds = values(form, 'categoryIds').slice(0, 20)
    const categoryId = categoryIds[0] || null
    const status = String(form.get('status') || 'DRAFT') === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
    const seoTitle = String(form.get('seoTitle') || '').trim().slice(0, 70)
    const seoDescription = String(form.get('seoDescription') || '').trim().slice(0, 170)
    const seoKeywords = String(form.get('seoKeywords') || '').trim().slice(0, 500)
    const ogImage = String(form.get('ogImage') || '').trim().slice(0, 500)
    const canonicalUrl = String(form.get('canonicalUrl') || '').trim().slice(0, 500)
    const noindex = form.get('noindex') ? 1 : 0
    const now = new Date().toISOString()

    if (!title || !content) return wantsJson(request) ? json({ ok: false, error: 'Title and content are required' }, 400) : new Response('Title and content are required', { status: 400 })

    if (intent === 'update') {
      await db.prepare(`UPDATE posts SET title=?,slug=?,excerpt=?,content=?,content_format=?,cover_image=?,status=?,published_at=CASE WHEN ?='PUBLISHED' THEN COALESCE(published_at,?) ELSE NULL END,updated_at=?,category_id=?,seo_title=?,seo_description=?,seo_keywords=?,og_image=?,canonical_url=?,noindex=?,deleted_at=NULL WHERE id=?`)
        .bind(title, slug, excerpt || null, content, contentFormat, coverImage || null, status, status, now, now, categoryId, seoTitle || null, seoDescription || null, seoKeywords || null, ogImage || null, canonicalUrl || null, noindex, id).run()
    } else {
      await db.prepare(`INSERT INTO posts (id,title,slug,excerpt,content,content_format,cover_image,status,published_at,created_at,updated_at,category_id,seo_title,seo_description,seo_keywords,og_image,canonical_url,noindex) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id, title, slug, excerpt || null, content, contentFormat, coverImage || null, status, status === 'PUBLISHED' ? now : null, now, now, categoryId, seoTitle || null, seoDescription || null, seoKeywords || null, ogImage || null, canonicalUrl || null, noindex).run()
    }

    await db.prepare(`DELETE FROM post_categories WHERE post_id=?`).bind(id).run()
    for (const category of categoryIds) await db.prepare(`INSERT OR IGNORE INTO post_categories (post_id,category_id) VALUES (?,?)`).bind(id, category).run()

    const tags = String(form.get('tags') || '').split(',').map(v => v.trim()).filter(Boolean).slice(0, 20)
    await db.prepare(`DELETE FROM post_tags WHERE post_id=?`).bind(id).run()
    for (const tagName of tags) {
      const tagSlug = slugify(tagName)
      const tagId = `tag-${tagSlug}`
      await db.prepare(`INSERT OR IGNORE INTO tags (id,name,slug,deleted_at) VALUES (?,?,?,NULL)`).bind(tagId, tagName, tagSlug).run()
      await db.prepare(`UPDATE tags SET deleted_at=NULL WHERE id=?`).bind(tagId).run()
      await db.prepare(`INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (?,?)`).bind(id, tagId).run()
    }

    const redirectTo = `/admin/posts/${id}/edit/`
    return wantsJson(request) ? json({ ok: true, id, redirectTo, status }) : Response.redirect(new URL(redirectTo, request.url), 303)
  } catch (error) {
    console.error('post mutation failed', error)
    return wantsJson(request) ? json({ ok: false, error: 'Could not save the post.' }, 500) : new Response('Could not save the post.', { status: 500 })
  }
}
