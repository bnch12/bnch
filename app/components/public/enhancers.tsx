'use client'

import { useEffect, useState } from 'react'

/** Reveals every .reveal element as it scrolls into view. Mount once. */
export function RevealInit() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'))
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  })
  return null
}

/** Thin progress bar showing how far the article has been read. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      setPct(max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return <div className="mag-progress" style={{ width: `${pct}%` }} aria-hidden="true" />
}

export function ShareActions({ title, url, compact = false }: { title: string; url: string; compact?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle')
  const [showFloating, setShowFloating] = useState(false)

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
      }
      setStatus('copied')
      window.setTimeout(() => setStatus('idle'), 1800)
    } catch {
      setStatus('idle')
    }
  }

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url })
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') return
      }
      return
    }
    await copyLink()
  }

  useEffect(() => {
    if (!compact) return
    let raf = 0
    const update = () => {
      raf = 0
      const bottomShare = document.querySelector('.mag-article-foot')
      const rect = bottomShare?.getBoundingClientRect()
      const bottomShareVisible = !!rect && rect.top < window.innerHeight && rect.bottom > 0
      setShowFloating(window.scrollY > 260 && !bottomShareVisible)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [compact])

  const buttons = (
    <>
      <button
        type="button"
        onClick={share}
        aria-label="Share this article"
        style={{ background: '#d92b2b', backgroundColor: '#d92b2b', backgroundImage: 'none', color: '#fff', borderColor: '#d92b2b' }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="m8.2 10.8 7.6-4.5" />
          <path d="m8.2 13.2 7.6 4.5" />
        </svg>
        {compact ? 'শেয়ার' : 'শেয়ার করুন'}
      </button>
      <button type="button" onClick={copyLink} aria-label={status === 'copied' ? 'Article link copied' : 'Copy article link'}>
        {status === 'copied' ? 'কপি হয়েছে' : 'কপি লিংক'}
      </button>
    </>
  )

  return (
    <>
      <div className={compact ? 'mag-share mag-share-compact' : 'mag-share'}>
        <style>{`
          .site-public .mag-share { display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; }
          .site-public .mag-share button { min-height:42px; min-width:24px; display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:9px 15px; border:1px solid var(--line); border-radius:999px; background:var(--surface); color:var(--fg); font-family:var(--serif); font-size:14px; font-weight:700; line-height:1; cursor:pointer; box-shadow:0 4px 14px -10px rgba(20,20,30,.35); transition:transform .18s ease, background .18s ease, border-color .18s ease, color .18s ease, box-shadow .18s ease; }
          .site-public .mag-share button:first-child { background:#d92b2b !important; background-color:#d92b2b !important; background-image:none !important; color:#fff !important; border-color:#d92b2b !important; box-shadow:0 8px 20px -12px rgba(217,43,43,.55); }
          .site-public .mag-share button:first-child::before { content:none !important; display:none !important; }
          .site-public .mag-share button:first-child svg { flex:0 0 auto; display:block; width:16px; height:16px; }
          .site-public .mag-share button:last-child { border-color:#d92b2b !important; background:transparent; }
          .site-public .mag-share button:hover { transform:translateY(-2px); border-color:#d92b2b; color:#d92b2b; box-shadow:0 8px 20px -12px rgba(20,20,30,.35); }
          .site-public .mag-share button:first-child:hover { background:#b91f1f !important; background-color:#b91f1f !important; border-color:#b91f1f !important; color:#fff !important; }
          .site-public .mag-share button:active { transform:translateY(0) scale(.98); }
          .site-public .mag-share button:focus-visible { outline:3px solid var(--ring); outline-offset:3px; }
          .site-public .mag-article-head > .mag-share-compact { width:100% !important; max-width:100%; justify-content:center !important; align-self:center; margin-top:18px; }
          .site-public .mag-share-compact { gap:7px; }
          .site-public .mag-share-compact button { min-height:38px; min-width:0; flex:0 0 auto !important; padding:8px 13px; gap:6px; font-size:13px; box-shadow:none; }
          .site-public .mag-share-compact button:first-child { box-shadow:0 7px 16px -11px rgba(217,43,43,.55); }
          .site-public .mag-share-compact button:first-child svg { width:15px; height:15px; }
          .site-public .mag-share-compact button:hover { transform:translateY(-1px); }
          .site-public .mag-share-floating {
            position:fixed !important;
            left:20px !important;
            right:auto !important;
            top:auto !important;
            bottom:24px !important;
            transform:none !important;
            z-index:450;
            width:auto !important;
            padding:5px;
            gap:5px;
            flex-wrap:nowrap;
            background:color-mix(in srgb, var(--surface) 94%, transparent);
            border:1px solid var(--line);
            border-radius:999px;
            box-shadow:0 14px 34px -18px rgba(20,20,30,.5);
            backdrop-filter:blur(14px);
            -webkit-backdrop-filter:blur(14px);
            animation:magShareFloatIn .2s ease-out;
          }
          .site-public .mag-share-floating button { min-height:40px; padding:8px 12px; box-shadow:none; }
          .site-public .mag-share-floating button:first-child { box-shadow:0 6px 16px -10px rgba(217,43,43,.6); }
          @keyframes magShareFloatIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          @media (max-width:1100px) {
            .site-public .mag-share-floating { left:14px !important; }
          }
          @media (max-width:640px) {
            .site-public .mag-share-compact { gap:5px; }
            .site-public .mag-share-compact button { min-height:32px; padding:6px 9px; gap:5px; font-size:11px; line-height:1; }
            .site-public .mag-share-compact button:first-child svg { width:13px; height:13px; }
            .site-public .mag-share-floating {
              left:10px !important;
              right:auto !important;
              top:auto !important;
              bottom:calc(12px + env(safe-area-inset-bottom)) !important;
              transform:none !important;
              padding:4px;
              gap:4px;
              border-radius:999px;
            }
            .site-public .mag-share-floating button { min-height:34px; padding:6px 9px; gap:5px; font-size:11px; }
            .site-public .mag-share-floating button:first-child svg { width:14px; height:14px; }
          }
          @media (prefers-reduced-motion:reduce) {
            .site-public .mag-share button { transition:none; }
            .site-public .mag-share-floating { animation:none; }
          }
        `}</style>
        {buttons}
      </div>
      {compact && showFloating ? <div className="mag-share mag-share-floating" aria-label="Article sharing actions">{buttons}</div> : null}
    </>
  )
}

/** Click any image in the article body to view it full-screen. */
export function Lightbox() {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG' && target.closest('.mag-article-body')) {
        setSrc((target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  useEffect(() => {
    if (!src) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSrc(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [src])
  if (!src) return null
  return (
    <div className="mag-lightbox" onClick={() => setSrc(null)} role="dialog" aria-modal="true">
      <img src={src} alt="" />
    </div>
  )
}
