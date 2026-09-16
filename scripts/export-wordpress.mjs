import fs from 'node:fs/promises'
import https from 'node:https'
import { URL } from 'node:url'

const base = (process.env.WP_URL || 'https://blog.suhanurrahman.com').replace(/\/$/, '')
const host = new URL(base).hostname
const legacyIp = process.env.LEGACY_WP_IP
const legacyServerName = process.env.LEGACY_SERVER_NAME || 'premium120.web-hosting.com'
const perPage = 100

const SOURCE_POST_IDS = new Set([15,3264,3297,3307,3334,3339,3342,3345,3348,3351,3354,3423,3669,3690,3695,3741,3753,3841,3866,3893,3948,3959,3962,3969,4010,4163,4167,4198,4287,4345,4349,4377,4402,4639,4672,4715,4754,4759,4770,4811,4873,4885,4887,4896,4934,4937,4965,5012,5044,5051,5069,5074,5116,5123,5126,5130,5134,5147,5154,5163,5177,5183,5279,4990,5244])
const SOURCE_CATEGORY_IDS = new Set([1,2,3,4,5,6,16,17,18,19,20,21,22,26,27,40,41])
const SOURCE_COMMENT_IDS = [264,277,278,291,292,293,294,628,662,663,685,686,687,688,689,690,693,694,695]

function lookupLegacy(_hostname, options, callback) {
  if (!legacyIp) return callback(null, undefined, 4)
  if (options?.all) return callback(null, [{ address: legacyIp, family: 4 }])
  return callback(null, legacyIp, 4)
}

function legacyGet(pathname) {
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: legacyServerName,
      port: 443,
      path: pathname,
      method: 'GET',
      servername: legacyServerName,
      headers: { Host: host, Accept: 'application/json' },
      ...(legacyIp ? { lookup: lookupLegacy } : {}),
    }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => resolve({ status: response.statusCode || 0, headers: response.headers, body: Buffer.concat(chunks) }))
    })
    request.on('error', reject)
    request.end()
  })
}

async function fetchJson(pathname) {
  const response = await legacyGet(pathname)
  if (response.status >= 300 && response.status < 400 && response.headers.location) {
    const location = new URL(response.headers.location, base)
    return fetchJson(`${location.pathname}${location.search}`)
  }
  if (response.status !== 200) throw new Error(`WordPress API ${response.status}: ${pathname}`)
  return { data: JSON.parse(response.body.toString('utf8')), headers: response.headers }
}

async function fetchAll(resource, query = '') {
  const rows = []
  let page = 1
  while (true) {
    const params = new URLSearchParams({ per_page: String(perPage), page: String(page) })
    if (query) for (const [key, value] of new URLSearchParams(query)) params.set(key, value)
    const result = await fetchJson(`/wp-json/wp/v2/${resource}?${params.toString()}`)
    if (!Array.isArray(result.data)) throw new Error(`Unexpected WordPress response for ${resource}`)
    rows.push(...result.data)
    const totalPages = Number(result.headers['x-wp-totalpages'] || 1)
    if (page >= totalPages) break
    page += 1
  }
  return rows
}

async function fetchCommentById(id) {
  try {
    const result = await fetchJson(`/wp-json/wp/v2/comments/${id}`)
    return result.data
  } catch (error) {
    console.warn(`Could not fetch historical comment ${id}: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

let posts
try {
  posts = await fetchAll('posts', 'status=any&context=view&_embed=1')
} catch (error) {
  console.warn(`status=any export was not permitted; falling back to published posts: ${error instanceof Error ? error.message : error}`)
  posts = await fetchAll('posts', 'status=publish&context=view&_embed=1')
}

const categories = await fetchAll('categories')
const tags = await fetchAll('tags')
const historicalComments = (await Promise.all(SOURCE_COMMENT_IDS.map(fetchCommentById))).filter(Boolean)
const collectionComments = await fetchAll('comments', 'context=embed&orderby=date&order=asc&per_page=100')
const commentsById = new Map()
for (const comment of [...collectionComments, ...historicalComments]) commentsById.set(Number(comment.id), comment)
const comments = [...commentsById.values()]

const normalized = posts
  .filter((post) => SOURCE_POST_IDS.has(Number(post.id)))
  .map((post) => ({
    id: `wp-${post.id}`,
    wpId: post.id,
    title: post.title?.rendered || '',
    slug: post.slug,
    excerpt: (post.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim(),
    contentHtml: post.content?.rendered || '',
    date: post.date_gmt || post.date,
    modified: post.modified_gmt || post.modified,
    status: post.status,
    featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
    categoryIds: (post.categories || []).filter((id) => SOURCE_CATEGORY_IDS.has(Number(id))),
    tagIds: post.tags || [],
  }))

const normalizedComments = comments
  .filter((comment) => !comment.type || comment.type === 'comment')
  .map((comment) => ({
    id: `wp-comment-${comment.id}`,
    postId: `wp-${comment.post}`,
    name: comment.author_name || 'Anonymous',
    email: null,
    body: (comment.content?.rendered || '').replace(/<[^>]+>/g, '').trim(),
    status: comment.status === 'approved' ? 'APPROVED' : comment.status === 'spam' ? 'SPAM' : comment.status === 'trash' ? 'TRASH' : 'PENDING',
    createdAt: comment.date_gmt || comment.date,
    type: 'comment',
    parentId: comment.parent ? `wp-comment-${comment.parent}` : null,
  }))
  .filter((comment) => SOURCE_POST_IDS.has(Number(comment.postId.replace('wp-', ''))))

const normalizedCategories = categories.filter((category) => SOURCE_CATEGORY_IDS.has(Number(category.id)))

await fs.mkdir('migration-data', { recursive: true })
await fs.writeFile('migration-data/wordpress.json', JSON.stringify({ source: base, exportedAt: new Date().toISOString(), posts: normalized, categories: normalizedCategories, tags, comments: normalizedComments }, null, 2))
console.log(`Exported source snapshot: ${normalized.length} posts, ${normalizedCategories.length} categories, ${tags.length} tags and ${normalizedComments.length} comments.`)
