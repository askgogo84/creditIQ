// Cards whose LIVE SEED_CARDS values conflict, on a fact a user acts on (fee,
// reward type, tier, or base rate), with an unverified alternate source (the dead
// NEW_CARDS block) — and which have NOT been re-checked against a bank source.
// See docs/SEED-CARDS-INTEGRITY.md §7.
//
// We surface these as "being re-verified" in the UI rather than show a confident
// number we're not sure of ("we don't guess your money" extends to card terms).
// Remove a slug the moment its live values are verified against the issuer's MITC.
export const UNVERIFIED_CARDS: ReadonlySet<string> = new Set<string>([
  'rbl-shoprite',      // live fee ₹500 / reward-points vs source ₹0 LTF / cashback
  'yes-marquee',       // live 0% forex / super-premium vs source 1.75% / premium
  'au-altura-plus',    // live cashback / entry vs source reward-points / mid
  'icici-sapphiro',    // live base 2% vs source 1%
]);

export function isCardUnverified(slug: string | undefined): boolean {
  return !!slug && UNVERIFIED_CARDS.has(slug);
}
