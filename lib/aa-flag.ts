// lib/aa-flag.ts
// Account Aggregator (Finvu) kill-switch.
//
// The AA "link a card" flow shipped without ever binding a consent to a real
// user: the client posted a fabricated `user-<timestamp>` id, and every
// /api/aa/* route then ran on the SERVICE ROLE with that attacker-controllable
// user_id. Nothing in the flow is currently wired to a signed-in identity, so
// the entire surface is gated OFF by default until it is rebuilt to derive the
// user from the bearer token (see lib/api-auth.ts).
//
// unset / anything-else = DISABLED. Set AA_ENABLED=true (or 1) to re-enable.
export function aaEnabled(): boolean {
  const v = process.env.AA_ENABLED;
  return v === 'true' || v === '1';
}
