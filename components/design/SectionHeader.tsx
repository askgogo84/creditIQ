'use client';

import { Reveal } from './Reveal';

interface SectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({ label, title, subtitle, align = 'left' }: SectionHeaderProps) {
  return (
    <Reveal
      style={{
        textAlign: align,
        maxWidth: 900,
        margin: align === 'center' ? '0 auto' : 0,
      }}
    >
      {label && <div className="label-copper" style={{ marginBottom: 18 }}>{label}</div>}
      <h2 style={{ fontSize: 'clamp(32px, 5.5vw, 68px)' }}>{title}</h2>
      {subtitle && (
        <p
          style={{
            marginTop: 18,
            color: 'var(--ink-3)',
            fontSize: 'clamp(15px, 1.2vw, 18px)',
            maxWidth: 620,
            marginLeft: align === 'center' ? 'auto' : 0,
            marginRight: align === 'center' ? 'auto' : 0,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
