// lib/transfer-ladder.ts
// The transfer-ladder engine (Phase 2). Given a card currency and a target
// award programme, return every viable transfer path, bounded to 2 hops.
//
// PURE + SYNCHRONOUS: findTransferRoutes takes its edge list as an argument (it
// does NOT import lib/data/transfer-graph). That keeps it unit-testable against
// a fixture and lets callers scope/override the edge set. Production callers
// pass TRANSFER_EDGES from lib/data/transfer-graph.
//
// HONESTY CONTRACT (CreditIQ moat: "We don't guess your money"):
//   - `pointsRequired` is THE payable number and the only truth. `nominalRatio`
//     is DISPLAY-ONLY (the product of hop ratios); a user multiplying
//     milesNeeded by it can get a different figure, so we never treat it as
//     payable and we flag the disagreement (`roundingInflated`).
//   - Duration is load-bearing, not decoration: it decides whether an award
//     seat can survive the transfer. A null hop duration makes the whole route
//     `durationUnknown` — rendered "transfer time unknown — confirm before you
//     transfer", NEVER silently treated as instant.
//   - No edge is trusted above its weakest hop: route `state` is the worst hop
//     state, and `asOf` is the oldest hop date.

export type TransferState = 'verified' | 'unverified' | 'disputed';

/** One transfer edge. Field shape matches docs/05-BACKEND-SCHEMA transfer_partners. */
export interface TransferEdge {
  from_currency: string;            // e.g. 'hdfc_reward_points'
  to_programme: string;             // seats.aero slug or intermediate node id
  ratio_from: number;               // integer — points you send
  ratio_to: number;                 // integer — miles you receive
  min_transfer: number | null;      // minimum transfer increment; null = unknown/none
  duration_days_min: number | null; // null = unknown (NOT instant)
  duration_days_max: number | null;
  bonus_note: string | null;
  state: TransferState;             // provenance; 'unverified' until issuer-confirmed
  source: string;                   // issuer URL, 'internal-estimate:...', etc.
  as_of: string;                    // ISO date YYYY-MM-DD
  // Optional per-card allowlist. When set, this edge applies ONLY to the named
  // SEED_CARDS card(s) — e.g. HDFC reward-points -> KrisFlyer is Infinia +
  // Diners Black only, NOT Regalia Gold. A flat currency edge would misfire the
  // route onto every HDFC card, so we carry the constraint. Matched
  // case/spacing-insensitively. NB: this is one field beyond the deferred SQL
  // table (see docs/05-BACKEND-SCHEMA reconciliation note).
  card_name_allowlist?: string[] | null;
}

/** One resolved hop within a route (edge fields, camelCased for the route view). */
export interface Hop {
  from: string;
  to: string;
  ratio: [number, number];
  minTransfer: number | null;
  durationDaysMin: number | null;
  durationDaysMax: number | null;
  state: TransferState;
  source: string;
  asOf: string;
}

export interface Route {
  hops: Hop[];                        // 1 or 2 (never more)
  nominalRatio: [number, number];     // DISPLAY ONLY — product of hop ratios, reduced
  pointsRequired: number;             // TRUTH — computed backward, min-increment aware
  roundingInflated: boolean;          // pointsRequired > ceil(milesNeeded × nominalRatio)
  minTransferIncrement: number | null;// the binding first-hop increment (what the user sends)
  durationDaysMin: number | null;
  durationDaysMax: number | null;
  durationUnknown: boolean;           // any hop duration null -> total unknown
  state: TransferState;               // worst hop state
  source: string;                     // hop sources, chained
  asOf: string;                       // oldest hop date (most conservative)
}

// ── small pure helpers ─────────────────────────────────────────────────────

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

function reduceRatio(from: number, to: number): [number, number] {
  const g = gcd(from, to);
  return [from / g, to / g];
}

/** Round `x` up to the next multiple of `inc`. Null/≤0 increment => no rounding. */
function roundUpToIncrement(x: number, inc: number | null): number {
  if (!inc || inc <= 0) return x;
  return Math.ceil(x / inc) * inc;
}

const SEVERITY: Record<TransferState, number> = { verified: 0, unverified: 1, disputed: 2 };

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function edgeAppliesToCard(edge: TransferEdge, cardName?: string): boolean {
  if (!edge.card_name_allowlist || edge.card_name_allowlist.length === 0) return true;
  const n = normalize(cardName || '');
  if (!n) return false; // allowlisted edge, no card named -> do NOT guess it applies
  return edge.card_name_allowlist.some((allowed) => normalize(allowed) === n);
}

function edgeToHop(e: TransferEdge): Hop {
  return {
    from: e.from_currency,
    to: e.to_programme,
    ratio: [e.ratio_from, e.ratio_to],
    minTransfer: e.min_transfer,
    durationDaysMin: e.duration_days_min,
    durationDaysMax: e.duration_days_max,
    state: e.state,
    source: e.source,
    asOf: e.as_of,
  };
}

// ── route assembly ──────────────────────────────────────────────────────────

/**
 * Build a Route from an ordered hop chain (source -> ... -> target) and the
 * miles needed at the target. pointsRequired is computed BACKWARD, rounding up
 * to each hop's minimum increment, so it is the real payable figure.
 */
function assembleRoute(hops: Hop[], milesNeeded: number): Route {
  // Backward pass: how many units the first hop must consume.
  let need = milesNeeded; // in the LAST hop's output currency
  for (let i = hops.length - 1; i >= 0; i--) {
    const [rf, rt] = hops[i].ratio;
    const rawInput = Math.ceil((need * rf) / rt);
    need = roundUpToIncrement(rawInput, hops[i].minTransfer);
  }
  const pointsRequired = need;

  // Nominal (display) ratio = product of hop ratios, reduced.
  const prodFrom = hops.reduce((p, h) => p * h.ratio[0], 1);
  const prodTo = hops.reduce((p, h) => p * h.ratio[1], 1);
  const nominalRatio = reduceRatio(prodFrom, prodTo);
  const nominalPoints = Math.ceil((milesNeeded * nominalRatio[0]) / nominalRatio[1]);
  const roundingInflated = pointsRequired > nominalPoints;

  // Duration: only stateable if EVERY hop carries a full range; else unknown.
  const durationUnknown = hops.some(
    (h) => h.durationDaysMin == null || h.durationDaysMax == null,
  );
  const durationDaysMin = durationUnknown
    ? null
    : hops.reduce((s, h) => s + (h.durationDaysMin as number), 0);
  const durationDaysMax = durationUnknown
    ? null
    : hops.reduce((s, h) => s + (h.durationDaysMax as number), 0);

  // Trust = worst hop; freshness = oldest hop.
  const state = hops.reduce<TransferState>(
    (worst, h) => (SEVERITY[h.state] > SEVERITY[worst] ? h.state : worst),
    'verified',
  );
  const asOf = hops.reduce((oldest, h) => (h.asOf < oldest ? h.asOf : oldest), hops[0].asOf);

  return {
    hops,
    nominalRatio,
    pointsRequired,
    roundingInflated,
    minTransferIncrement: hops[0].minTransfer,
    durationDaysMin,
    durationDaysMax,
    durationUnknown,
    state,
    source: hops.map((h) => h.source).join(' → '),
    asOf,
  };
}

// ── the engine ───────────────────────────────────────────────────────────────

/**
 * Every viable path from `fromCurrency` to `toProgramme`, bounded to 2 hops.
 * Sorted by pointsRequired asc, then durationDaysMax asc (null last). Returns
 * [] when nothing is reachable — the caller renders "Not priced · no known
 * route from your cards". Never fabricates a ratio for an unreachable pair.
 *
 * `cardName` (optional) gates card-name-allowlisted edges: without it, an
 * allowlisted edge is excluded rather than assumed to apply.
 */
export function findTransferRoutes(
  edges: TransferEdge[],
  fromCurrency: string,
  toProgramme: string,
  milesNeeded: number,
  opts?: { cardName?: string },
): Route[] {
  if (!(milesNeeded > 0) || !fromCurrency || !toProgramme) return [];
  const cardName = opts?.cardName;

  // Defensive: a zero/negative ratio would divide by zero. The build gate
  // rejects these, but the engine must not crash on a bad edge either.
  const usable = edges.filter(
    (e) =>
      e.ratio_from > 0 &&
      e.ratio_to > 0 &&
      edgeAppliesToCard(e, cardName),
  );

  const routes: Route[] = [];

  // Direct rungs.
  for (const e of usable) {
    if (e.from_currency === fromCurrency && e.to_programme === toProgramme) {
      routes.push(assembleRoute([edgeToHop(e)], milesNeeded));
    }
  }

  // 2-hop rungs: fromCurrency -> intermediate -> toProgramme. Bounded to exactly
  // two — beyond that the combined ratio and duration are never worth it
  // (TRD §3). No cycles through the endpoints.
  for (const e1 of usable) {
    if (e1.from_currency !== fromCurrency) continue;
    if (e1.to_programme === toProgramme) continue;      // that's a direct rung
    if (e1.to_programme === fromCurrency) continue;      // no self-loop
    for (const e2 of usable) {
      if (e2.from_currency !== e1.to_programme) continue;
      if (e2.to_programme !== toProgramme) continue;
      if (e2.from_currency === fromCurrency) continue;   // no cycle back to source
      routes.push(assembleRoute([edgeToHop(e1), edgeToHop(e2)], milesNeeded));
    }
  }

  routes.sort((a, b) => {
    if (a.pointsRequired !== b.pointsRequired) return a.pointsRequired - b.pointsRequired;
    const am = a.durationDaysMax ?? Number.POSITIVE_INFINITY;
    const bm = b.durationDaysMax ?? Number.POSITIVE_INFINITY;
    return am - bm;
  });

  return routes;
}

/**
 * Human duration label for a route. Kept beside the data contract so the exact
 * honesty copy ("transfer time unknown …") is testable, not scattered in JSX.
 */
export function describeDuration(route: Route): string {
  if (route.durationUnknown) return 'transfer time unknown — confirm before you transfer';
  const min = route.durationDaysMin as number;
  const max = route.durationDaysMax as number;
  return min === max ? `${max} days` : `${min}–${max} days`;
}
