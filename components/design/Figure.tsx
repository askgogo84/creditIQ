import type { CSSProperties } from 'react';

// <Figure> — the provenance primitive (5-TRD.md §2). Every figure in the product
// renders through this; nothing else styles a number. It is the single enforcement
// point for the honesty model, so a developer cannot render an estimate in
// verified green.
//
// Contract:
//   • numeral in JetBrains Mono, tabular figures (aligns in tables/columns)
//   • ALWAYS a text label alongside — colour is never the only signal
//     (accessibility + honesty). The label is a filled PILL (chip) in the
//     provenance colour; the numeral stays neutral so cached prices don't turn
//     gold, etc. The pill is the SINGLE treatment — no per-surface variant prop,
//     so provenance looks identical everywhere (one primitive, one meaning).
//   • colours come ONLY from the --prov-* tokens (Phase-1 = current rendered
//     values); the pill's fill/border derive from that one token via color-mix.

export type Provenance = 'verified' | 'cached' | 'estimated';
export type FigureUnit = 'inr' | 'pts' | 'miles';

type FigureBase = {
  /** number → formatted per unit; string → rendered verbatim (e.g. an estimated range) */
  value: number | string;
  unit: FigureUnit;
  className?: string;
  style?: CSSProperties;
  /** optional override for the numeral colour; defaults to inherit (neutral) */
  valueColor?: string;
};

// asOf is REQUIRED for cached (TRD §2), optional for the others.
export type FigureProps =
  | (FigureBase & { provenance: 'cached'; asOf: string | number | Date })
  | (FigureBase & { provenance: 'verified' | 'estimated'; asOf?: string | number | Date });

const PROVENANCE: Record<Provenance, { label: string; token: string }> = {
  verified: { label: 'Verified', token: 'var(--prov-verified)' },
  cached: { label: 'Cached', token: 'var(--prov-cached)' },
  estimated: { label: 'Estimated', token: 'var(--prov-estimated)' },
};

function formatValue(value: number | string, unit: FigureUnit): string {
  if (typeof value === 'string') return value;
  const n = value.toLocaleString('en-IN');
  switch (unit) {
    case 'inr':
      return `Rs.${n}`;
    case 'pts':
      return `${n} pts`;
    case 'miles':
      return `${n} miles`;
  }
}

function relTime(input: string | number | Date): string {
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const MONO = 'var(--font-jbmono), ui-monospace, monospace';

export function Figure(props: FigureProps) {
  const { value, unit, provenance, className, style, valueColor } = props;
  const meta = PROVENANCE[provenance];
  const formatted = formatValue(value, unit);
  const asOf = 'asOf' in props ? props.asOf : undefined;
  const rel = asOf != null && asOf !== '' ? relTime(asOf) : '';
  const label = rel ? `${meta.label} · updated ${rel}` : meta.label;

  return (
    <span
      className={className}
      role="group"
      aria-label={`${formatted}, ${label}`}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'inherit', ...style }}
    >
      <span
        aria-hidden="true"
        style={{
          fontFamily: MONO,
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: '"tnum" 1',
          color: valueColor ?? 'inherit',
        }}
      >
        {formatted}
      </span>
      <span
        aria-hidden="true"
        data-provenance={provenance}
        style={{
          display: 'inline-block',
          width: 'fit-content',
          marginTop: 4,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color: meta.token,
          background: `color-mix(in srgb, ${meta.token} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${meta.token} 30%, transparent)`,
          padding: '2px 8px',
          borderRadius: 100,
        }}
      >
        {label}
      </span>
    </span>
  );
}
