import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/app/components/public/PublicHeader'
import PublicFooter from '@/app/components/public/PublicFooter'
import { getCategories, getHeaderMenu } from '@/lib/db'
import { SITE, SITE_NAME } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `পেজ পাওয়া যায়নি | ${SITE_NAME}`,
  description: 'আপনি যে পাতাটি খুঁজছেন সেটি পাওয়া যায়নি।',
  alternates: { canonical: `${SITE}/404/` },
  robots: { index: false, follow: true },
}

export default async function NotFound() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let menu: Awaited<ReturnType<typeof getHeaderMenu>> = []

  try {
    ;[categories, menu] = await Promise.all([getCategories(), getHeaderMenu()])
  } catch {
    // Keep the 404 page usable even if navigation data is temporarily unavailable.
  }

  return (
    <div className="site-public not-found-page">
      <style dangerouslySetInnerHTML={{ __html: `
        .not-found-page,
        .not-found-page * {
          font-family: 'Noto Serif Bengali', serif !important;
        }
        .not-found-page {
          min-height: 100vh;
          color: var(--fg);
          background: var(--bg);
          overflow: hidden;
        }
        .not-found-stage {
          width: min(1320px, calc(100% - 48px));
          min-height: calc(100vh - 150px);
          margin: 0 auto;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          border-top: 1px solid var(--line-2);
          border-bottom: 1px solid var(--line-2);
          padding: clamp(58px, 7vw, 92px) 0 clamp(80px, 10vw, 130px);
          text-align: center;
        }
        .not-found-content {
          width: min(900px, 100%);
          margin: 0 auto;
        }
        .not-found-kicker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 18px;
          color: var(--accent);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
        }
        .not-found-kicker::before,
        .not-found-kicker::after {
          content: '';
          width: 30px;
          height: 1px;
          background: currentColor;
        }
        .not-found-number {
          margin: 0;
          color: var(--fg);
          font-size: clamp(120px, 18vw, 250px);
          line-height: .72;
          letter-spacing: -.09em;
          font-weight: 500;
        }
        .not-found-number span {
          color: var(--accent);
        }
        .not-found-heading {
          max-width: 780px;
          margin: 34px auto 16px;
          font-size: clamp(34px, 4.5vw, 64px);
          line-height: 1.05;
          letter-spacing: -.045em;
          font-weight: 700;
        }
        .not-found-copy {
          max-width: 700px;
          margin: 0 auto;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.95;
        }
        .not-found-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 28px;
        }
        .not-found-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 20px;
          border: 1px solid var(--fg);
          border-radius: 999px;
          color: var(--fg);
          background: transparent;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: background .18s ease, color .18s ease, transform .18s ease;
        }
        .not-found-action:hover {
          transform: translateY(-2px);
          background: var(--fg);
          color: var(--bg);
        }
        .not-found-action.primary {
          border-color: var(--accent);
          background: var(--accent);
          color: #fff;
        }
        .not-found-action.primary:hover {
          background: transparent;
          color: var(--accent);
        }
        @media (max-width: 560px) {
          .not-found-stage {
            width: min(100% - 32px, 1320px);
            min-height: calc(100vh - 120px);
            padding: 44px 0 76px;
          }
          .not-found-heading {
            margin-top: 26px;
            font-size: 32px;
          }
          .not-found-copy {
            font-size: 15px;
          }
        }
      ` }} />

      <PublicHeader categories={categories} menu={menu} />

      <main className="not-found-stage" aria-labelledby="not-found-title">
        <section className="not-found-content">
          <div className="not-found-kicker">Page not found</div>
          <div className="not-found-number" aria-hidden="true">4<span>0</span>4</div>
          <h1 id="not-found-title" className="not-found-heading">এই পাতাটি আর এখানে নেই।</h1>
          <p className="not-found-copy">
            হয়তো পাতাটি সরিয়ে ফেলা হয়েছে, ঠিকানা বদলেছে, অথবা আপনি এমন একটি লিংকে এসেছেন যা আর সক্রিয় নেই। মূল পাতায় ফিরে গিয়ে নতুন করে খুঁজে দেখতে পারেন।
          </p>
          <div className="not-found-actions">
            <Link href="/" className="not-found-action primary">হোমে ফিরে যান ↗</Link>
            <Link href="/search/" className="not-found-action">সার্চ করুন</Link>
          </div>
        </section>
      </main>

      <PublicFooter categories={categories} />
    </div>
  )
}
