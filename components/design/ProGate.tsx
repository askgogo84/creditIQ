'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

/**
 * ProGate - wraps premium content. Pro users see it normally.
 * Non-Pro users see it blurred behind an "Unlock" overlay (points.casa model).
 *
 * IMPORTANT: This is presentation-only. Real enforcement lives server-side in
 * the gated API routes via isProServer(). The blur is a conversion surface,
 * not a security boundary.
 */
export function ProGate({
  children,
  title = 'Unlock live flight results',
  subtitle = 'See real-time award seats, live fares, and one-tap booking across every platform.',
  ctaLabel = 'Go Pro \u2192',
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
}) {
  const [isPro, setIsPro] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sb = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );
        const { data } = await sb.auth.getSession();
        const token = data.session?.access_token;
        if (!token) { if (mounted) setIsPro(false); return; }
        const res = await fetch('/api/subscription/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { if (mounted) setIsPro(false); return; }
        const j = await res.json();
        if (mounted) setIsPro(!!j?.isPro);
      } catch {
        if (mounted) setIsPro(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // While we don't know yet, render children normally (avoids a flash of the
  // paywall for paying users). Server routes still enforce, so this is safe.
  if (isPro === null || isPro === true) {
    return <>{children}</>;
  }

  // Non-Pro: blurred content with an upgrade overlay.
  return (
    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden' }}>
      {/* Blurred, non-interactive preview */}
      <div
        aria-hidden
        style={{
          filter: 'blur(7px)',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.55,
          transform: 'scale(1.02)',
        }}
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '32px 24px',
          background: 'linear-gradient(180deg, rgba(248,249,252,0.55), rgba(248,249,252,0.88))',
        }}
      >
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(201,151,46,0.12)', border: '1px solid rgba(201,151,46,0.32)',
            borderRadius: 100, padding: '5px 14px', marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 13 }}>&#128274;</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#8C5F12', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            CreditIQ Pro
          </span>
        </div>

        <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: -0.4, maxWidth: 420, lineHeight: 1.2 }}>
          {title}
        </div>
        <div style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', maxWidth: 400, lineHeight: 1.6 }}>
          {subtitle}
        </div>

        <Link
          href="/pro"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 14,
            background: 'linear-gradient(135deg, #C9972E, #E8B84B)',
            color: '#0a0a0a', fontSize: 15, fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(201,151,46,0.32)',
          }}
        >
          {ctaLabel}
        </Link>

        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 14 }}>
          From &#8377;199/mo &bull; Cancel anytime
        </div>
      </div>
    </div>
  );
}

export default ProGate;
