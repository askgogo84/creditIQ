// lib/affiliate.ts
// Affiliate link registry for CreditIQ
// Source: EarnKaro — ₹300–₹1500 commission per card activation
// Last updated: 21 May 2026

const AFFILIATE_LINKS: Record<string, string> = {
  // ── HDFC Bank ─────────────────────────────────────────────────────────────
  "hdfc-regalia":              "https://bitli.in/s7cak4c",
  "hdfc-millenia":             "https://bitli.in/s7cak4c",
  "hdfc-diners-black":         "https://bitli.in/s7cak4c",
  "hdfc-infinia":              "https://bitli.in/s7cak4c",
  "hdfc-tata-neu-plus":        "https://bitli.in/s7cak4c",
  "hdfc-tata-neu-infinity":    "https://bitli.in/s7cak4c",
  "hdfc-swiggy":               "https://bitli.in/s7cak4c",
  "hdfc-moneyback-plus":       "https://bitli.in/s7cak4c",
  "hdfc-freedom":              "https://bitli.in/s7cak4c",

  // ── Axis Bank ─────────────────────────────────────────────────────────────
  "axis-magnus":               "https://bitli.in/MQ6vAYP",
  "axis-privilege":            "https://bitli.in/9gTv08q",
  "axis-flipkart":             "https://bitli.in/g5ysb7D",
  "axis-myzone-rupay":         "https://bitli.in/SnZhI47",
  "axis-indian-oil-rupay":     "https://bitli.in/hP4bgF8",
  "axis-airtel-rupay":         "https://bitli.in/Ub0HNdT",
  "axis-lic-signature":        "https://bitli.in/2wZCcR2",
  "axis-lic-platinum":         "https://bitli.in/5hcq2lD",
  "axis-ace":                  "https://bitli.in/MQ6vAYP",
  "axis-vistara":              "https://bitli.in/MQ6vAYP",

  // ── SBI Card ──────────────────────────────────────────────────────────────
  "sbi-cashback":              "https://bitli.in/KCBtYhM",
  "sbi-simplysave":            "https://bitli.in/KCBtYhM",
  "sbi-simplyclick":           "https://bitli.in/KCBtYhM",
  "sbi-elite":                 "https://bitli.in/KCBtYhM",
  "sbi-pulse":                 "https://bitli.in/KCBtYhM",
  "sbi-bpcl-octane":           "https://bitli.in/KCBtYhM",
  "sbi-club-vistara-prime":    "https://bitli.in/KCBtYhM",
  "sbi-prime":                 "https://bitli.in/KCBtYhM",

  // ── IDFC First Bank ───────────────────────────────────────────────────────
  "idfc-first":                "https://bitli.in/aii7dpF",
  "idfc-first-power":          "https://bitli.in/LsE5x76",
  "idfc-first-power-plus":     "https://bitli.in/k1ZzS7w",
  "idfc-first-swyp":           "https://bitli.in/ugti2xb",
  "idfc-first-wow":            "https://bitli.in/ZSRj8n1",
  "idfc-first-mayura":         "https://bitli.in/33BjhFs",
  "idfc-first-ashva":          "https://bitli.in/b9uTD4M",
  "idfc-first-wealth":         "https://bitli.in/aii7dpF",

  // ── AU Small Finance Bank ─────────────────────────────────────────────────
  "au-lit":                    "https://bitli.in/Z27qj7I",
  "au-altura":                 "https://bitli.in/Z27qj7I",
  "au-altura-plus":            "https://bitli.in/Z27qj7I",
  "au-zenith":                 "https://bitli.in/Z27qj7I",
  "au-zenith-plus":            "https://bitli.in/Z27qj7I",
  "au-vetta":                  "https://bitli.in/Z27qj7I",

  // ── Scapia ────────────────────────────────────────────────────────────────
  "scapia":                    "https://bitli.in/VO2npLG",

  // ── Kiwi ──────────────────────────────────────────────────────────────────
  "kiwi-upi":                  "https://bitli.in/U44UnpR",

  // ── NOMO ──────────────────────────────────────────────────────────────────
  "nomo":                      "https://bitli.in/P633SQj",

  // ── Tiger / Legend / Platinum / Aura Edge ────────────────────────────────
  "tiger-credit-card":         "https://bitli.in/dhbkHA6",
  "legend-credit-card":        "https://bitli.in/XV9120H",
  "platinum-credit-card":      "https://bitli.in/mU83w2n",
  "platinum-aura-edge":        "https://bitli.in/wobysVJ",

  // ── No EarnKaro link — fallback to direct bank pages ─────────────────────
  "icici-amazon-pay":          "https://www.icicibank.com/card/credit-cards/amazon-pay-credit-card",
  "icici-emeralde":            "https://www.icicibank.com/card/credit-cards",
  "icici-rubyx":               "https://www.icicibank.com/card/credit-cards",
  "icici-sapphiro":            "https://www.icicibank.com/card/credit-cards",
  "icici-coral":               "https://www.icicibank.com/card/credit-cards",
  "icici-mmt-signature":       "https://www.icicibank.com/card/credit-cards",
  "amex-platinum-travel":      "https://www.americanexpress.com/in/credit-cards/",
  "amex-gold":                 "https://www.americanexpress.com/in/credit-cards/",
  "amex-membership-rewards":   "https://www.americanexpress.com/in/credit-cards/",
  "kotak-811":                 "https://www.kotak.com/en/personal-banking/cards/credit-cards.html",
  "kotak-white":               "https://www.kotak.com/en/personal-banking/cards/credit-cards.html",
  "kotak-royale-signature":    "https://www.kotak.com/en/personal-banking/cards/credit-cards.html",
  "yes-first-exclusive":       "https://www.yesbank.in/personal-banking/yes-individual/loans-and-cards/credit-card",
  "yes-first-preferred":       "https://www.yesbank.in/personal-banking/yes-individual/loans-and-cards/credit-card",
  "rbl-shoprite":              "https://www.rblbank.com/credit-cards",
  "rbl-world-safari":          "https://www.rblbank.com/credit-cards",
};

const DEFAULT_AFFILIATE_URL = "https://www.paisabazaar.com/credit-card/";

/**
 * Primary function — returns plain affiliate URL string.
 */
export function getAffiliateUrl(cardId: string): string {
  const normalized = cardId.toLowerCase().replace(/\s+/g, "-");
  return AFFILIATE_LINKS[normalized] ?? DEFAULT_AFFILIATE_URL;
}

/**
 * Used by app/api/apply/[cardId]/route.ts and components/CardTile.tsx
 * Accepts a card ID string or card object, returns { url, type }.
 */
export function getApplyUrl(
  cardId: string | Record<string, unknown>
): { url: string; type: "affiliate" | "direct" } {
  const id =
    typeof cardId === "string"
      ? cardId
      : String(cardId?.id ?? cardId?.slug ?? cardId?.name ?? "");
  const normalized = id.toLowerCase().replace(/\s+/g, "-");
  const url = AFFILIATE_LINKS[normalized] ?? DEFAULT_AFFILIATE_URL;
  const type: "affiliate" | "direct" = url.includes("bitli.in")
    ? "affiliate"
    : "direct";
  return { url, type };
}

/**
 * Returns true if we have a tracked EarnKaro affiliate link for this card.
 */
export function hasTrackedLink(cardId: string): boolean {
  const normalized = cardId.toLowerCase().replace(/\s+/g, "-");
  const url = AFFILIATE_LINKS[normalized];
  return !!url && url.includes("bitli.in");
}

/**
 * Returns all card IDs that have tracked EarnKaro affiliate links.
 */
export function getTrackedCardIds(): string[] {
  return Object.entries(AFFILIATE_LINKS)
    .filter(([, url]) => url.includes("bitli.in"))
    .map(([id]) => id);
}
