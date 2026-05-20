import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'CreditIQ';
  const subtitle = searchParams.get('subtitle') || 'Honest credit card intelligence for India';
  const badge = searchParams.get('badge') || '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1f 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #d4a373, #e9b97f)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, #e9b97f, #d4a373, #b8834a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 22 }}>C</span>
          </div>
          <div>
            <div style={{ color: '#f5f5f6', fontSize: 28, fontWeight: 700 }}>CreditIQ</div>
            <div style={{ color: '#6f6f78', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase' }}>Intelligence</div>
          </div>
        </div>

        {badge && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ background: 'rgba(212,163,115,0.15)', border: '1px solid rgba(212,163,115,0.3)', borderRadius: 20, padding: '6px 16px', color: '#d4a373', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>
              {badge}
            </div>
          </div>
        )}

        <div style={{ color: '#f5f5f6', fontSize: 56, fontWeight: 700, lineHeight: 1.1, marginBottom: 24, maxWidth: 800 }}>
          {title}
        </div>

        <div style={{ color: '#9b9ba2', fontSize: 24, lineHeight: 1.5, maxWidth: 700 }}>
          {subtitle}
        </div>

        {/* Bottom stats */}
        <div style={{ position: 'absolute', bottom: 60, left: 80, right: 80, display: 'flex', gap: 60, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 30 }}>
          {[
            { v: '93+', l: 'Cards tracked' },
            { v: '17', l: 'Banks covered' },
            { v: '0%', l: 'Affiliate bias' },
          ].map(s => (
            <div key={s.l} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: '#d4a373', fontSize: 28, fontWeight: 700 }}>{s.v}</div>
              <div style={{ color: '#6f6f78', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
