# CreditIQ — Cockpit dashboard: implementation brief

**22 Sep 2026 · for review before running in Claude Code**

The design files were inspected before this prompt was written. Five findings
change how the work should be framed. The prompt in §3 is written against them.

---

## 1. What the files actually contain

**The editable source is not the file named in the request.**
`CreditIQ Cockpit.html` (707 KB) is a compressed, self-unpacking bundle — useful
to open in a browser as a visual reference, useless as source. The readable
source is `CreditIQ Cockpit.dc.html` (53 KB) inside the zip.

**The zip holds five designs, and only one is approved.** It also contains
`Concept A - Rewards Orbit`, `Concept B - Concierge Cockpit`,
`Concept C - Card Deck`, and `CreditIQ Dashboard.dc.html`. An agent told to
"use the zip" can land on the wrong one. The prompt names the file exactly.

**The mobile layout is already specified — in the source.** The design carries
container queries at 1240 px and 900 px that implement every mobile requirement
in the brief:

| Requirement | Already in source |
|---|---|
| Rail becomes bottom nav | `[data-rail]` → `position: sticky; bottom: 0; flex-direction: row` |
| Nav must not cover content | `[data-main]` → `padding-bottom: 110px` |
| Hero single column, left-aligned | `[data-h1]` → 32 px, left; `[data-eyebrow]`, `[data-cmdwrap]` left |
| CIRA input full width | `[data-cmd]` → `width: 100%` |
| Suggestion chips scroll | `[data-suggest]` → `nowrap; overflow-x: auto` |
| Smartest Move full width, Wallet stacks | `[data-work]`, `[data-lower]` → `grid-template-columns: 1fr` |
| Card deck becomes a swipe carousel | `[data-deck]` → flex, `overflow-x: auto`; cards fixed 250 × 156 |
| Orbit fits the viewport | `[data-orbit]` 340 px; `[data-orbitwrap]` `scale(.66)` |
| CIRA bar sits above the nav | `[data-cirabar]` → `bottom: 84px` |

So "make it responsive" is not a design task. It is **porting these rules
faithfully**. Improvising a mobile layout is the single most likely way to break
"no design interpretation".

The rules are `@container cq`, not `@media`. They only fire if the frame element
declares `container-type: inline-size; container-name: cq`. Miss that one line
and none of the mobile rules apply — the result is exactly the "tiny desktop UI
shrunk down" the brief forbids.

**The design ships demo data.** HDFC Infinia (15 mentions), HDFC, Axis, Amex, and
figures including ₹26,400, ₹75,000, ₹2,475, ₹1,500 and ₹1,125 are hardcoded.
Every one needs a real source or an honest empty state. The Smartest Move card is
the risk: it is the most prominent figure on the page and nothing guarantees a
production source exists for it.

**The design uses its own template runtime.** `<x-dc>`, `<sc-for>` (12),
`<sc-if>` (11) and `support.js`. These must be translated to React. `support.js`
is not to be shipped.

---

## 2. Two decisions the prompt cannot make for you

### 2.1 The rail is shared, and the brief contradicts itself

The dark rail and bottom nav are shell, not dashboard. They render on `/wallet`,
`/trip-planner` and `/cira` too. The brief asks for the Cockpit rail on
`/dashboard` and "do not rewrite unrelated pages".

Those cannot both hold. The options are: restyle the shared rail everywhere; run
two rails, one for `/dashboard`; or keep the current rail and replicate only the
main column. The prompt has the agent lay out the options and stop.

### 2.2 This is a design-system change, not a reskin

| | Current CreditIQ | Cockpit design |
|---|---|---|
| Display | Fraunces | Newsreader |
| Body | Inter | Instrument Sans |
| Accent | copper | gold `#B08D57` / `#C9A86A` |
| Ink | `#142335` | `#12151F` |
| Ground | cream `#FBF8F3` | `#E9E4DA` |

The gold palette is also the palette the gold→white migration retired. Applied to
one page, `/dashboard` will look like a different product from `/wallet` one tap
away. The prompt scopes the new tokens to the dashboard by default so nothing
global changes silently — deliberately the conservative choice, reversible once
decided.

Newsreader is loaded with its italic axis. The design does not use italic
anywhere, so there is no conflict with the no-italics rule; keep it that way.

---

## 3. The prompt

Two phases in one prompt. The agent stops after Phase 1 and waits for `GO`, so
the two decisions above are made by you, not by it.

Production deploy is removed. It ends at a preview URL, because only you can see
your real wallet on it — the agent cannot sign in as you, so it cannot verify the
"0 cards / 0 points" requirement at all.

```
CreditIQ — Cockpit dashboard. STRICT 1:1 replication of an approved design.

SOURCE OF TRUTH — exactly one file:
  docs/design/cockpit/CreditIQ Cockpit.dc.html
Visual reference (open in a browser, do NOT read as source):
  docs/design/cockpit/CreditIQ-Cockpit-bundle.html
IGNORE these — they are rejected concepts, not the design:
  Concept A - Rewards Orbit.dc.html, Concept B - Concierge Cockpit.dc.html,
  Concept C - Card Deck.dc.html, CreditIQ Dashboard.dc.html
support.js and the <x-dc>, <sc-for>, <sc-if> tags are the design tool's
template runtime. Translate them to React. Do NOT ship support.js.

DO NOT redesign. DO NOT improve. DO NOT change IA, typography, colours,
spacing, proportions, card sizes, rail width, buttons, hero layout or
hierarchy.

============================================================
PHASE 1 — PLAN ONLY. Do not edit, create or delete any file.
============================================================

1. Run `git status --short --branch`. If there is uncommitted work, STOP and
   report it. Do not stash, switch or overwrite anything.
2. Read the Cockpit source in full. Read the current /dashboard, /wallet,
   the signed-in shell and rail, and globals.css tokens.
3. Report:

   A. RESPONSIVE PORT. The source already contains the mobile layout as
      `@container cq` rules at max-width 1240px and 900px. List every rule
      and the component it maps to. Confirm how you will declare
      `container-type: inline-size; container-name: cq` on the frame —
      without it none of the mobile rules fire. Do NOT design a mobile
      layout; port these rules exactly.

   B. DEMO DATA INVENTORY. The source hardcodes demo values including
      HDFC Infinia, HDFC, Axis, Amex, ₹26,400, ₹75,000, ₹2,475, ₹1,500,
      ₹1,125 and point counts. List EVERY hardcoded value in a table:
      value | where it renders | real CreditIQ source (file + function) |
      what renders if that source is empty.
      The wallet data MUST come from the same loader /wallet already uses.
      Do not write a new card query. Cards are matched by display name
      against Supabase today, which is a known defect source — do not add
      a second matching path.
      If a value has NO real production source — especially anything in
      "YOUR SMARTEST MOVE RIGHT NOW" — say so. Never ship a demo figure.
      An honest empty state beats a convincing wrong number.

   C. SHARED RAIL CONFLICT. The rail and bottom nav are shell, rendered on
      /wallet, /trip-planner and /cira as well. Lay out the options —
      restyle the shared rail everywhere, a separate rail for /dashboard
      only, or keep the current rail and replicate only the main column —
      with the files each touches. DO NOT choose.

   D. DESIGN TOKENS. The design uses Newsreader + Instrument Sans, gold
      #B08D57 / #C9A86A, ink #12151F, ground #E9E4DA. Current CreditIQ uses
      different fonts and tokens. Propose scoping the design's tokens to
      the dashboard only, without changing globals.css. List any global
      token that would have to change otherwise.

   E. OLD STYLING TO REMOVE. List candidate "experimental/subscription
      dashboard" styling that conflicts with the design, with file paths.
      Do not delete anything in this phase.

   F. SCREENSHOTS. State whether the repo already has a way to capture
      screenshots (Playwright or similar). Do NOT install anything new.
      /dashboard needs a signed-in session — state what you can and
      cannot capture without one.

   G. Files to create, files to modify, and the risk of each.

4. End Phase 1 with exactly:
   PHASE_1_COMPLETE — awaiting GO, with decisions on C and D.
   Then STOP. Do not proceed without an explicit GO.

============================================================
PHASE 2 — only after GO, and using the decisions given with it.
============================================================

1. Create and switch to branch: feat/cockpit-dashboard
2. Implement the design as React components on /dashboard.
3. Port the @container rules exactly as mapped in Phase 1 A.
4. Wire every value to its Phase 1 B source. Keep the honest empty
   states. No demo figure may reach the page.
5. Leave /wallet, /trip-planner and /cira functionality untouched —
   Supabase auth, wallet data, verification state, AwardTool flights,
   travel/redemption and hotel APIs, CIRA, routing.
6. No italic anywhere. Tap targets at least 44px.
7. Verify, and report each result:
     npx tsc --noEmit
     the repo's unit test command (read it from package.json)
     existing travel/data validators
   Four failures are a KNOWN BASELINE and not caused by this work:
   SectionTabs (x2), parse-statement IDOR, sms-parse IDOR.
   This work touches navigation, so if the SectionTabs failures CHANGE,
   report exactly how. Any other failure is a regression — stop.
8. If screenshots are possible, capture 1440x900, 1600x900, 390x844 and
   360x800 and save them to docs/design/cockpit/screenshots/.
   Do NOT judge them yourself as the merge gate. Report whether the page
   has horizontal overflow at 360 and 390, measured, not eyeballed.
9. Commit and push the branch. This produces a Vercel PREVIEW deploy.
   DO NOT merge. DO NOT deploy to production.
10. Final report: every file changed and why, every demo value and what
    replaced it, the preview URL for /dashboard, and a list of what to
    check by hand on a phone.
```

---

## 4. After Phase 2

The preview URL for the branch will follow the project pattern. Open `/dashboard`
signed in as yourself, on your phone, and check the things the agent cannot:
your real cards and points appear, the Smartest Move figure is real or honestly
empty, and the bottom nav does not cover the CIRA bar.

Merge and production deploy are yours, after that check.
