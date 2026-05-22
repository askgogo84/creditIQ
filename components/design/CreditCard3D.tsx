'use client';

import { useRef, type MouseEvent as ReactMouseEvent } from 'react';

export type CardVariant = 'obsidian' | 'gold' | 'mint' | 'iris' | 'navy' | 'plum' | 'cream';

const CARD_SURFACES: Record<CardVariant, string> = {
  obsidian: 'linear-gradient(135deg, #1A1A28 0%, #0A0A12 50%, #1F1A0E 100%)',
  gold:     'linear-gradient(135deg, #2A1F08 0%, #4A350F 40%, #B8743A 100%)',
  mint:     'linear-gradient(135deg, #08231C 0%, #0D3A30 50%, #14B488 100%)',
  iris:     'linear-gradient(135deg, #14102E 0%, #2A2160 50%, #7C6BFF 100%)',
  navy:     'linear-gradient(135deg, #0A1428 0%, #142A4A 50%, #1B3A5C 100%)',
  plum:     'linear-gradient(135deg, #1A0820 0%, #3A0F40 50%, #8B2C82 100%)',
  cream:    'linear-gradient(135deg, #F0E0C4 0%, #D4A373 100%)',
};

interface CreditCard3DProps {
  name?: string;
  bank?: string;
  tagline?: string;
  network?: string;
  variant?: CardVariant;
  number?: string;
  small?: boolean;
  interactive?: boolean;
}

export function CreditCard3D({
  name = 'INFINITE',
  bank = 'CREDITIQ',
  tagline = 'RESERVE METAL',
  network = 'VISA',
  variant = 'obsidian',
  number,
  small = false,
  interactive = true,
}: CreditCard3DProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!interactive || !wrapRef.current || !cardRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rx = (y - 0.5) * -14;
    const ry = (x - 0.5) * 16;
    cardRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    cardRef.current.style.setProperty('--mx', `${x * 100}%`);
    cardRef.current.style.setProperty('--my', `${y * 100}%`);
  };
  const onLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'rotateX(0) rotateY(0)';
    }
  };

  const isLight = variant === 'cream';
  const textColor = isLight ? '#1A1612' : '#FFF';
  const subColor = isLight ? 'rgba(26,22,18,0.6)' : 'rgba(255,255,255,0.6)';
  const lowColor = isLight ? 'rgba(26,22,18,0.4)' : 'rgba(255,255,255,0.45)';

  return (
    <div
      ref={wrapRef}
      className="card3d-wrap"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        ref={cardRef}
        className="card3d"
        style={{ background: CARD_SURFACES[variant] || CARD_SURFACES.obsidian }}
      >
        <div className="card3d-holo" />
        <div className="card3d-shine" />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: small ? '14px 16px' : 'clamp(16px, 3.5%, 28px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 3,
            color: textColor,
          }}
        >
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: small ? 7 : 9,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  color: subColor,
                  textTransform: 'uppercase',
                }}
              >
                {bank}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 500,
                  fontSize: small ? 17 : 'clamp(20px, 4.5%, 30px)',
                  letterSpacing: '-0.02em',
                  marginTop: 6,
                  lineHeight: 1,
                }}
              >
                {name}
              </div>
              <div
                className="serif"
                style={{
                  fontSize: small ? 11 : 'clamp(13px, 2.4%, 16px)',
                  marginTop: 4,
                  color: subColor,
                  fontStyle: 'italic',
                }}
              >
                {tagline}
              </div>
            </div>

            {/* Chip */}
            <div
              style={{
                width: small ? 28 : 40,
                height: small ? 22 : 30,
                borderRadius: 5,
                background: 'linear-gradient(135deg, #E8C97A, #A0782A 60%, #FFE9A6)',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.3)',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '4px',
                  background:
                    'repeating-linear-gradient(90deg, transparent 0 3px, rgba(0,0,0,0.2) 3px 4px)',
                }}
              />
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
            <div
              className="mono"
              style={{
                fontSize: small ? 9 : 'clamp(10px, 1.7%, 12px)',
                letterSpacing: '0.15em',
                color: lowColor,
              }}
            >
              {number || '•• •• •• ••'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: small ? 11 : 'clamp(13px, 2.4%, 16px)',
                letterSpacing: '0.04em',
                fontStyle: 'italic',
                color: subColor,
              }}
            >
              {network}
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />
      </div>
    </div>
  );
}
