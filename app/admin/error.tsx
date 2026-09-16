'use client'

import { useEffect } from 'react'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Admin page failed to render', error)
  }, [error])

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">CMS</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">পেজটি লোড করা যায়নি</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">সাময়িকভাবে একটি সমস্যা হয়েছে। আবার চেষ্টা করলে সাধারণত পেজটি ঠিকভাবে লোড হবে।</p>
        <button type="button" onClick={() => reset()} className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">আবার চেষ্টা করুন</button>
      </div>
    </main>
  )
}
