'use client';

import type { CSSProperties, ReactNode } from 'react';

interface StampProps {
  children: ReactNode;
  variant?: '' | 'sage' | 'plum' | 'terra';
  style?: CSSProperties;
}

export function Stamp({ children, variant = '', style }: StampProps) {
  return (
    <div className={`stamp ${variant ? 'stamp-' + variant : ''}`} style={style}>
      {children}
    </div>
  );
}
