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
  };
}
