# CreditIQ — Signed-In Information Architecture

**Written 1 Aug 2026. This is doc 0. The six build docs for each surface come from this.**

Read alongside `docs/dashboard-data-audit.md` — that file says what can actually be computed. Nothing in here overrides it.

---

## 1. The spine

Realise is a **reward optimizer**. You tell it a spend, it tells you a card.

CreditIQ is that plus two things Realise cannot do:

1. **Verified numbers.** Upload a statement and the estimate becomes fact. Realise has no verification path — every number they show is modelled.
2. **It lives in your WhatsApp.** Ask it anything, from anywhere, no app open. Realise's equivalent — "Realise Concierge" — is a **COMING SOON card that does nothing**. Ours works today and has been tested end to end.

Everything in this document serves that spine. Where a design choice trades away either one, it loses.

---

## 2. Surface map — six destinations, down from twenty-six

The current sidebar has ~6 primary items plus ~20 grouped links, with Travel AI and Lounge Tracker each appearing twice. Realise ships six items total. Six is the target.

| Surface | Answers | Signed-out? |
|---|---|---|
| **Home** | "What should I do next?" | No |
| **Wallet** | "What do I hold, and what's it worth?" | No |
| **Spend** | "Which card for this purchase?" | Demo only |
| **Travel** | "Where can my points take me?" | Demo only |
| **Cards** | "What else is out there?" | Yes — crawlable |
| **You** | "My account, my WhatsApp, my plan" | No |

**One rule governs the split:** if a number appears on two surfaces, one of them is wrong. Wallet owns holdings. Home owns what changed and what you kept. Nothing restates the other.

---

## 3. Where the other twenty go

| Today | Becomes |
|---|---|
| Feed | The "what changed" column on **Home** |
| Devaluation Tracker | A feed category on **Home** |
| Sweet Spots | A tab inside **Travel** |
| Transfer Partners | A tab inside **Travel** |
| Trip Planner | A mode inside **Travel** |
| Lounge Tracker | A tab inside **Travel** |
| Travel AI | **Travel**'s search itself — not a separate tool |
| Spend Optimizer | **Spend** — it *is* the surface |
| Points Optimizer | A mode inside **Spend** |
| Statement Truth | Inside **Wallet** — it's how verification happens |
| Switch Wizard | Inside **Cards**, off a comparison |
| Card Roast | An entry card on **Home**; also a WhatsApp intent |
| All Cards / Compare | **Cards** |
| Best Travel / Best Cashback | Filters on **Cards**, not destinations |
| UAE Cards | A market filter on **Cards** |
| Blog / Glossary / Home (marketing) | Footer and public site. Not signed-in nav. |

Nothing is deleted. Seventeen things stop being *destinations* and become tabs, filters, modes, or entry points on the six that remain.

---

## 3a. In-page navigation map — *how* folded features are reached

§3 says *where* each feature goes; this says *how a user gets to it*. When a feature stops being a top-level nav item it must gain an in-page entry point on its destination, or it is orphaned (reachable only by typing a URL) — which is strictly worse than the long sidebar. Each destination therefore carries a **section tab bar** rendered inside the shell (`components/ciq/SectionTabs.tsx`, fed by `SECTION_TABS` in `appNav.tsx`).

**The shell rule (hard):** a section tab may only point at a **shell-native route** (under `app/(shell)/`). A tab that lands on a page rendering its own marketing `<Header>` drops the user out of the app shell — no rail, no tab bar, no way back. That strands people; a stranding tab is worse than no tab. Such routes stay reachable by URL and are tracked as orphans until a rebuild migrates them into `(shell)`.

| Destination | Section tabs (all shell-native) | Reached in-page but not a tab | Orphaned — URL only (until rebuild) |
|---|---|---|---|
| **Wallet** (`/dashboard`) | Your cards `/dashboard` · Statement Truth `/statement-truth` | — | `/my-cards` (legacy dup), `/feed` + `/intelligence` (Home-bound, Home deferred) |
| **Spend** (`/spend-optimizer`) | Spend Optimizer `/spend-optimizer` · Points Optimizer `/points-optimizer` | — | `/optimize` (superseded redemption tool), `/smart-match` (renders own Header) |
| **Travel** (`/trip-planner`) | Trip Planner `/trip-planner` · Ask AI `/travel` · Sweet Spots `/sweet-spots` · Transfer Partners `/transfer-partners` · Lounges `/lounge-tracker` | — | `/flights` (renders own Header) |
| **Cards** (`/cards`) | All Cards `/cards` · Compare `/compare` · Switch Wizard `/card-switch` · Card Roast `/card-roast` | Best Travel / Best Cashback = existing category chips on `/cards` (in-shell) | `/best-cards/travel`, `/best-cards/cashback`, `/uae` (all render own Header) |
| **You** (`/profile`) | Profile `/profile` · Plan & searches `/pro` · WhatsApp `/profile#whatsapp` (in-page anchor) | — | — |

The orphan column is the debt the per-surface rebuilds pay down: migrating those pages into `(shell)` lets them become real tabs. Until then they must not be linked from a tab, only left reachable.

---

## 4. Surface by surface

### Home

The first thing after login. Three bands, in order:

**Band 1 — Greeting + wallet summary.** Name, and the honest headline: total **points** across cards, with rupee value as a labelled `≈ ₹low–₹high` estimate range. Verified and estimated split shown, never summed into one confident figure.

> **Not shipping:** an optimisation rate. The data audit could not compute one. Realise displays "+12.4%" for a user with zero cards and zero points — a number that cannot exist. We do not copy it. Where they have a fake metric, we have a real range.

**Band 2 — Saved Searches.** Empty until the user saves one. Each card carries: what was searched, the winning card, points, value, and — the important part — **the channel to actually transact through**, as a chip with an outbound link. Re-run, dismiss, expand.

This is the section that earns Home its existence. It is also the section that makes the search quota humane: a saved answer can be revisited without spending another search.

**Band 3 — Tools + what changed.** Entry cards for Spend, Travel, and **CreditIQ on WhatsApp**. Alongside, the feed: devaluations, sweet spots filtered to the user's own transfer partners, fare movements.

**The WhatsApp card is the hero of this band.** Realise's dashboard has a Concierge card stamped COMING SOON that has been coming soon for months. Ours says *Connected* or *Connect in 30 seconds*, and it works.

---

### Wallet

Deliberately sparse. It owns holdings and nothing else.

- Cards, each with bank, last 4, points balance, and a **Verified** or **Estimated** chip — never conflated
- Add a card: searchable catalogue, no card numbers, ever
- Upload a statement → the card goes green
- One line explaining what verified means

**Not on Wallet:** best-move recommendations, tool cards, trending carousels. Those live on Home. The wallet's job is to be the truthful ledger everything else reads from.

The tabs question: the wallet does not need tabs. It feels empty today because it is carrying the gauge, the best move, and the card list at once while the actual tools sit in a sidebar directory. Move those out and the wallet is correct at its current size.

---

### Spend

Category pills → optional merchant → amount → **Optimize**.

Ranked results, each row: card art, rupee value, sub-range, a **Not in wallet** chip where relevant, an expand for the channel breakdown, and — where it exists — the specific channel to transact through.

Controls: **Only my cards** toggle, **Save to Home**, thumbs-down for a bad recommendation.

Signed out, this runs on sample input. Signed in, the bank and card pickers disappear — it already knows. *That is the entire signed-in upgrade: the questions go away.*

---

### Travel

From / to / date / cabin / range → progressive search that shows which programme is being queried and how far along it is.

Results table: date, programme, route, duration, points required + tax, miles by cabin, **and the card that transfers there named beneath each row**.

Filters: cabin, stops, programme, taxes, duration. **All cards / My cards** toggle. Bookmark to save to Home.

Tabs within: Flights · Sweet Spots · Transfer Partners · Lounges.

The wallet visibly powers this. With cards added, the count reads *"bookable with your cards"* — which is the best argument for adding cards that exists anywhere in the product, and it costs nothing to make.

---

### Cards

The public catalogue. Crawlable, signed-out, SEO-bearing.

Browse, filter by bank / category / market, compare, card detail. Switch Wizard hangs off a comparison. Best-of lists are filters, not pages.

Signed in, one thing changes: **In your wallet** badges, and *Add to wallet* on everything else.

---

### You

Profile, plan and remaining searches, statement upload history, theme, sign out.

**And the WhatsApp connect flow** — generate a 6-digit code, deep-link into the chat, done. This is also surfaced on Home; here is where it's managed.

---

## 5. WhatsApp — the thing to lead with

This is the strongest differentiator in the product and it is currently buried on a profile page.

**Where it appears:**

1. **Home** — a live tool card, not a coming-soon placeholder
2. **After the first card is added** — "Now ask CreditIQ about it from WhatsApp" is the natural next action, and the moment the value is obvious
3. **The tour** — one dedicated step, on Home
4. **You** — where the link is managed and can be revoked

**What it must say honestly:** it answers questions about the cards you hold, using your real balances. Where those balances are self-reported rather than statement-verified, the answer says so.

> **Blocking issue, from the AskGogo notes:** the structured handlers respect the verified/estimated distinction; the LLM fallback paths do not, and have already treated a self-reported balance as spendable fact. **Fix that before driving users into WhatsApp at scale.** Promoting the channel harder without it scales an honesty leak, and the honesty is the moat.

---

## 6. Tours

One component, already built and verified on `design/tours`. Rules:

- **Per surface, on first visit to that surface.** Not all at once. A user who meets four tours in five minutes dismisses all four.
- Tracked individually, so a returning user doesn't re-see a tour they finished.
- Always skippable, always dismissable, never blocking.

**Proposed counts** (Realise's, for reference: Dashboard 5, Wallet 2, Spend Smart 6, Fly on Points 5):

| Surface | Steps | Must cover |
|---|---|---|
| Home | 4 | The points headline, verified vs estimated, saved searches, **WhatsApp** |
| Wallet | 2 | Add a card, what verification buys you |
| Spend | 3 | Pick a spend, read the ranking, save it |
| Travel | 3 | Search, "bookable with your cards", save it |

Fewer than Realise everywhere. Their six-step Spend Smart tour is longer than the task it explains.

**Two fixes to the existing steps:** "Your wallet total" is a vague title where every other step names a visible thing. And the final step of a tour should *do* the thing — the last button on the Wallet tour should open Add Card, not say Done.

---

## 7. Where we beat Realise

| | Realise | CreditIQ |
|---|---|---|
| AI assistant | COMING SOON card | **Live on WhatsApp today** |
| Number honesty | Modelled values shown flat; a fabricated optimisation rate | Verified vs estimated, never conflated; nothing uncomputable ships |
| Verification | None | Statement upload turns estimate into fact |
| Catalogue | Cards behind login | Public, crawlable, SEO-bearing |
| Empty state | Dashboard shows 0 pts and +12.4% | Empty state that says what to do |

The gap to close is purely layout discipline. Six destinations, clean white surfaces, and every screen explaining itself. That is a week of work, not a quarter.

---

## 8. Constraints that bind every build doc

1. **Nothing invented ships.** Every figure from `SEED_CARDS`, the engine, cached fares, or a verified statement. If it cannot be computed, drop the element — not the honesty.
2. **One number, one meaning.** Two surfaces showing the same thing read from one source.
3. **Points first, rupees as a labelled range.** Estimates never wear verified-green.
4. **White / realise-clean.** The gold `[data-ciq]` system is retired; the five gold surfaces migrate. **CLAUDE.md still says the opposite and must be updated before any build session** — otherwise every agent will helpfully migrate things back toward gold.
5. **375px is primary.** Tested on a real phone, address bar visible.
6. **Tours are additive.** No surface may depend on its tour to be understandable.
7. **Cutting a destination from the nav requires building its replacement entry point in the same change.** Removing a nav item without giving its features a new home (a tab, filter, mode, or entry card that actually links to them) orphans those pages — reachable only by URL — which is worse than the nav you cut. The route resolving is not enough; a human must be able to *click* to it. This rule would have caught the orphaning that §3a's section tabs now fix.

---

## 9. Open

- **Pricing.** Search-quota, one-time, not subscription — decided in principle, written last, once the flow is settled. Where the meter is shown (Home? You? both?) is a design question this doc doesn't answer.
- **Does a saved search re-run for free?** It should — it's the humane half of a quota model — but it needs a rule.
- **Sidebar analytics.** The cut above is judgement, not data. If signed-in nav analytics exist, check them before deleting a destination someone uses.
- **Card Roast's home.** Currently an entry card on Home and a WhatsApp intent. It may deserve more — it's the most shareable thing in the product.
