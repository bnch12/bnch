import { getHeaderMenu } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({ menu: await getHeaderMenu() }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
