import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mounjaro Tracker',
    short_name: 'MounjaroRx',
    description: 'Track your Mounjaro treatment progress',
    start_url: '/summary',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/mobile-summary.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Summary dashboard showing weight progress and next injection',
      },
      {
        src: '/screenshots/mobile-results.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Results chart showing weight trend over time',
      },
      {
        src: '/screenshots/desktop-summary.png',
        sizes: '1280x800',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Desktop view of summary dashboard',
      },
    ],
  };
}
