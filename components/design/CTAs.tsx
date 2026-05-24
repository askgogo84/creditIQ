'use client';

import Link from 'next/link';
import type { ReactNode, CSSProperties } from 'react';

interface CTAProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  arrow?: boolean;
}

function CTAInner({ children, arrow = true }: { children: ReactNode; arrow?: boolean }) {
  return (
    <>
      {children}
      {arrow && <span className="arrow">→</span>}
    </>
  );
}

function makeCTA(variantClass: string) {
  return function CTA({ children, href, onClick, className, style, arrow = true }: CTAProps) {
    const combined = `btn ${variantClass} ${className || ''}`.trim();
    if (href) {
      return (
        <Link href={href} className={combined} style={style} onClick={onClick}>
          <CTAInner arrow={arrow}>{children}</CTAInner>
        </Link>
      );
    }
    return (
      <button className={combined} style={style} onClick={onClick}>
        <CTAInner arrow={arrow}>{children}</CTAInner>
      </button>
    );
  };
}

export const CopperCTA  = makeCTA('btn-copper');
export const PrimaryCTA = makeCTA('btn-primary');
export const GhostCTA   = makeCTA('btn-ghost');
