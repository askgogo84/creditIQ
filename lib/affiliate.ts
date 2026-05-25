// lib/affiliate.ts
// Affiliate link registry for CreditIQ
// Source: EarnKaro  --  Rs.300 - Rs.1500 commission per card activation
// Last updated: 21 May 2026

const AFFILIATE_LINKS: Record<string, string> = {
  "hdfc-regalia":              "https://bitli.in/s7cak4c",
  "hdfc-millenia":             "https://bitli.in/s7cak4c",
  "hdfc-diners-black":         "https://bitli.in/s7cak4c",
  "hdfc-infinia":              "https://bitli.in/s7cak4c",
  "hdfc-tata-neu-plus":        "https://bitli.in/s7cak4c",
  "hdfc-tata-neu-infinity":    "https://bitli.in/s7cak4c",
  "hdfc-swiggy":               "https://bitli.in/s7cak4c",
  "hdfc-moneyback-plus":       "https://bitli.in/s7cak4c",
  "hdfc-freedom":              "https://bitli.in/s7cak4c",
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
  "sbi-cashback":              "https://bitli.in/KCBtYhM",
  "sbi-simplysave":            "https://bitli.in/KCBtYhM",
  "sbi-simplyclick":           "https://bitli.in/KCBtYhM",
  "sbi-elite":                 "https://bitli.in/KCBtYhM",
  "sbi-pulse":                 "https://bitli.in/KCBtYhM",
  "sbi-bpcl-octane":           "https://bitli.in/KCBtYhM",
  "sbi-club-vistara-prime":    "https://bitli.in/KCBtYhM",
  "sbi-prime":                 "https://bitli.in/KCBtYhM",
  "idfc-first":                "https://bitli.in/aii7dpF",
  "idfc-first-power":          "https://bitli.in/LsE5x76",
  "idfc-first-power-plus":     "https://bitli.in/k1ZzS7w",
  "idfc-first-swyp":           "https://bitli.in/ugti2xb",
  "idfc-first-wow":            "https://bitli.in/ZSRj8n1",
  "idfc-first-mayura":         "https://bitli.in/33BjhFs",
  "idfc-first-ashva":          "https://bitli.in/b9uTD4M",
  "idfc-first-wealth":         "https://bitli.in/aii7dpF",
  "au-lit":                    "https://bitli.in/Z27qj7I",
  "au-altura":                 "https://bitli.in/Z27qj7I",
  "au-altura-plus":            "https://bitli.in/Z27qj7I",
  "au-zenith":                 "https://bitli.in/Z27qj7I",
  "au-zenith-plus":            "https://bitli.in/Z27qj7I",
  "au-vetta":                  "https://bitli.in/Z27qj7I",
  "scapia":                    "https://bitli.in/VO2npLG",
  "kiwi-upi":                  "https://bitli.in/U44UnpR",
  "nomo":                      "https://bitli.in/P633SQj",
  "tiger-credit-card":         "https://bitli.in/dhbkHA6",
  "legend-credit-card":        "https://bitli.in/XV9120H",
  "platinum-credit-card":      "https://bitli.in/mU83w2n",
  "platinum-aura-edge":        "https://bitli.in/wobysVJ",
  "icici-amazon-pay":          "https://www.icicibank.com/card/credit-cards/amazon-pay-credit-card",
  "icici-emeralde":            "https://www.icicibank.com/card/credit-cards",
  "icici-rubyx":               "https://www.icicibank.com/card/credit-cards",
  "icici-sapphiro":            "https://www.icicibank.com/card/credit-cards",
  "icici-coral":               "https://www.icicibank.com/card/credit-cards",
  "icici-mmt-signature":       "https://www.icicibank.com/card/credit-cards",
  "amex-platinum-travel":      "https://www.americanexpress.com/in/credit-cards/",
  "amex-gold":                 "https://www.americanexpress.com/in/credit-cards/",
  "amex-membership-rewards":   "https://www.americanexpress.com/in/credit-cards/",
  "kotak-811":                   "https://bitli.in/glzF0Ff",
  "kotak-white":                 "https://bitli.in/glzF0Ff",
  "kotak-royale-signature":      "https://bitli.in/glzF0Ff",
  "yes-first-exclusive":         "https://bitli.in/pe8xoQG",
  "yes-first-preferred":         "https://bitli.in/pe8xoQG",
  "rbl-shoprite":                "https://bitli.in/cnFgfO8",
  "rbl-world-safari":            "https://bitli.in/cnFgfO8",
};


  //  Travel Bookings (EarnKaro affiliate) 
  "mmt-hotels":                "https://bitli.in/VrZOzeR",
  "mmt-flights":               "https://bitli.in/cv7BwVU",
  "booking-com":               "https://bitli.in/xc9tvmd",
  "kayak-flights":             "https://bitli.in/Pb5juMv",

const DEFAULT_AFFILIATE_URL = "https://www.paisabazaar.com/credit-card/";

export function getAffiliateUrl(cardId: string): string {
  const normalized = cardId.toLowerCase().replace(/\s+/g, "-");
  return AFFILIATE_LINKS[normalized] ?? DEFAULT_AFFILIATE_URL;
}

export function getApplyUrl(cardId: unknown): { url: string; type: "affiliate" | "direct" | "paisabazaar"; label: string } {
  const id = typeof cardId === "string"
    ? cardId
    : String((cardId as Record<string, unknown>)?.id ?? (cardId as Record<string, unknown>)?.slug ?? (cardId as Record<string, unknown>)?.name ?? "");
  const normalized = id.toLowerCase().replace(/\s+/g, "-");
  const url = AFFILIATE_LINKS[normalized] ?? DEFAULT_AFFILIATE_URL;
  const type: "affiliate" | "direct" | "paisabazaar" = url.includes("bitli.in") ? "affiliate" : "direct";
  const label = type === "affiliate" ? "Apply & Earn" : "Apply Now";
  return { url, type, label };
}

export function hasTrackedLink(cardId: string): boolean {
  const normalized = cardId.toLowerCase().replace(/\s+/g, "-");
  const url = AFFILIATE_LINKS[normalized];
  return !!url && url.includes("bitli.in");
}

export function getTrackedCardIds(): string[] {
  return Object.entries(AFFILIATE_LINKS)
    .filter(([, url]) => url.includes("bitli.in"))
    .map(([id]) => id);
}



// Travel booking affiliate helpers
export function getMmtHotelsUrl(destination: string): string {
  return "https://bitli.in/VrZOzeR";
}

export function getMmtFlightsUrl(destination: string): string {
  return "https://bitli.in/cv7BwVU";
}

export function getBookingUrl(destination: string): string {
  return "https://bitli.in/xc9tvmd";
}

export function getKayakUrl(destination: string): string {
  return "https://bitli.in/Pb5juMv";
}
