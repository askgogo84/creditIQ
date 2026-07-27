import Link from 'next/link';

// Custom 404. The Next.js default renders hard-coded near-black text, which is
// invisible on the dark theme's near-black --bg. This uses the app's theme tokens
// (--ink on --bg) so contrast is correct in BOTH themes:
//   light: #142950 on #F5EFE6 (~13:1)   dark: #F5EFE6 on #0A1226 (~16:1)
// Body text uses --ink-2 (>8:1 both themes); the gold CTA is dark-on-gold (~5.7:1).
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}
    >
      <div
        style={{
          fontSize: 'clamp(72px, 18vw, 156px)',
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: 'var(--ink)',
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 700, margin: '18px 0 10px', color: 'var(--ink)' }}>
        This page could not be found
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 440, margin: '0 0 30px', color: 'var(--ink-2)' }}>
        The card or page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: 'var(--copper-3, #C9A24B)',
            color: '#0A1226',
            padding: '12px 24px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          Back to home
        </Link>
        <Link
          href="/cards"
          style={{
            display: 'inline-block',
            background: 'transparent',
            color: 'var(--ink)',
            border: '1.5px solid var(--ink)',
            padding: '12px 24px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          Browse all cards
        </Link>
      </div>
    </main>
  );
}
