import type { Metadata } from 'next'
import { getCategories, getHeaderMenu } from '@/lib/db'
import PublicHeader from '@/app/components/public/PublicHeader'
import PublicFooter from '@/app/components/public/PublicFooter'
import { RevealInit } from '@/app/components/public/enhancers'
import { OG_IMAGE, SITE, SITE_NAME } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `প্রাইভেসি পলিসি — ${SITE_NAME}`,
  description: `${SITE_NAME}-এ মন্তব্য, স্থানীয় স্টোরেজ, ব্যক্তিগত তথ্য এবং গোপনীয়তা ব্যবস্থাপনা সম্পর্কে এই প্রাইভেসি পলিসিতে জানুন।`,
  keywords: ['প্রাইভেসি পলিসি', 'privacy policy', 'সোহানুর রহমান', 'Notes'],
  alternates: { canonical: `${SITE}/privacy/` },
  openGraph: {
    type: 'article',
    url: `${SITE}/privacy/`,
    title: `প্রাইভেসি পলিসি — ${SITE_NAME}`,
    description: `${SITE_NAME}-এ ব্যক্তিগত তথ্য ও গোপনীয়তা ব্যবস্থাপনা সম্পর্কে নীতিমালা।`,
    siteName: SITE_NAME,
    images: [{ url: OG_IMAGE, width: 1672, height: 941, alt: 'সোহানুর রহমান | Notes' }],
  },
}

export default async function PrivacyPage() {
  const [categories, menu] = await Promise.all([getCategories(), getHeaderMenu()])
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'হোম', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'প্রাইভেসি পলিসি', item: `${SITE}/privacy/` },
    ],
  }

  return (
    <div className="site-public">
      <style>{`
        .site-public .privacy-page { padding: 78px 0 110px; }
        .site-public .privacy-wrap { max-width: 860px; margin: 0 auto; }
        .site-public .privacy-kicker { margin-bottom: 10px; font-size: 11px; font-weight: 700; letter-spacing: .12em; color: var(--accent); }
        .site-public .privacy-title { margin: 0 0 14px; font-size: clamp(40px, 6vw, 68px); line-height: 1.04; letter-spacing: -.04em; color: var(--fg); }
        .site-public .privacy-updated { margin: 0 0 42px; color: var(--muted); font-size: 13px; }
        .site-public .privacy-body { color: var(--fg); font-size: 16px; line-height: 1.95; }
        .site-public .privacy-body section { padding: 24px 0; border-top: 1px solid var(--line-2); }
        .site-public .privacy-body section:first-child { border-top: 0; padding-top: 0; }
        .site-public .privacy-body h2 { margin: 0 0 10px; font-size: 21px; line-height: 1.35; }
        .site-public .privacy-body p { margin: 0 0 12px; color: var(--muted); }
        .site-public .privacy-body ul { margin: 0; padding-left: 22px; color: var(--muted); }
        .site-public .privacy-body li { margin: 6px 0; }
        .site-public .privacy-body a { color: var(--accent); }
        @media (max-width: 720px) { .site-public .privacy-page { padding: 52px 0 80px; } }
      `}</style>

      <PublicHeader categories={categories} menu={menu} />
      <main className="mag-main privacy-page">
        <div className="mag-container privacy-wrap">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
          <article className="privacy-body reveal">
            <div className="privacy-kicker">Privacy</div>
            <h1 className="privacy-title">প্রাইভেসি পলিসি</h1>
            <p className="privacy-updated">সর্বশেষ হালনাগাদ: ১৪ সেপ্টেম্বর ২০২৬</p>

            <section>
              <h2>এই নীতিমালা সম্পর্কে</h2>
              <p>{SITE_NAME} একটি ব্যক্তিগত প্রকাশনা প্ল্যাটফর্ম। এখানে আপনার গোপনীয়তা সম্মান করা হয় এবং প্রয়োজনের বাইরে ব্যক্তিগত তথ্য সংগ্রহ বা ব্যবহার না করার চেষ্টা করা হয়।</p>
            </section>

            <section>
              <h2>আমরা কী তথ্য পাই</h2>
              <p>আপনি সাইটে মন্তব্য করলে আপনার দেওয়া নাম, ইমেইল এবং মন্তব্যের তথ্য পাওয়া যেতে পারে। ইমেইলটি প্রকাশ না করেও রাখা হতে পারে এবং মন্তব্য প্রকাশের আগে মডারেশন করা হয়।</p>
              <p>জার্নালের থিম পছন্দ এবং এডিটরের স্থানীয় draft সংরক্ষণের মতো কিছু ফিচার আপনার ব্রাউজারের local storage ব্যবহার করতে পারে। এগুলো আপনার ব্রাউজারেই থাকে।</p>
            </section>

            <section>
              <h2>তথ্য কীভাবে ব্যবহার করা হয়</h2>
              <ul>
                <li>মন্তব্য পর্যালোচনা ও প্রকাশের জন্য</li>
                <li>সাইটের প্রয়োজনীয় ফিচার পরিচালনার জন্য</li>
                <li>সাইটের নিরাপত্তা ও অপব্যবহার প্রতিরোধের জন্য</li>
              </ul>
            </section>

            <section>
              <h2>তথ্য শেয়ার করা</h2>
              <p>আপনার ব্যক্তিগত তথ্য বিক্রি বা বিজ্ঞাপনের উদ্দেশ্যে তৃতীয় পক্ষের কাছে দেওয়ার উদ্দেশ্য এই সাইটের নেই। আইনগত বাধ্যবাধকতা বা নিরাপত্তার প্রয়োজন হলে প্রযোজ্য কর্তৃপক্ষের কাছে তথ্য দিতে হতে পারে।</p>
            </section>

            <section>
              <h2>তৃতীয় পক্ষের লিংক</h2>
              <p>এই জার্নালে Portfolio, সামাজিক যোগাযোগমাধ্যম বা অন্যান্য ওয়েবসাইটের লিংক থাকতে পারে। ওই সাইটগুলোর নিজস্ব প্রাইভেসি পলিসি প্রযোজ্য হবে।</p>
            </section>

            <section>
              <h2>যোগাযোগ</h2>
              <p>প্রাইভেসি বা আপনার তথ্য নিয়ে কোনো প্রশ্ন থাকলে <a href="https://suhanurrahman.com/contact/" target="_blank" rel="noreferrer">যোগাযোগ পেজে</a> লিখতে পারেন।</p>
            </section>
          </article>
        </div>
      </main>
      <PublicFooter categories={categories} />
      <RevealInit />
    </div>
  )
}
