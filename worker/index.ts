import handler from 'vinext/server/fetch-handler'

const PUBLIC_HTML_TTL = 'public, max-age=300, stale-while-revalidate=60'
const SEARCH_TTL = 'public, max-age=60, stale-while-revalidate=30'
const BLOG_CACHE_TAG = 'blog-public'
const SEARCH_CACHE_TAG = 'blog-search'

function isAdminOrApiPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/api' || pathname.startsWith('/api/')
}

function isRscRequest(request: Request) {
  return Boolean(
    request.headers.get('RSC') ||
    request.headers.get('Next-Router-Prefetch') ||
    request.headers.get('Next-Router-State-Tree') ||
    request.headers.get('Next-Url'),
  )
}

function withHeaders(response: Response, headers: Record<string, string>) {
  const nextHeaders = new Headers(response.headers)
  for (const [name, value] of Object.entries(headers)) nextHeaders.set(name, value)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: nextHeaders,
  })
}

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const isWrite = request.method !== 'GET' && request.method !== 'HEAD'
    const shouldPurge = isWrite && (
      url.pathname.startsWith('/api/admin/') ||
      url.pathname === '/api/comments'
    )

    const response = await handler.fetch(request, env, ctx)

    if (shouldPurge && response.status < 400) {
      ctx.waitUntil(
        ctx.cache.purge({ tags: [BLOG_CACHE_TAG, SEARCH_CACHE_TAG] }).catch((error) => {
          console.error('public cache purge failed', error)
        }),
      )
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') return response
    if (response.headers.has('Set-Cookie')) return response

    if (url.pathname === '/api/search' && response.status === 200) {
      return withHeaders(response, {
        'Cloudflare-CDN-Cache-Control': SEARCH_TTL,
        'Cache-Tag': SEARCH_CACHE_TAG,
      })
    }

    if (isAdminOrApiPath(url.pathname) || isRscRequest(request)) {
      return withHeaders(response, {
        'Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store',
      })
    }

    if (response.status !== 200) return response

    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.toLowerCase().startsWith('text/html')) return response

    return withHeaders(response, {
      'Cloudflare-CDN-Cache-Control': PUBLIC_HTML_TTL,
      'Cache-Tag': BLOG_CACHE_TAG,
    })
  },
}
