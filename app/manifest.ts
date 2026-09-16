import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suhan's Note",
    short_name: "Suhan's Note",
    description: 'প্রযুক্তি, এআই, গবেষণা, ডেটা ও ডিজিটাল সংস্কৃতি নিয়ে সোহানুর রহমানের Notes।',
    id: `${SITE}/`,
    start_url: `${SITE}/`,
    scope: `${SITE}/`,
    display: 'standalone',
    display_override: ['standalone'],
    lang: 'bn-BD',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    icons: [
      { src: '/android-icon-36x36.png', sizes: '36x36', type: 'image/png', purpose: 'any' },
      { src: '/android-icon-48x48.png', sizes: '48x48', type: 'image/png', purpose: 'any' },
      { src: '/android-icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
      { src: '/android-icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
      { src: '/android-icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/android-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
