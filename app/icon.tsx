import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: 'linear-gradient(135deg, #0f1f35 0%, #1B3A5C 50%, #0d2540 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Card body */}
        <div
          style={{
            position: 'absolute',
            left: 5,
            top: 9,
            width: 22,
            height: 14,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }}
        >
          {/* Chip */}
          <div
            style={{
              margin: '3px 0 0 3px',
              width: 8,
              height: 6,
              borderRadius: 1,
              background: 'linear-gradient(135deg, #C9972E, #f0c060, #a07820)',
            }}
          />
        </div>
        {/* Magnetic stripe */}
        <div
          style={{
            position: 'absolute',
            left: 5,
            top: 11,
            width: 22,
            height: 3,
            background: 'rgba(201,151,46,0.6)',
          }}
        />
        {/* Sparkle */}
        <div
          style={{
            position: 'absolute',
            right: 4,
            top: 4,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#C9972E',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
