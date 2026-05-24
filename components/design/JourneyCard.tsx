'use client';

import Link from 'next/link';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { Reveal } from './Reveal';

type Accent = 'copper' | 'sage' | 'terracotta';

interface JourneyCardProps {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  accent?: Accent;
  href: string;
}

const TINTS: Record<Accent, { bg: string; border: string }> = {
  copper: {
    bg: 'linear-gradient(165deg, rgba(212,163,115,0.22), rgba(212,163,115,0.05))',
    border: 'rgba(184,116,58,0.25)',
  },
  sage: {
    bg: 'linear-gradient(165deg, rgba(124,137,112,0.22), rgba(124,137,112,0.04))',
    border: 'rgba(124,137,112,0.28)',
  },
  terracotta: {
    bg: 'linear-gradient(165deg, rgba(196,106,82,0.20), rgba(196,106,82,0.04))',
    border: 'rgba(196,106,82,0.28)',
  },
};

export function JourneyCard({ eyebrow, title, subtitle, accent = 'copper', href }: JourneyCardProps) {
  const t = TINTS[accent];
  const onEnter = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = 'translateY(-6px)';
    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
  };
  const onLeave = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  };
  return (
    <Reveal>
      <Link
        href={href}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{
          padding: 32,
          background: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: 24,
          minHeight: 320,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition:
            'transform 0.4s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.4s',
          textDecoration: 'none',
          color: 'var(--ink)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="label" style={{ color: 'var(--ink-2)' }}>{eyebrow}</div>
        </div>
        <div>
          <h3 style={{ fontSize: 'clamp(28px, 3vw, 38px)', lineHeight: 1.02 }}>{title}</h3>
          <p
            style={{
              marginTop: 14,
              color: 'var(--ink-3)',
              fontSize: 15.5,
              maxWidth: 360,
              lineHeight: 1.55,
            }}
          >
            {subtitle}
          </p>
          <div
            style={{
              marginTop: 22,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 14,
              color: 'var(--ink)',
            }}
          >
            Start here <span className="arrow">→</span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
