import Link from 'next/link'

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  return (
    <main className="admin-login flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm">SR</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Suhanur Rahman / CMS</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Admin login</h1>
          </div>
        </div>

        <form action="/api/admin/login" method="post" className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-lg">
          <p className="text-center text-sm text-muted-foreground">Use the private admin password configured in Cloudflare.</p>
          {params.error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-[13px] text-rose-700">Invalid password. Please try again.</p>
          ) : null}
          <input
            type="password"
            name="password"
            placeholder="Admin password"
            required
            autoFocus
            className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm shadow-xs placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center">
          <Link href="/" className="text-[13px] text-muted-foreground transition-colors hover:text-primary">
            ← Back to journal
          </Link>
        </p>
      </div>
    </main>
  )
}
