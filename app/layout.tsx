import type { Metadata } from 'next'
import Script from 'next/script'
import './ckeditor-admin.css'
import './theme.css'
import './scroll-to-top.css'
import './header-menu.css'
import './components/public/search-overlay.css'
import ScrollToTop from './components/public/ScrollToTop'
import PWAInstallPrompt from './components/public/PWAInstallPrompt'
import { AUTHOR_NAME, AUTHOR_URL, DEFAULT_DESCRIPTION, GLOBAL_KEYWORDS, OG_IMAGE, PROFILE_IMAGE, SITE, SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: `${SITE_NAME} — প্রযুক্তি, গবেষণা, AI ও ডিজিটাল জীবন`, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  keywords: GLOBAL_KEYWORDS,
  authors: [{ name: AUTHOR_NAME, url: AUTHOR_URL }],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  category: 'technology',
  alternates: { canonical: SITE },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    siteName: SITE_NAME,
    url: SITE,
    title: `${SITE_NAME} — প্রযুক্তি, গবেষণা, AI ও ডিজিটাল জীবন`,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1672, height: 941, alt: 'সোহানুর রহমান | Notes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
}

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t}}catch(e){}})()`

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      inLanguage: 'bn-BD',
      publisher: { '@id': `${SITE}/#person` },
    },
    {
      '@type': 'Person',
      '@id': `${SITE}/#person`,
      name: AUTHOR_NAME,
      url: AUTHOR_URL,
      image: PROFILE_IMAGE,
      jobTitle: 'Technology and Research Professional',
      mainEntityOfPage: `${SITE}/about/`,
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn-BD">
      <head>
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@400;500;600;700;800;900&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        <style dangerouslySetInnerHTML={{ __html: 'html{scroll-behavior:auto!important}' }} />
      </head>
      <body>
        {children}
        <ScrollToTop />
        <PWAInstallPrompt />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-E4HZ6RPVBC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-E4HZ6RPVBC');
          `}
        </Script>
      </body>
    </html>
  )
}