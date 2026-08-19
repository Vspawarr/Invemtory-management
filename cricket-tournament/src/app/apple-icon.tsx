import { ImageResponse } from 'next/og';

// iOS home-screen icons must be fully opaque (no transparency) and iOS
// applies its own corner rounding, so this is a plain square, unlike the
// circular badge in icon.tsx.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b1a35',
          color: '#f6c92b',
          fontSize: 108,
          fontWeight: 900,
          fontFamily: 'sans-serif',
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
