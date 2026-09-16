'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed-until'
const DISMISS_DAYS = 7

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (isStandalone()) return

    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
    if (!isMobile) return

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissedUntil > Date.now()) return

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent)
    setIos(isIOS)

    const showPrompt = () => window.setTimeout(() => setShow(true), 1200)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      showPrompt()
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    if (isIOS) showPrompt()

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000))
    setShow(false)
    setInstallEvent(null)
  }

  const install = async () => {
    if (!installEvent) return
    const result = await installEvent.prompt()
    setInstallEvent(null)
    if (result.outcome === 'accepted') setShow(false)
  }

  useEffect(() => {
    const onInstalled = () => {
      setShow(false)
      setInstallEvent(null)
    }
    window.addEventListener('appinstalled', onInstalled)
    return () => window.removeEventListener('appinstalled', onInstalled)
  }, [])

  if (!show || (!installEvent && !ios)) return null

  return (
    <aside
      role="dialog"
      aria-label="অ্যাপ ইনস্টল করুন"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 9999,
        maxWidth: 480,
        margin: '0 auto',
        padding: 16,
        border: '1px solid rgba(0,0,0,.09)',
        borderRadius: 20,
        background: 'rgba(255,255,255,.97)',
        boxShadow: '0 18px 50px rgba(0,0,0,.18)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        animation: 'pwaInstallSheetIn .35s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
        <img
          src="/android-icon-192x192.png"
          alt=""
          width={52}
          height={52}
          style={{ borderRadius: 14, flex: '0 0 auto', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}
        />
        <div style={{ minWidth: 0, flex: 1, paddingTop: 1 }}>
          <div style={{ fontWeight: 750, fontSize: 16, lineHeight: 1.35 }}>জার্নাল অ্যাপ হিসেবে ইনস্টল করুন</div>
          {ios ? (
            <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.55, opacity: .68 }}>
              শেয়ার বাটনে চাপুন, তারপর Add to Home Screen নির্বাচন করুন।
            </div>
          ) : (
            <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.55, opacity: .68 }}>
              হোম স্ক্রিন থেকে দ্রুত জার্নাল খুলতে অ্যাপটি ইনস্টল করুন।
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="পরে"
          style={{
            border: 0,
            background: 'transparent',
            fontSize: 22,
            lineHeight: 1,
            padding: 0,
            cursor: 'pointer',
            opacity: .45,
          }}
        >
          ×
        </button>
      </div>

      {!ios && (
        <button
          type="button"
          onClick={install}
          style={{
            width: '100%',
            marginTop: 14,
            border: 0,
            borderRadius: 12,
            padding: '11px 14px',
            background: '#d92b2b',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          অ্যাপ হিসেবে ইনস্টল করুন
        </button>
      )}

      <style>{`@keyframes pwaInstallSheetIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </aside>
  )
}
