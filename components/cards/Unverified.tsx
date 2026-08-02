'use client';

import { isCardUnverified, isFieldUnverified } from '@/lib/data/unverified-cards';

// SINGLE SOURCE of the "this card's data is being re-verified" UI treatment.
// Every surface that shows a contested card's value or ranked row must go through
// one of these two exports — never re-implement the isCardUnverified() conditional
// inline. That is how a fifth surface ends up rendering a contested value
// confidently by omission (see docs/SEED-CARDS-INTEGRITY.md §7-§8).

const REVERIFY_TITLE = 'Being re-verified — our sources disagree on figures for this card';
const RANK_TITLE = 'This card’s ranking is uncertain — its position is computed from figures being re-verified';

/**
 * Wrap a DISPLAYED value that is, or is computed from, a contested field. When the
 * card is flagged it renders in the estimated-provenance grey (--prov-estimated,
 * the wallet's verified-vs-estimated token — not a third state) with a "· est"
 * marker and a hover reason; otherwise it renders in `baseColor` unchanged. The
 * value is shown, never blanked — a flagged number beats a missing one.
 */
export function EstimatedValue({
  slug,
  field,
  children,
  baseColor,
  mark = true,
  style,
}: {
  slug: string | undefined;
  /**
   * When given, treat the value as estimated only if THIS specific field is
   * contested (isFieldUnverified) — so a card's uncontested cells stay confident.
   * When omitted, any-field uncertainty (isCardUnverified) applies — right for a
   * value COMPUTED from the card (annual value, approval odds, rank).
   */
  field?: string;
  children: React.ReactNode;
  /** Colour used when the card is NOT flagged (the surface's normal value colour). */
  baseColor?: string;
  mark?: boolean;
  style?: React.CSSProperties;
}) {
  const est = field ? isFieldUnverified(slug, field) : isCardUnverified(slug);
  return (
    <span title={est ? REVERIFY_TITLE : undefined} style={{ color: est ? 'var(--prov-estimated)' : baseColor, ...style }}>
      {children}
      {est && mark && <span aria-hidden="true">&nbsp;·&nbsp;est</span>}
    </span>
  );
}

/**
 * Marker for a contested card's ROW in a RANKED list. This is a DIFFERENT claim
 * from EstimatedValue: not "this number is uncertain" but "this row's POSITION is
 * uncertain" — rank is computed from contested inputs and cannot itself be greyed,
 * so the row says so explicitly. Renders nothing when the card is not flagged.
 */
export function UnverifiedRowBadge({ slug, style }: { slug: string | undefined; style?: React.CSSProperties }) {
  if (!isCardUnverified(slug)) return null;
  return (
    <span
      title={RANK_TITLE}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--prov-estimated)',
        border: '1px solid var(--prov-estimated)',
        borderRadius: 999,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
        ...style,
      }}
    >
      being re-verified
    </span>
  );
}
