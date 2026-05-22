'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

interface AIToolCardProps {
  icon: ReactNode;
  title: ReactNode;
  desc: ReactNode;
  badge?: { text: string; tone?: string };
  href: string;
}

export function AIToolCard({ icon, title, desc, badge, href }: AIToolCardProps) {
  return (
    <Reveal>
      <Link
        href={href}
        className="card-soft"
        style={{
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          height: '100%',
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'var(--ink)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'var(--bg-2)',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: 'var(--copper)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 24, letterSpacing: '-0.02em' }}>{title}</h3>
            {badge && (
              <span className={`badge ${badge.tone || 'badge-copper'}`}>{badge.text}</span>
            )}
          </div>
          <p style={{ color: 'var(--ink-3)', fontSize: 14.5, lineHeight: 1.55 }}>{desc}</p>
        </div>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--ink-2)',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          <span>Open tool</span>
          <span className="arrow">→</span>
        </div>
      </Link>
    </Reveal>
  );
}
