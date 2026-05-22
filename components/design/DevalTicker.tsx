'use client';

import { Fragment } from 'react';

interface DevalTickerProps {
  items: string[];
}

export function DevalTicker({ items }: DevalTickerProps) {
  const content = items.map((s, i) => (
    <span
      key={`a-${i}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: 'currentColor',
          flexShrink: 0,
        }}
      />
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s}</span>
    </span>
  ));

  return (
    <div className="deval" style={{ padding: '12px 0', position: 'relative', zIndex: 1 }}>
      <div className="marquee">
        <div className="marquee__track">
          {content}
          {content.map((c, i) => (
            <Fragment key={`b-${i}`}>{c}</Fragment>
          ))}
        </div>
        <div className="marquee__track" aria-hidden="true">
          {content}
          {content.map((c, i) => (
            <Fragment key={`c-${i}`}>{c}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
