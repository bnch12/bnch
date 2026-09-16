import { adminCookie, createSession, passwordMatches } from '@/lib/auth'

export async function POST(request: Request) {
  const form = await request.formData()
  const password = String(form.get('password') || '')
  if (!passwordMatches(password)) return Response.redirect(new URL('/admin/login?error=1', request.url), 303)
  const session = await createSession()
  return new Response(null, { status: 303, headers: { Location: '/admin/', 'Set-Cookie': adminCookie(session) } })
}
