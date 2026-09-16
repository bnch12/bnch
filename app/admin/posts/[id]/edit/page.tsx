import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { marked } from 'marked'
import { requireAdmin } from '@/lib/admin'
import { db, getCategories } from '@/lib/db'
import ProPostEditor from '@/app/admin/components/ProPostEditor'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const post = await db.prepare(`SELECT id,title,slug,excerpt,content,content_format AS contentFormat,cover_image AS coverImage,status,seo_title AS seoTitle,seo_description AS seoDescription,seo_keywords AS seoKeywords,og_image AS ogImage,canonical_url AS canonicalUrl,noindex FROM posts WHERE id=? LIMIT 1`).bind(id).first<any>()
  if (!post) return <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-input bg-muted/30 py-16 text-center"><p className="text-sm font-semibold">Post not found</p><p className="text-sm text-muted-foreground">This post may have been deleted.</p></div>
  const categories = await getCategories()
  const selected = await db.prepare(`SELECT category_id AS id FROM post_categories WHERE post_id=?`).bind(id).all<{ id: string }>()
  const tags = await db.prepare(`SELECT t.id,t.name FROM tags t JOIN post_tags pt ON pt.tag_id=t.id WHERE pt.post_id=? AND t.deleted_at IS NULL ORDER BY t.name`).bind(id).all<{ id: string; name: string }>()
  const allTags = await db.prepare(`SELECT id,name FROM tags WHERE deleted_at IS NULL ORDER BY name`).all<{ id: string; name: string }>()
  const editorPost = post.contentFormat === 'MARKDOWN' ? { ...post, content: marked.parse(post.content || '', { async: false }) as string, contentFormat: 'HTML' } : post
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Publishing</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">Edit post</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update the content, taxonomy and SEO for this article.</p>
        </div>
        <Link className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href={`/${post.slug}/`} target="_blank" rel="noreferrer">
          View article <ExternalLink className="size-4" strokeWidth={1.75} />
        </Link>
      </div>
      <ProPostEditor categories={categories} tags={allTags.results} initial={{ ...editorPost, categoryIds: selected.results.map(x => x.id), tags: tags.results.map(x => x.name) }} />
    </>
  )
}
