// lib/data/hdfc-transfer-partners.ts
//
// HDFC Infinia -> loyalty programme transfer ratios.
//
// ── PROVENANCE ─────────────────────────────────────────────────────────────
// Captured 31 Aug 2026 directly from HDFC's own logged-in rewards portal:
//   https://offers.reward360.in/infinia/miles_transfer/partners
// Reached via SmartBuy -> Infinia -> "Turn Points into Airmiles" -> Know More.
//
// This is a PRIMARY source — the issuer's own transfer page, read live, not a
// blog and not an inference. Every ratio and duration below is quoted verbatim
// from that page.
//
// ⚠ CARD SCOPE: this list is the INFINIA portal. Ratios differ by card — the
// Regalia portal does not expose a transfer section at all. Do not apply these
// ratios to another HDFC card without capturing that card's own page.
//
// ⚠ RE-CAPTURE: transfer ratios are repriced without notice (Axis moved EDGE
// from 5:4 to 5:2 in April 2026). Re-read this page before any release that
// leans on these numbers, and update `as_of`.

export interface TransferPartner {
  /** Slug used across the app. Must match programme ids where one exists. */
  id: string;
  /** Name exactly as HDFC's portal writes it. */
  display_name: string;
  /** Destination currency name, as the partner calls it. */
  destination_currency: string;
  /** HDFC points in. Always 1 on this portal. */
  from_points: number;
  /** Destination units out. */
  to_units: number;
  /** Transfer time, quoted verbatim. Null when not stated. */
  duration_text: string | null;
  /** Rough upper bound in hours, for the speculative-transfer warning. */
  duration_hours_max: number | null;
  kind: 'airline' | 'hotel';
}

export const HDFC_INFINIA_SOURCE =
  'https://offers.reward360.in/infinia/miles_transfer/partners';
export const HDFC_INFINIA_AS_OF = '2026-08-31';

export const HDFC_INFINIA_TRANSFER_PARTNERS: TransferPartner[] = [
  // ── 1:1 — the strong ones ────────────────────────────────────────────
  { id: 'krisflyer', display_name: 'KrisFlyer', destination_currency: 'KrisFlyer miles',
    from_points: 1, to_units: 1, duration_text: 'within 5-7 working days',
    duration_hours_max: 168, kind: 'airline' },
  { id: 'spiceclub', display_name: 'SpiceClub', destination_currency: 'SC points',
    from_points: 1, to_units: 1, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'airasia-rewards', display_name: 'AirAsia rewards', destination_currency: 'AirAsia points',
    from_points: 1, to_units: 1, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'finnair-plus', display_name: 'Finnair Plus', destination_currency: 'Avios',
    from_points: 1, to_units: 1, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'flying-blue', display_name: 'Flying Blue', destination_currency: 'Flying Blue Miles',
    from_points: 1, to_units: 1, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'lotusmiles', display_name: 'Lotusmiles Program', destination_currency: 'Miles',
    from_points: 1, to_units: 1, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'ihg-one', display_name: 'IHG One Rewards', destination_currency: 'IHG One Rewards points',
    from_points: 1, to_units: 1, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'hotel' },
  { id: 'radisson-rewards', display_name: 'Radisson Rewards', destination_currency: 'Radisson Rewards Points',
    from_points: 1, to_units: 1, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'hotel' },
  { id: 'wyndham-rewards', display_name: 'Wyndham Rewards', destination_currency: 'Wyndham Rewards Points',
    from_points: 1, to_units: 1, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'hotel' },

  // ── 2:1 — half value ─────────────────────────────────────────────────
  { id: 'accor-all', display_name: 'ALL Accor Loyalty programme', destination_currency: 'ALL Accor Reward points',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'hotel' },
  { id: 'marriott-bonvoy', display_name: 'Marriott Bonvoy', destination_currency: 'Marriott Bonvoy points',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'hotel' },
  { id: 'club-itc', display_name: 'Club ITC', destination_currency: 'Green Points',
    from_points: 1, to_units: 0.5, duration_text: 'within 48 - 96 working hours',
    duration_hours_max: 96, kind: 'hotel' },
  { id: 'air-india-maharaja', display_name: 'Air India Maharaja Club', destination_currency: 'Maharaja Points',
    from_points: 1, to_units: 0.5, duration_text: 'within 48 - 96 working hours',
    duration_hours_max: 96, kind: 'airline' },
  { id: 'qatar-privilege-club', display_name: 'Qatar', destination_currency: 'Avios',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'aeroplan', display_name: 'Aeroplan', destination_currency: 'Aeroplan points',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'avianca-lifemiles', display_name: 'Avianca LifeMiles', destination_currency: 'LifeMiles',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'cathay', display_name: 'Cathay', destination_currency: 'Asia Miles',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'etihad-guest', display_name: 'Etihad Guest', destination_currency: 'Etihad Guest Miles',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'thai-royal-orchid', display_name: "Thai Airways' Royal Orchid Plus", destination_currency: 'Miles',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'british-airways-club', display_name: 'The British Airways Club', destination_currency: 'Avios',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'turkish-miles-smiles', display_name: 'Turkish Airlines Miles&Smiles', destination_currency: 'Miles&Smiles Miles',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
  { id: 'united-mileageplus', display_name: 'United MileagePlus', destination_currency: 'MileagePlus Award Miles',
    from_points: 1, to_units: 0.5, duration_text: 'within 24 hours',
    duration_hours_max: 24, kind: 'airline' },
];

export function partnerFor(programmeId: string): TransferPartner | undefined {
  return HDFC_INFINIA_TRANSFER_PARTNERS.find((p) => p.id === programmeId);
}

/** Ratio in the shape lib/hotels/engine.ts expects, or null if unsourced. */
export function ratioFor(
  programmeId: string,
): { from: number; to: number } | null {
  const p = partnerFor(programmeId);
  return p ? { from: p.from_points, to: p.to_units } : null;
}

/**
 * Transfers are irreversible and take time. Award space can vanish inside the
 * transfer window, so the UI must never recommend transferring before space is
 * confirmed. This supplies the wording.
 */
export function speculativeTransferWarning(programmeId: string): string | null {
  const p = partnerFor(programmeId);
  if (!p) return null;
  return `Transfers to ${p.display_name} take ${p.duration_text ?? 'an unstated time'} and cannot be reversed. Confirm availability before you transfer.`;
}
