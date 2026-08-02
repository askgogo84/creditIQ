'use client';

/**
 * Tour — a generic, reusable guided-tour overlay.
 *
 * Renders ONE anchored card at a time from a `steps` array. It knows nothing
 * about any specific page: give it steps (each optionally naming a CSS-selector
 * anchor) and it positions itself beside the current step's target, dims the
 * rest, and lets the user step through with Continue / Skip / keyboard.
 *
 * `variant`: 'light' = white/copper light system (the migrated wallet); the card
 * renders with no [data-ciq] wrapper and follows the site theme. 'gold' (default)
 * = the retired [data-ciq] gold system, kept UNCHANGED so the dev preview and the
 * existing token tests are unaffected. Remove the 'gold' branch with the gold
 * cleanup (docs/wallet/06-Implementation-Plan Follow-on task).
 */

import { useEffect, useLayoutEffect, useRef, useState, useId } from 'react';

export interface TourStep {
  /** Short heading for the step. */
  title: string;
  /** One short paragraph of body copy. */
  body: string;
  /** Optional CSS selector for the element this step points at. If it doesn't
   *  resolve (or is omitted), the card is centred in the viewport. */
  anchor?: string;
}

export interface TourProps {
  steps: TourStep[];
  open: boolean;
  /** Called when the tour ends — 'skip' (Skip/Escape) or 'done' (final Continue). */
  onClose: (reason: 'skip' | 'done') => void;
  /** Fired whenever the active step changes. */
  onStepChange?: (index: number) => void;
  /** Eyebrow prefix, e.g. "TOUR" -> "TOUR · STEP 2 OF 5". */
  labelPrefix?: string;
  /** Step to open on. */
  startIndex?: number;
  /** CIQ theme for the card (gold variant only). Defaults to dark. */
  theme?: 'dark' | 'light';
  /** Design system. 'gold' (default, retired) or 'light' (white/copper). */
  variant?: 'gold' | 'light';
  /** Label for the final Continue button. Defaults to "Done". */
  finalLabel?: string;
}

const GAP = 12;
const EDGE = 8;

export function Tour({
  steps,
  open,
  onClose,
  onStepChange,
  labelPrefix = 'TOUR',
  startIndex = 0,
  theme = 'dark',
  variant = 'gold',
  finalLabel,
}: TourProps) {
  const [index, setIndex] = useState(startIndex);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [ring, setRing] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  const total = steps.length;
  const isLast = index >= total - 1;
  const isFirst = index <= 0;

  // Reset to the start step each time the tour is (re)opened.
  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  useEffect(() => {
    if (open) onStepChange?.(index);
  }, [open, index, onStepChange]);

  // --- Focus lifecycle: save on open, move focus in, restore on close. ---
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    // Focus the card container (tabIndex -1) so keyboard lands inside the trap.
    cardRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open]);

  // --- Keyboard: Escape (skip), Tab (trap), Arrows (navigate). Re-bound per
  // step so arrow navigation sees the current index. ---
  useEffect(() => {
    if (!open) return;

    const focusables = (): HTMLElement[] => {
      const node = cardRef.current;
      if (!node) return [];
      return Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose('skip');
        return;
      }
      if (e.key === 'Tab') {
        const f = focusables();
        if (f.length === 0) {
          e.preventDefault();
          cardRef.current?.focus();
          return;
        }
        const first = f[0];
        const last = f[f.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === cardRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isLast) onClose('done');
        else setIndex((i) => Math.min(i + 1, total - 1));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, index, isLast, total, onClose]);

  // --- Position the card against the current step's anchor. ---
  useLayoutEffect(() => {
    if (!open) return;

    const measure = () => {
      const card = cardRef.current;
      const sel = steps[index]?.anchor;
      const target = sel ? document.querySelector(sel) : null;
      if (!card || !target) {
        setPos(null); // centred fallback
        setRing(null);
        return;
      }
      const a = target.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top = a.bottom + GAP;
      if (top + c.height > vh - EDGE) {
        const above = a.top - c.height - GAP;
        top = above >= EDGE ? above : Math.max(EDGE, vh - c.height - EDGE);
      }
      let left = a.left + a.width / 2 - c.width / 2;
      left = Math.min(Math.max(EDGE, left), Math.max(EDGE, vw - c.width - EDGE));

      setPos({ top, left });
      setRing({ top: a.top, left: a.left, width: a.width, height: a.height });
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, index, steps]);

  if (!open || total === 0) return null;

  const step = steps[Math.min(index, total - 1)];
  const eyebrow = `${labelPrefix} · STEP ${index + 1} OF ${total}`;

  // Token set per variant. 'gold' reproduces the pre-migration values exactly
  // (dev preview + Tour.test rely on --ciq-panel / --ciq-gold*).
  const light = variant === 'light';
  const c = light
    ? {
        panel: 'var(--surface)', ink: 'var(--ink)', ink2: 'var(--ink-2)', ink3: 'var(--ink-3)',
        cardLine: 'var(--line-strong)', ringLine: 'color-mix(in srgb,var(--copper-3) 55%, transparent)',
        dotOn: 'var(--copper)', dotOff: 'var(--line-strong)',
        btnBg: 'var(--copper)', btnInk: 'var(--surface)', monoCls: 'mono', displayCls: 'w-display',
      }
    : {
        panel: 'var(--ciq-panel)', ink: 'var(--ciq-ink)', ink2: 'var(--ciq-ink-2)', ink3: 'var(--ciq-ink-3)',
        cardLine: 'var(--ciq-gold-line)', ringLine: 'var(--ciq-gold-line)',
        dotOn: 'var(--ciq-gold)', dotOff: 'var(--ciq-line-2)',
        btnBg: 'linear-gradient(135deg, var(--ciq-gold-2), var(--ciq-gold))', btnInk: '#1A1710',
        monoCls: 'ciq-mono', displayCls: 'ciq-display',
      };

  // Anchored -> fixed at computed top/left. No anchor -> centred via the
  // overlay's flex box (NOT a transform, so the entry animation can't wipe it).
  const cardStyle: React.CSSProperties = pos
    ? { position: 'fixed', top: pos.top, left: pos.left }
    : { position: 'relative' };

  return (
    <div
      // gold variant scopes itself to [data-ciq]; light follows the site theme.
      {...(light ? {} : { 'data-ciq': true, 'data-theme': theme })}
      aria-hidden={false}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: pos ? 'block' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Scrim. Does not dismiss on click — Skip / Escape / Done are explicit. */}
      <div className="ciq-tour-scrim" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

      {/* Highlight ring around the anchored element. */}
      {ring && (
        <div
          aria-hidden
          className="ciq-tour-ring"
          style={{
            position: 'fixed',
            top: ring.top - 6,
            left: ring.left - 6,
            width: ring.width + 12,
            height: ring.height + 12,
            border: `1.5px solid ${c.ringLine}`,
            borderRadius: 'var(--r-md)',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.0)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* The tour card. */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className="ciq-tour-card ciq-rise"
        style={{
          ...cardStyle,
          width: 'min(320px, calc(100vw - 32px))',
          background: c.panel,
          color: c.ink,
          border: `1px solid ${c.cardLine}`,
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: '18px',
          outline: 'none',
        }}
      >
        <p
          className={c.monoCls}
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: '0.12em',
            color: c.ink3,
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </p>

        <h2
          id={titleId}
          className={c.displayCls}
          style={{ margin: '8px 0 6px', fontSize: 18, fontWeight: 600, color: c.ink }}
        >
          {step.title}
        </h2>

        <p id={bodyId} style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: c.ink2 }}>
          {step.body}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 18,
            gap: 8,
          }}
        >
          {/* Skip — left */}
          <button
            type="button"
            onClick={() => onClose('skip')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 4px',
              fontSize: 13,
              color: c.ink3,
              cursor: 'pointer',
            }}
          >
            Skip
          </button>

          {/* Dot progress — centre. Decorative; the eyebrow carries the a11y text. */}
          <div aria-hidden style={{ display: 'flex', gap: 6 }}>
            {steps.map((_, i) => (
              <span
                key={i}
                className="ciq-tour-dot"
                style={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  borderRadius: 100,
                  background: i === index ? c.dotOn : c.dotOff,
                }}
              />
            ))}
          </div>

          {/* Continue / final — right. Final label defaults to "Done". */}
          <button
            type="button"
            onClick={() => (isLast ? onClose('done') : setIndex((i) => Math.min(i + 1, total - 1)))}
            style={{
              background: c.btnBg,
              border: 'none',
              borderRadius: 'var(--r-sm)',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: c.btnInk,
              cursor: 'pointer',
            }}
          >
            {isLast ? (finalLabel ?? 'Done') : 'Continue'}
          </button>
        </div>
      </div>

      {/* Scoped animation + reduced-motion opt-out (self-contained; does not
          rely on the global [data-ciq] rule in case this mounts elsewhere). */}
      <style>{`
        .ciq-tour-card.ciq-rise { animation: ciqTourIn 180ms cubic-bezier(0.22,1,0.36,1) both; }
        .ciq-tour-scrim { animation: ciqTourFade 180ms ease both; }
        @keyframes ciqTourIn { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes ciqTourFade { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .ciq-tour-card.ciq-rise, .ciq-tour-scrim { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

export default Tour;
