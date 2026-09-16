import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAdmin } from './auth'

export async function requireAdmin() {
  const h = await headers()
  const request = new Request('https://blog.suhanurrahman.com/admin', { headers: h })
  if (!(await isAdmin(request))) redirect('/admin/login')
}
