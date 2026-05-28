'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Reveal } from './Reveal';

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Discover',
    links: [
      { label: 'All Cards',     href: '/cards' },
      { label: 'Smart Match',   href: '/smart-match' },
      { label: 'Compare',       href: '/compare' },
      { label: 'UAE Cards',     href: '/uae' },
      { label: 'Sweet Spots',   href: '/sweet-spots' },
      { label: 'Blog',          href: '/blog' },
    ],
  },
  {
    title: 'AI Tools',
    links: [
      { label: 'Card Match',       href: '/smart-match' },
      { label: 'Card Roast',       href: '/card-roast' },
      { label: 'Spend Optimizer',  href: '/spend-optimizer' },
      { label: 'Points Optimizer', href: '/points-optimizer' },
      { label: 'Statement Truth',  href: '/statement-truth' },
      { label: 'Travel AI',        href: '/travel' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'How we earn',  href: '/disclosures' },
      { label: 'Methodology',  href: '/about' },
      { label: 'Press',        href: '/about' },
      { label: 'Careers',      href: '/about' },
    ],
  },
];

export function DesignFooter() {
  return (
    <footer className="footer">
      <div className="shell" style={{ padding: 0 }}>
        <Reveal>
          <h2
            style={{
              fontSize: 'clamp(40px, 9vw, 120px)',
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
              maxWidth: 1000,
              marginBottom: 32,
            }}
          >
            Card<span style={{ fontStyle: 'italic', color: 'var(--copper)' }}>IQ</span>.<br />
            <span className="serif" style={{ color: 'var(--ink-3)' }}>The honest one.</span>
          </h2>
        </Reveal>

        <div
          className="grid-2-mobile"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
            gap: 40,
            marginBottom: 56,
          }}
        >
          <div>
            <Logo size="md" showWordmark={true} />
            <p
              style={{
                color: 'var(--ink-3)',
                fontSize: 14.5,
                maxWidth: 320,
                marginTop: 22,
                lineHeight: 1.6,
              }}
            >
              India&apos;s first{' '}
              <span className="serif" style={{ color: 'var(--ink)' }}>unbiased</span>{' '}
              credit card intelligence platform. Built by people who refuse to be paid by banks
              to rank cards.
            </p>
            <p
              className="mono"
              style={{
                color: 'var(--ink-4)',
                fontSize: 11,
                marginTop: 24,
                letterSpacing: '0.2em',
              }}
            >
              MADE IN INDIA . EST. 2025
            </p>
          </div>
          {COLS.map(col => (
            <div key={col.title}>
              <div className="label" style={{ marginBottom: 18 }}>{col.title}</div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      style={{
                        color: 'var(--ink-2)',
                        textDecoration: 'none',
                        fontSize: 14.5,
                      }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            paddingTop: 24,
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--ink-4)',
            fontSize: 12,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span className="mono">(c) 2026 CREDITIQ INTELLIGENCE PVT LTD</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/privacy" className="mono" style={{ color: 'var(--ink-4)', textDecoration: 'none', fontSize: 12, letterSpacing: '0.1em' }}>PRIVACY</Link>
            <Link href="/terms" className="mono" style={{ color: 'var(--ink-4)', textDecoration: 'none', fontSize: 12, letterSpacing: '0.1em' }}>TERMS</Link>
            <Link href="/disclosures" className="mono" style={{ color: 'var(--ink-4)', textDecoration: 'none', fontSize: 12, letterSpacing: '0.1em' }}>DISCLOSURES</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
