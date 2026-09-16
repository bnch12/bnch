import Link from 'next/link'
import { getHeaderMenu } from '@/lib/db'
import FooterDepartmentNav from '@/app/components/public/FooterDepartmentNav'

type MenuItem = {
  id: string
  categoryId: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  children: MenuItem[]
}

export default async function PublicFooter({ categories, menu: menuProp }: { categories: { id: string; name: string; slug: string }[]; menu?: MenuItem[] }) {
  // The navigation menu is already fetched by the page for the header; reuse it
  // when passed to avoid a second identical header_menu_items query per request.
  const menu: MenuItem[] = menuProp ?? (await getHeaderMenu())
  const footerMenu = menu.length
    ? menu
    : categories.slice(0, 6).map((c, index) => ({
        id: `fallback-${c.id}`,
        categoryId: c.id,
        name: c.name,
        slug: c.slug,
        parentId: null,
        sortOrder: index,
        children: [],
      }))

  return (
    <footer className="mag-footer">
      <style>{`
        .site-public .mag-footer-brand {
          font-size: 26px !important;
          font-weight: 800;
          line-height: 1.2;
          display: inline-flex;
          align-items: baseline;
          white-space: nowrap;
          color: var(--muted) !important;
        }
        .site-public .mag-footer-brand b {
          color: var(--accent) !important;
        }
        .site-public .mag-footer-brand span {
          color: var(--accent) !important;
        }
        .site-public .mag-footer-dept-nav {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0;
        }
        .site-public .mag-footer-dept-group {
          border-bottom: 1px solid var(--line-2);
        }
        .site-public .mag-footer-dept-group:last-child {
          border-bottom: 0;
        }
        .site-public .mag-footer-dept-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .site-public .mag-footer-dept-parent {
          flex: 1;
          min-width: 0;
          padding: 6px 0;
          border-bottom: 0 !important;
          color: var(--muted);
          font-size: 15px;
          font-weight: 600;
          line-height: 1.35;
          transition: color 0.18s ease;
        }
        .site-public .mag-footer-dept-parent:hover {
          color: var(--accent);
        }
        .site-public .mag-footer-dept-toggle {
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          display: inline-grid;
          place-items: center;
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.18s ease, color 0.18s ease;
        }
        .site-public .mag-footer-dept-toggle:hover {
          background: var(--bg-2);
          color: var(--fg);
        }
        .site-public .mag-footer-dept-toggle svg {
          transition: transform 0.18s ease;
        }
        .site-public .mag-footer-dept-group.is-expanded .mag-footer-dept-toggle svg {
          transform: rotate(180deg);
        }
        .site-public .mag-footer-dept-children {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.2s ease;
        }
        .site-public .mag-footer-dept-group.is-expanded .mag-footer-dept-children {
          grid-template-rows: 1fr;
        }
        .site-public .mag-footer-dept-children-inner {
          min-height: 0;
          overflow: hidden;
          padding-left: 12px;
        }
        .site-public .mag-footer-dept-children-inner a {
          display: block;
          padding: 4px 0 4px 14px;
          border-bottom: 0;
          color: var(--muted);
          font-size: 15px;
          font-weight: 600;
          line-height: 1.35;
          transition: color 0.18s ease;
        }
        .site-public .mag-footer-dept-children-inner a:hover {
          color: var(--accent);
        }
        @media (max-width: 720px) {
          .site-public .mag-footer-dept-parent,
          .site-public .mag-footer-dept-children-inner a {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="mag-container mag-footer-grid">
        <div>
          <Link href="/" className="mag-footer-brand">
            সোহানুর{'\u00a0'}<b>রহমান</b><span style={{ fontSize: '0.5em', color: 'var(--accent)', marginLeft: 6, fontWeight: 600 }}>জার্নাল</span>
          </Link>
          <p>প্রযুক্তি, গবেষণা, অনুসন্ধান, ডিজিটাল সংস্কৃতি ও ভাবনা নিয়ে একটি স্বাধীন জার্নাল।</p>
        </div>

        <div>
          <h4>বিভাগ</h4>
          <FooterDepartmentNav items={footerMenu} />
        </div>

        <div>
          <h4>লিংকস</h4>
          <Link href="/about/">আমার সম্পর্কে ↗</Link>
          <Link href="/privacy/">প্রাইভেসি পলিসি ↗</Link>
          <a href="https://suhanurrahman.com/" target="_blank" rel="noreferrer">পোর্টফলিও ↗</a>
          <Link href="/admin/">সিএমএস ↗</Link>
        </div>

        <div>
          <h4>যোগাযোগ</h4>
          <a href="mailto:suhanurrahman.r@gmail.com">Email ↗</a>
          <a href="https://suhanurrahman.com/" target="_blank" rel="noreferrer">Website ↗</a>
          <a href="https://suhanurrahman.com/contact/" target="_blank" rel="noreferrer">Contact ↗</a>
        </div>
      </div>
      <div className="mag-container mag-footer-bottom">
        <span>© 2026 Suhanur Rahman</span>
        <span>Independent journal · Bangladesh</span>
      </div>
    </footer>
  )
}
