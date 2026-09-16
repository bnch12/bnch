import fs from 'node:fs/promises'

const input = JSON.parse(await fs.readFile('migration-data/wordpress.json', 'utf8'))
const mediaManifest = JSON.parse(await fs.readFile('migration-data/media-manifest.json', 'utf8')).uploaded || []
const uploadedSources = new Set(mediaManifest.map((item) => item.source))

const esc = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`
const slug = (value) => String(value || '').toLowerCase().trim().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-+|-+$/g, '')

function mediaUrl(value) {
  const source = String(value || '')
  if (!source) return null
  const local = source
    .replace(/^https:\/\/blog\.suhanurrahman\.com\/wp-content\/uploads\//, '')
    .replace(/^http:\/\/blog\.suhanurrahman\.com\/wp-content\/uploads\//, '')
  if (local !== source && uploadedSources.has(source)) return `https://blog.suhanurrahman.com/media/uploads/${local}`
  return source
}

const lines = []

for (const category of input.categories || []) {
  lines.push(`INSERT OR IGNORE INTO categories (id,name,slug) VALUES (${esc(`wp-cat-${category.id}`)},${esc(category.name)},${esc(category.slug || slug(category.name))});`)
}
for (const tag of input.tags || []) {
  lines.push(`INSERT OR IGNORE INTO tags (id,name,slug) VALUES (${esc(`wp-tag-${tag.id}`)},${esc(tag.name)},${esc(tag.slug || slug(tag.name))});`)
}

for (const post of input.posts || []) {
  const categories = post.categoryIds || []
  const categoryId = categories[0] ? `wp-cat-${categories[0]}` : null
  const status = post.status === 'publish' ? 'PUBLISHED' : post.status === 'private' ? 'DRAFT' : 'DRAFT'
  const publishedAt = status === 'PUBLISHED' ? post.date : null
  const createdAt = post.date && !String(post.date).startsWith('0000-00-00') ? post.date : (post.modified || new Date(0).toISOString())
  const updatedAt = post.modified && !String(post.modified).startsWith('0000-00-00') ? post.modified : createdAt
  const safeSlug = post.slug || `wp-${post.wpId}`

  lines.push(`INSERT OR REPLACE INTO posts (id,title,slug,excerpt,content,cover_image,status,published_at,created_at,updated_at,category_id) VALUES (${esc(post.id)},${esc(post.title)},${esc(safeSlug)},${esc(post.excerpt)},${esc(post.contentHtml)},${esc(mediaUrl(post.featuredImage))},${esc(status)},${esc(publishedAt)},${esc(createdAt)},${esc(updatedAt)},${esc(categoryId)});`)

  for (const category of categories) {
    lines.push(`INSERT OR IGNORE INTO post_categories (post_id,category_id) VALUES (${esc(post.id)},${esc(`wp-cat-${category}`)});`)
  }
  for (const tagId of post.tagIds || []) {
    lines.push(`INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (${esc(post.id)},${esc(`wp-tag-${tagId}`)});`)
  }
}

for (const comment of input.comments || []) {
  const postExists = (input.posts || []).some((post) => post.id === comment.postId)
  if (!postExists) continue
  lines.push(`INSERT OR REPLACE INTO comments (id,post_id,name,email,body,status,created_at,comment_type,parent_comment_id) VALUES (${esc(comment.id)},${esc(comment.postId)},${esc(comment.name)},${esc(comment.email)},${esc(comment.body)},${esc(comment.status || 'PENDING')},${esc(comment.createdAt)},${esc(comment.type || 'comment')},NULL);`)
}
for (const comment of input.comments || []) {
  if (comment.parentId) {
    lines.push(`UPDATE comments SET parent_comment_id=${esc(comment.parentId)} WHERE id=${esc(comment.id)};`)
  }
}

await fs.mkdir('migration-data', { recursive: true })
await fs.writeFile('migration-data/import.sql', lines.join('\n') + '\n')
console.log(`Generated ${lines.length} SQL statements for ${input.posts?.length || 0} posts and ${input.comments?.length || 0} comments.`)
