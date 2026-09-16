import { clearAdminCookie } from '@/lib/auth'

export async function POST(request: Request) {
  return new Response(null, { status: 303, headers: { Location: '/admin/login', 'Set-Cookie': clearAdminCookie() } })
}
