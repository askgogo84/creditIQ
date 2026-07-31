'use client';

/**
 * Isolated preview harness for the reusable <Tour> component.
 *
 * This is a Storybook-style demo route: it exists ONLY to exercise the tour in
 * isolation. It is not linked from any navigation and applies the tour to no
 * real product surface. Dark and light instances so you can eyeball both themes.
 */

import { useState } from 'react';
import { Tour, type TourStep } from '@/components/ciq/Tour';

const STEPS: TourStep[] = [
  {
    title: 'Your wallet total',
    body: 'This is every point you hold, split into what we verified from your statements and what you told us yourself.',
    anchor: '#demo-total',
  },
  {
    title: 'Verified vs estimated',
    body: 'Green is read straight from a statement. Grey is your own estimate. We never dress one up as the other.',
    anchor: '#demo-gauge',
  },
  {
    title: 'Add a card',
    body: 'Upload a statement to add a verified card, or enter one by hand to keep an estimate in view.',
    anchor: '#demo-add',
  },
];

export default function TourPreviewPage() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lastReason, setLastReason] = useState<string>('—');
  const [step, setStep] = useState(0);

  return (
    <main
      data-ciq
      data-theme={theme}
      style={{ minHeight: '100vh', background: 'var(--ciq-bg)', color: 'var(--ciq-ink)', padding: 24 }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gap: 20 }}>
        <header style={{ display: 'grid', gap: 6 }}>
          <p className="ciq-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ciq-ink-3)', textTransform: 'uppercase' }}>
            Component preview · not a product surface
          </p>
          <h1 className="ciq-display" style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>
            &lt;Tour&gt; in isolation
          </h1>
        </header>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{ background: 'linear-gradient(135deg, var(--ciq-gold-2), var(--ciq-gold))', color: '#1A1710', border: 'none', borderRadius: 'var(--r-sm)', padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}
          >
            Start tour
          </button>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            style={{ background: 'transparent', color: 'var(--ciq-ink-2)', border: '1px solid var(--ciq-line-2)', borderRadius: 'var(--r-sm)', padding: '10px 18px', cursor: 'pointer' }}
          >
            Theme: {theme}
          </button>
        </div>

        <p className="ciq-mono" style={{ fontSize: 12, color: 'var(--ciq-ink-3)' }}>
          last close: {lastReason} · active step (0-based): {step}
        </p>

        {/* Anchor targets the tour points at. */}
        <section style={{ display: 'grid', gap: 14 }}>
          <div id="demo-total" style={{ border: '1px solid var(--ciq-line-2)', borderRadius: 'var(--r-md)', padding: 18 }}>
            <p className="ciq-mono" style={{ fontSize: 11, color: 'var(--ciq-ink-3)', margin: 0 }}>ANCHOR #demo-total</p>
            <p className="ciq-display" style={{ fontSize: 32, margin: '6px 0 0' }}>1,240 pts</p>
          </div>
          <div id="demo-gauge" style={{ border: '1px solid var(--ciq-line-2)', borderRadius: 'var(--r-md)', padding: 18 }}>
            <p className="ciq-mono" style={{ fontSize: 11, color: 'var(--ciq-ink-3)', margin: 0 }}>ANCHOR #demo-gauge</p>
            <div style={{ display: 'flex', height: 10, borderRadius: 100, overflow: 'hidden', marginTop: 10 }}>
              <div style={{ flex: 900, background: 'var(--ciq-verified)' }} />
              <div style={{ flex: 340, background: 'var(--ciq-estimated)' }} />
            </div>
          </div>
          <button id="demo-add" type="button" style={{ border: '1px dashed var(--ciq-gold-line)', background: 'transparent', color: 'var(--ciq-ink)', borderRadius: 'var(--r-md)', padding: 18, textAlign: 'left', cursor: 'pointer' }}>
            <p className="ciq-mono" style={{ fontSize: 11, color: 'var(--ciq-ink-3)', margin: 0 }}>ANCHOR #demo-add</p>
            <p style={{ margin: '6px 0 0' }}>+ Add a card</p>
          </button>
        </section>
      </div>

      <Tour
        steps={STEPS}
        open={open}
        theme={theme}
        onStepChange={setStep}
        onClose={(reason) => {
          setOpen(false);
          setLastReason(reason);
        }}
      />
    </main>
  );
}
