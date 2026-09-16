import { env } from 'cloudflare:workers'

const COOKIE = 'sr_blog_admin'
const encoder = new TextEncoder()

type AuthEnv = { ADMIN_PASSWORD?: string; ADMIN_SESSION_SECRET?: string }
const authEnv = env as AuthEnv

function secret() {
  return authEnv.ADMIN_SESSION_SECRET || 'change-this-session-secret'
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export async function createSession() {
  const payload = `${Date.now()}:admin`
  return `${payload}.${await sign(payload)}`
}

export async function isAdmin(request: Request) {
  const cookie = request.headers.get('cookie')?.match(new RegExp(`${COOKIE}=([^;]+)`))?.[1]
  if (!cookie) return false
  const [payload, signature] = cookie.split('.')
  if (!payload || !signature) return false
  const expected = await sign(payload)
  return signature === expected && payload.endsWith(':admin')
}

export function adminCookie(value: string) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
}

export function clearAdminCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export function passwordMatches(password: string) {
  return Boolean(authEnv.ADMIN_PASSWORD) && password === authEnv.ADMIN_PASSWORD
}
