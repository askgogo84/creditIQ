# Overnight run — decisions I need from you

These are choices I could not make from the code alone. For each I state the default I proceeded with so the run wasn't blocked. Override any of them in the morning.

---

### Q1 — "Trending" cards: is editorial curation an acceptable substitute for v1?
**Raised in:** Phase 1 audit, Phase 2 docs.
**Finding:** There is no honest "trending" signal. No trending computation exists, and the only candidate source (`applications` apply-click log) is unaggregated and almost certainly too low-volume to be truthful. A hardcoded set shown as "trending" would be a placeholder dressed as data.
**Default I took:** Design the carousel as an **editorial** strip — real card art + real `best_for` one-liners from `SEED_CARDS` — labelled "Cards to know" / "Editorial picks," **never "Trending."**
**Your call:** OK to ship editorial curation in v1? Or do you want to hold the whole carousel until a real trending signal exists?

### Q2 — Card art is hosted on an external CDN. Ship it, or self-host?
**Raised in:** Phase 1 audit.
**Finding:** `SEED_CARDS[].card_image_url` points at `asset21.ckassets.com` (a third-party CDN — looks like CardKaro's asset store). For a shipped consumer surface this is a hotlink/availability/right-to-use risk.
**Default I took:** In the docs, treat `color` (per-card, local) as the guaranteed render, and `card_image_url` as progressive enhancement with a graceful fallback to the colour swatch.
**Your call:** (a) fine to hotlink for now, (b) self-host a curated set of card images under `public/`, or (c) render colour-swatch cards only in v1 and add art later?

### Q3 — Optimisation rate is designed out of v1. Confirm that's what you want.
**Raised in:** Phase 1 audit, Phase 2 docs.
**Finding:** A genuine per-user optimisation rate needs categorized spend, which does not exist (no bank sync, no MCC categorization — that's unbuilt roadmap work). The engine can only run against an *assumed* spend mix, which the code itself flags as not-sourced.
**Default I took:** **Omit** the optimisation rate from v1 entirely (not placeholdered). Left a hook in the TRD for when categorized spend lands.
**Your call:** Confirm omit — or do you want a clearly-labelled *non-personal* "typical spender" illustration in its place (different metric, must not read as the user's own rate)?

---
*Nothing here blocked the run. All three have honest defaults applied; the build proceeds on those.*
