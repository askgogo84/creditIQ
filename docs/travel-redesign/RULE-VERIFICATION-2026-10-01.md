# Redemption evidence recheck — 1 October 2026

## Official sources examined

- [Accor membership terms, effective 23 September 2026](https://all.accor.com/a/en/loyalty-program/legal/terms-and-conditions.html), section 10.
- [Accor's HDFC partnership terms](https://all.accor.com/loyalty-program/partners/conditions/hdfc/index.en.shtml).

The membership terms describe a 1,000-point online minimum, 2,000-point multiples above 2,000, and elsewhere an online multiples-of-2,000 rule. This does not resolve the permitted-amount conflict. Online eligibility excludes some taxes; the excluded amounts depend on the booking. At-hotel rules differ and must not be substituted into an online booking. The HDFC partnership source confirms the Infinia 2:1 ratio but does not specify issuer transfer minimums/increments. No logged-in checkout was available in this verification.

## Engineering consequences

Keep the three existing gates open. Do not infer an increment from a ratio, or a booking's eligible taxes from a general programme description. Coverage now exposes captured route mechanics and missing facts separately from the narrow booking calculator. No route inventory is represented as confirmed availability.

## Release evidence required

1. Approved current checkout evidence for permitted amounts and excluded charges, tied to booking channel, rate and property.
2. Issuer minimum/increment evidence for each transfer programme.
3. Authorized provider access and a test environment for search → final quote → approval → booking confirmation → cancellation/failure reconciliation.
4. Signed-in preview verification, complete production build and configured lint.
5. Operational verification of ingestion freshness and Jev success/fallback; source code and configured keys alone are not proof of successful live operation.

The dashboard, feed and coverage work does not execute a booking, transfer, notification or paid provider request. Draft changes must be reviewed and released before they appear on production.
