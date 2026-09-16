import { listPublishedPosts } from '@/lib/db'

function card(p: any) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    categoryName: p.categoryName,
    categorySlug: p.categorySlug,
    publishedAt: p.publishedAt,
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 9, 1), 24)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const posts = await listPublishedPosts(limit + 1, offset)
  const hasMore = posts.length > limit
  return Response.json({ posts: posts.slice(0, limit).map(card), hasMore })
}
