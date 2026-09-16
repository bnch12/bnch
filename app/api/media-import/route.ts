import { env } from 'cloudflare:workers'

export async function PUT(request: Request) {
  const expected = (env as { MEDIA_IMPORT_TOKEN?: string }).MEDIA_IMPORT_TOKEN
  const authorization = request.headers.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''

  if (!expected || token !== expected) return new Response('Unauthorized', { status: 401 })

  const url = new URL(request.url)
  const key = url.searchParams.get('key') || ''
  if (!/^uploads\/[\w\-.~%()@+ ,/]+$/i.test(key) || key.includes('..')) {
    return new Response('Invalid media key', { status: 400 })
  }

  const contentType = request.headers.get('content-type') || 'application/octet-stream'
  await env.BLOG_MEDIA.put(`media/${key}`, request.body, {
    httpMetadata: { contentType },
  })

  return Response.json({ ok: true, key })
}
