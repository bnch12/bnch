'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      className={`site-scroll-top${visible ? ' is-visible' : ''}`}
      onClick={scrollToTop}
      aria-label="উপরে ফিরে যান"
      title="উপরে ফিরে যান"
    >
      <ArrowUp size={18} strokeWidth={2.2} aria-hidden="true" />
    </button>
  )
}
