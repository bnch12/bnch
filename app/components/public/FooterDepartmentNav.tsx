'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

type MenuItem = {
  id: string
  categoryId: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  children: MenuItem[]
}

export default function FooterDepartmentNav({ items }: { items: MenuItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <nav className="mag-footer-dept-nav" aria-label="Footer sections">
      {items.map((item) => (
        <div key={item.id} className={`mag-footer-dept-group${expanded === item.id ? ' is-expanded' : ''}`}>
          <div className="mag-footer-dept-row">
            <Link href={`/category/${item.slug}/`} className="mag-footer-dept-parent">
              {item.name}
            </Link>
            {item.children.length ? (
              <button
                type="button"
                className="mag-footer-dept-toggle"
                aria-label={`${item.name} submenu`}
                aria-expanded={expanded === item.id}
                onClick={() => setExpanded((current) => current === item.id ? null : item.id)}
              >
                <ChevronDown size={19} strokeWidth={1.9} />
              </button>
            ) : null}
          </div>
          {item.children.length ? (
            <div className="mag-footer-dept-children">
              <div className="mag-footer-dept-children-inner">
                {item.children.map((child) => (
                  <Link key={child.id} href={`/category/${child.slug}/`}>
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </nav>
  )
}
