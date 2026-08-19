import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shivsankalp Yuva Pratishthan Cricket Tournament',
    short_name: 'Shivsankalp Cricket',
    description:
      'Open Double Wicket Cricket Tournament, Chapaner (Tekadi), Maharashtra. Live scores, teams, fixtures, and results.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1a35',
    theme_color: '#0b1a35',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    // Long-press (Android) or right-click (desktop taskbar) the installed
    // icon to jump straight to admin, instead of the public homepage.
    // /admin redirects to /admin/login when signed out and to the dashboard
    // when already signed in, so this one URL covers both cases.
    shortcuts: [
      {
        name: 'Admin Login',
        short_name: 'Admin',
        description: 'Score matches and manage the tournament',
        url: '/admin',
        icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
      },
    ],
  };
}
