---
name: transfer-edge-sourcer
description: Evidence-first sourcing of credit card point transfer ratios, partner programmes, and transfer durations for the Indian market. Produces TRANSFER_EDGES rows with a source URL and a checked date for every field. Never invents a ratio, a partner, or a duration. Use when filling or correcting CreditIQ's transfer graph, resolving a conflict between two stored ratios, or adding a new bank currency.
---

# Transfer Edge Sourcer

## Mission

Produce transfer-graph rows that a user can bet money on, with provenance
attached to every number.

A wrong ratio is worse than a missing one. A missing edge shows the user
"no known route" — honest and safe. A wrong edge sends them to transfer
points irreversibly into a programme where the maths does not work.

## Nonnegotiable Rules

1. NEVER invent a ratio, a partner programme, a transfer duration, or a
   minimum transfer increment. If it cannot be found on a primary source,
   the field stays null and the edge is not added.
2. Primary sources only, in this order:
   - The issuer's own rewards/transfer page (HDFC SmartBuy, Axis EDGE,
     Amex MR India, ICICI iMobile rewards, SBI Card rewards)
   - The issuer's published T&C PDF
   - The airline/hotel programme's own partner page
   Blogs, forums, YouTube and aggregator sites are CONTEXT ONLY and may
   never be the sole basis for a stored number.
3. Every stored field carries a source URL and the date checked.
4. Label every claim:
   - VERIFIED: on a primary source, read today
   - PROXY: a strong secondary signal (a programme's partner list implying
     the reverse direction), useful but not storable as a ratio
   - INFERENCE: your reasoned reading of ambiguous source wording
   - UNKNOWN: not found
   Only VERIFIED goes into the graph. PROXY and INFERENCE go in the notes
   column for a human to chase.
5. Ratios are stored as the issuer states them. If the issuer says
   "5 EDGE points = 2 partner miles", store from_units 5 / to_units 2 —
   do NOT pre-divide into 0.4. Rounding hides the increment.
6. Transfer INCREMENTS matter as much as ratios. If a programme only
   transfers in blocks of 1000, a user with 900 points has no route.
   Capture the minimum and the increment or mark them UNKNOWN.
7. Transfer DURATION is a safety field, not a nice-to-have. A 3-day
   transfer against award space that moves in minutes is the single most
   expensive mistake a user can make on this product. If duration is not
   published, store null and say so — never estimate it.
8. Capture DEVALUATION signals: if the source page shows a rate that
   differs from what CreditIQ currently stores, that is a devaluation or
   a stored error. Flag it loudly, do not silently overwrite.
9. Programme slugs must match what the award search actually returns.
   Before storing to_programme, confirm the slug against the live
   seats.aero source values, not against what the graph already uses.
   An edge stored under the wrong slug is invisible at runtime.
10. Never log in to an issuer portal, never use the user's account, never
    take credentials. Public pages and published T&Cs only.

## Phase 1: Scope the run

State which bank currency is being sourced (one per run):
axis-edge, hdfc-rewards, amex-mr-india, icici-rewards, sbi-rewards,
kotak-rewards, indusind-rewards, or another named currency.

List every destination programme the award search can actually return.
Sourcing an edge into a programme the search never surfaces is wasted
work — those go at the bottom of the queue, not the top.

## Phase 2: Find the issuer's transfer page

Search for the issuer's current transfer-partner listing. Record:

- The exact URL
- The page's own "last updated" date if it publishes one
- Whether the page is the live rewards portal or a static marketing page
  (marketing pages go stale — prefer the portal or the T&C PDF)

If the issuer publishes a T&C PDF, read it. Ratios in T&C PDFs are more
reliable than ratios in marketing copy and usually carry an effective date.

## Phase 3: Extract per partner

For each partner programme listed, capture:

| Field | Requirement |
|---|---|
| to_programme | The programme name AND its slug as the award search returns it |
| from_units | Issuer points, as stated |
| to_units | Partner miles/points, as stated |
| minimum_transfer | Smallest permitted transfer, or UNKNOWN |
| increment | Block size, or UNKNOWN |
| duration | Published processing time, or NULL |
| cap | Annual/monthly transfer cap if any, or UNKNOWN |
| card_restriction | Which cards in the family may transfer, if restricted |
| fee | Any transfer fee or GST, or UNKNOWN |
| source_url | Exact page |
| checked_date | Today |
| label | VERIFIED / PROXY / INFERENCE / UNKNOWN |

If a partner appears on the airline's side but not the issuer's, that is
PROXY — record it as a lead, not as an edge.

## Phase 4: Reconcile against what is stored

For every edge sourced, compare against the value currently in the graph.

Report one of:

- MATCH: stored value confirmed, add the source and date
- CONFLICT: stored value differs from the source — state both, state
  which source wins and why, do NOT auto-overwrite
- NEW: no stored edge, safe to add
- STALE: the partner no longer appears on the issuer page at all, which
  may mean the partnership ended — flag for removal, do not delete

A CONFLICT is the most valuable output of this skill. Two stored values
for one edge means one of them has been lying to users.

## Phase 5: Output

### Summary
One line: currency sourced, partners found, edges VERIFIED, conflicts found.

### Conflicts (report first, always)
Each conflict: stored value, sourced value, source URL, date, recommendation.

### Verified edges
A table ready to paste, in the graph's own field order.

### Leads not stored
PROXY and INFERENCE rows, with what would be needed to promote them.

### Slugs observed
Every programme slug seen, flagged where it differs from the graph's
existing vocabulary.

### Sources
Every URL with its checked date.

## Stop conditions

Stop and report what is missing when:

- The issuer page is behind a login
- Two primary sources give different ratios (report both, store neither)
- The programme slug cannot be matched to anything the award search returns
- A ratio is stated only as a marketing claim ("up to 5x value") with no
  numeric conversion

## Indian-market notes

- HDFC SmartBuy transfer rates differ by CARD, not just by currency —
  Infinia, Diners Black and Regalia Gold do not share one rate. Capture
  the card restriction or the edge is wrong for most holders.
- Axis EDGE rates have been repriced more than once; a rate found on a
  blog is very likely stale. Portal or T&C only.
- Amex MR India has a materially different partner list from Amex US.
  Never source an Indian ratio from a US page.
- Post-merger Air India/Vistara programme mapping is unstable. Confirm
  which programme name the award search returns before storing.
- Corporate card points often redeem portal-only at a published paise
  rate — a corporate currency may legitimately have zero transfer edges.
