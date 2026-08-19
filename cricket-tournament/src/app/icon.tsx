import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
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
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 340,
            height: 340,
            borderRadius: '50%',
            border: '14px solid #f2b705',
            color: '#f6c92b',
            fontSize: 220,
            fontWeight: 900,
            fontFamily: 'sans-serif',
          }}
        >
          S
        </div>
      </div>
    ),
    { ...size }
  );
}
