# CreditIQ Metering — Decision Sheet (pricing source-of-truth)

**Locked 3 Aug 2026.** This is the approved input to the six pricing docs (PRD, TRD, App Flow,
UI/UX, Backend Schema, Implementation Plan). Nothing here is implemented yet **except** the
travel-ai rate-limit (shipped standalone — see §Shipped). Do not start the six docs or the meter
implementation until instructed.

---

## Model (locked)

Free tier available at signup. **No paywall before the product.** Meter visible. Paid tiers when
the free allowance runs out.

- Free allowance = **10 GENERAL + 5 FLIGHT searches/day**, plus a **separate CIRA counter** (§B).
- Meter = **daily-cap** built on the existing `rl_hit` counter.
- **Reset = 00:00 IST** (§C).
- **Statement Truth is Pro-only** and never enters the free meter (§1, §C-decision).

---

## Locked decisions

1. **Statement Truth → stays PRO.** Priciest run of all routes (opus + full PDF in context) and the
   clearest paid value. The moat is demonstrated on **marketing (a sample report)**, not given
   per-user. Free users get the ProGate blur + a link to the sample — **no in-app run**.
2. **points-optimizer + optimize → GENERAL pool.** Same 1-`sonnet`-call cost as spend-optimizer;
   the free/Pro split was drift, not design.
3. **`/optimize` → RETIRE** (IA already calls it superseded). Blast radius in §Retire-/optimize.
   **Not done yet** — repoint the link sites first.
4. **FLIGHT = 1 user action, not 1 route.** trip-planner + trip-compare fire together for one
   "plan a trip" action and count as **one** flight search → requires a **shared key**.
5. **travel-ai → metered as FLIGHT.** Its abuse rate-limit is **shipped now** (§Shipped),
   independent of pricing.
6. **Reset = midnight IST**, not rolling 24h (§C).

### A. Meter posture — **FAIL-CLOSED** (decided)
The **product allowance** check fails **closed**: if the allowance cannot be measured, return an
**honest error** — *"couldn't verify your allowance, try again shortly"* — **not** "limit reached."
**Never tell a user they hit a limit we could not measure.** This is deliberately opposite to the
**abuse limiter**, which stays **fail-open** (a limiter outage must not 500 real users; better to
burn some credits than block everyone). Different jobs, different postures:

| Layer | Purpose | On outage | Response when tripped |
|---|---|---|---|
| Abuse limiter (`rateLimit`) | stop credit/quota burn | **fail-open** (allow) | 429 `rate_limited` |
| Product allowance (meter) | enforce free-tier cap | **fail-closed** (honest error, not "limit reached") | 402 `upgrade` when genuinely exhausted; soft error when unmeasurable |

### B. CIRA (assistant) — **own counter** (decided), proposed **30 messages/day**
CIRA is multi-turn and `haiku`-cheap; metering conversation turns against the same pool as a
Spend Optimizer run would make it unusable. It gets its **own daily counter**, separate from the
GENERAL 10.
- **Proposed number: 30 messages/day (free), own counter, reset midnight IST.**
- **Rationale from cost:** `haiku` is the cheapest tier; a genuine Q&A session ≈ 5–15 turns, so
  30/day ≈ two real sessions. 30 haiku calls cost a small fraction of a *single* opus Statement
  Truth run — generous without cost risk. The existing abuse backstop (`assistant` tier: 75/min,
  1000/day) stays above it. Exhaustion → 402 upgrade; Pro lifts/raises the cap.
- **Status: proposed, pending final tier doc.** (Number is the only open value on this decision.)

### C. Reset — **midnight IST** (decided); what it changes about `rl_hit`
`rl_hit(p_key, p_window_seconds, p_limit)` counts per **opaque key**, and **its function body is
NOT in the repo** — it lives only in the live Supabase DB (same pattern as `wa_link_codes`). So the
reset is primarily a **key-construction change, not an `rl_hit` rewrite**:
- Build the meter key with the **IST calendar date**: `user:<id>:general:<YYYY-MM-DD Asia/Kolkata>`
  and `user:<id>:flight:<…>` and `user:<id>:cira:<…>`. A new date-stamped key at 00:00 IST = a
  fresh counter = exact midnight reset, regardless of `rl_hit`'s internal window.
- Keep `p_window_seconds ≥ 86400` only for row cleanup/TTL — the date in the key does the reset.
- **Verify against the live `rl_hit` before shipping:** confirm it counts purely per key and expires
  stale date buckets (if its window is anchored to first-hit rather than a pure per-key counter,
  confirm a fresh key still starts at zero). It is not in the repo, so this is a read-the-live-
  function step.
- The **abuse limits stay rolling** (per-minute/per-day, fail-open, 429). Only the **product meter**
  uses IST-date keys + fail-closed + 402. A metered route therefore has **two layers**.

---

## Every route — class, placement, code change

| Route | Class | Placement | Billable / action | Model | Code change (later) |
|---|---|---|---|---|---|
| statement-truth | GENERAL* | **PRO (unchanged)** | 1 LLM (opus + PDF) | opus | none |
| card-roast | GENERAL | General pool (10/day) | 1 LLM | sonnet | per-route key → shared `general` IST key; 429→402 on free cap |
| card-switch | GENERAL | General pool | 1 LLM | sonnet | same |
| spend-optimizer | GENERAL | General pool | 1 LLM | sonnet | same |
| points-optimizer | GENERAL | General pool | 1 LLM | sonnet | **remove `requirePro`** → general meter gate |
| optimize | GENERAL | **RETIRE** | 1 LLM | sonnet | delete page + `/api/optimize`; repoint link sites (§Retire) |
| assistant (CIRA) | GENERAL | **Own counter (§B)** | 1 LLM/turn | haiku | dedicated `cira` IST key (30/day); not in the general 10 |
| trip-planner | FLIGHT | Flight pool (5/day) | 1 opus + 1–2 seats.aero | opus | shared `flight` IST key — counts once with compare |
| trip-compare | FLIGHT | Flight pool | 1 opus + 1 fare (Travelpayouts, cached) | opus | shared `flight` IST key — same action as planner |
| travel-ai | FLIGHT | Flight pool | 1 haiku + 1 seats.aero | haiku | flight meter later; **abuse limit SHIPPED (§Shipped)** |

\* statement-truth is functionally general but is **Pro-only**, so it never touches the free meter.

**Pool membership:**
- **GENERAL (10/day):** card-roast, card-switch, spend-optimizer, points-optimizer.
- **FLIGHT (5/day):** trip-planner + trip-compare (= 1 action, shared key), travel-ai.
- **CIRA (30/day, own counter):** assistant.
- **PRO-only (no meter):** statement-truth.
- **Retired:** optimize.

**New meter keys (IST-dated):** `user:<id>:general:<istdate>` (10), `user:<id>:flight:<istdate>` (5),
`user:<id>:cira:<istdate>` (30). These are **additive** to the existing per-route abuse keys, not a
replacement.

---

## Shipped (standalone, independent of pricing)

**Mechanic B — travel-ai rate limit.** Branch `fix/travel-ai-ratelimit`, commit `cec08b8a`
(pushed). tsc 0, 41/41 tests pass.
- **Correction to the original premise:** travel-ai is **not** an open route — it already calls
  `requireAuth(req)` (line 132). It requires login. What it lacked was a **rate limit**, so one
  *authenticated* caller could drain the paid seats.aero partner quota uncapped (one availability
  hit per request, no batching). Anonymous callers were already 401'd.
- **Fix:** added a `'travel-ai'` tier to `LIMITS` in `lib/rate-limit.ts` and a `rateLimit(req,
  'travel-ai')` call right after the `requireAuth` gate.
- **Numbers picked and why:** **user 10/min · 120/day; anon 3/min · 30/day.**
  seats.aero is a paid partner API with its own quota, and travel-ai is the most direct drain on it
  (one un-batched availability call per request). The cap sits **well above** the eventual 5/day
  free FLIGHT product meter, so no legitimate free user ever reaches it — it exists only to stop a
  compromised/looping authenticated account. 10/min halts burst loops while letting a Pro user
  explore many date/route combinations interactively; 120/day is a generous ceiling below the trip
  family's 200/day because this route is a raw award-API passthrough, not a batched trip plan. The
  anon tier is a **type-required formality** (`requireAuth` 401s anon before `rateLimit` runs); kept
  conservative for defense-in-depth if that ordering ever changes.
- **Layer:** this is the **abuse ceiling** (fail-open, 429), NOT the pricing meter. The FLIGHT
  product allowance (fail-closed, 402) sits below it and comes with the meter rollout.

---

## Retire `/optimize` — verify-first, then repoint, THEN delete (NOT done)

Leaf route; nothing imports its logic. **10 references** must be repointed before deletion. Target =
`/points-optimizer` (the Footer already *labels* `/optimize` "Points Optimizer").

| Site | Type | Action |
|---|---|---|
| `app/upload-statement/page.tsx:373` | user Link `?bank=&points=` | repoint → `/points-optimizer` |
| `app/sms-import/page.tsx:252` | user Link `?points=` | repoint |
| `components/Features.tsx:36` | feature-card href | repoint or remove card |
| `components/Hero.tsx:75` | hero CTA | repoint |
| `components/Footer.tsx:28` | footer link ("Points Optimizer") | repoint |
| `app/api/alerts/send/route.ts:85` | **devaluation alert EMAIL CTA** (`https://creditiq.app/optimize`) | **repoint — else every alert email 404s** |
| `middleware.ts:26,93,94` | gated-route matcher | remove 3 entries |
| `components/design/TopNav.tsx:12` | active-state matcher | remove token |
| `components/ciq/appNav.tsx:54,57,97` | section-tab matcher + comments | remove token |
| `app/(shell)/optimize/page.tsx` + `app/api/optimize/route.ts` | the route itself | delete |

### ⚠ VERIFY BEFORE RETIRING (do not do now — noted per instruction)
`/optimize` accepts **`?bank=` AND `?points=`**. **Confirm `/points-optimizer` consumes BOTH**
before repointing the `upload-statement` and `sms-import` hand-offs — or the statement and SMS
flows will **silently drop the bank** (they pass `?bank=...&points=...`; if the target reads only
`points`, the bank is lost with no error). This check is a prerequisite of decision 3; the retire
is blocked on it.

---

## Open values still needed before the six docs

- **B — CIRA number:** proposed 30/day; confirm or adjust.
- Everything else on decisions A/C is settled; the docs turn these into schema + flows + copy.

---

## Cross-refs
- Metered-action cost map + gating evidence: this sheet's route table (derived from `lib/rate-limit.ts`,
  `lib/pro.ts`, `lib/api-auth.ts`, and each `app/api/*/route.ts`).
- `rl_hit` / `rate_limits` live-only note: same class as the schema-drift finding in
  `docs/DELETE-ACCOUNT-VERIFICATION.md` (repo is not the source of truth for the DB).
