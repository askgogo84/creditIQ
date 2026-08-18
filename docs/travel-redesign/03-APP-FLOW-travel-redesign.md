# App Flow — Travel redesign

**Status:** draft for review · 18 Aug 2026

---

## The whole flow in one line

Say where you're going → see what your points can reach → open the one you like →
do the thing it tells you.

## States

### S1 · Empty

The search form and nothing else. No summary card, no strategy paragraph, no second
form further down the page.

Below the fold: a single line of explanation — what this searches and across how many
programmes. Nothing that competes with the form for attention.

If the wallet is empty, one quiet line: *add a card to see which of your points reach
these routes.* Not a blocking modal.

### S2 · Searching

The form stays visible and editable. Beneath it:

- Progress: which programme, dates completed, percent.
- Rows appear as they resolve. The user can expand a row while others still load.
- No skeleton placeholders pretending to be results.

### S3 · Results

One table. One row per date × programme × route.

**Row (collapsed):**

```
18 Aug Tue │ Air India · Maharaja Club │ BLR → DXB  10:30 → 13:30 · 4h 30m
           │ Economy 20,000 │ Business 45,000 │ 40,000 pts + ₹3,116 · HDFC Regalia
```

The card name sits under the points figure, with an `In wallet` badge where held.

**Controls above the table:** stops, cabin, taxes ceiling, duration, programme filter,
All cards / My cards. Filters re-filter what's already fetched; they do not re-query.

**Empty result:** name what was searched and what was found — *"8 programmes, 7 dates, no
award seats. Cash from ₹12,400."* An empty award search is a real answer, not a failure.

### S4 · Row expanded

Inline, beneath the row it belongs to. One row open at a time.

Three blocks, in this order:

**1 · What it costs**
Miles + taxes by cabin, cabin selectable. The taxes figure is cash the user still pays.

**2 · Points vs cash**
A `Show cash price` button. Until pressed, no cash number appears anywhere. Once
fetched: cash fare, value per point, and the plain sentence — *with points you pay
₹3,116 in taxes and keep ₹45,822.*

Where cash wins, this block says so directly: *your points are worth more elsewhere —
book this one with cash.* That is a valid, common, and correct outcome.

**3 · How to get the miles** — the transfer ladder

Each route on its own line:

```
HDFC Regalia  2:1 → Maharaja Club        direct · 0–3 days      40,000 pts
HDFC Regalia  2:1 → Accor 2:1 → Maharaja  2 hops · up to 13 days  1,60,000 pts
```

Routes whose duration puts the seat at risk are marked. A route that takes 13 days
cannot hold a seat available today, and the row says that rather than leaving the user
to work it out.

**One action.** `Book on <programme>` — a deep link into that programme's award search,
pre-filled. Not five buttons.

### S5 · Handoff

Before the user leaves, one short confirmation of the sequence — because the next step
is irreversible:

> Check the seat is still there **before** you transfer. Transfers out of your bank
> cannot be undone.

Then out to the programme. We do not follow them, and we do not claim to have booked
anything.

## Error and edge states

| Situation | Behaviour |
|---|---|
| Some programmes fail | Show results, name the count that failed |
| All programmes fail | Say so plainly; offer the cash path |
| Cash price fetch fails | The button returns an error, no number invented |
| User's points insufficient | Row still shows, with the shortfall named |
| Points are self-entered | Row marked; the shortfall calculation says "based on the balance you entered" |
| Award seat vanishes between list and expand | Re-check on expand; if gone, say so |

## What is deleted from the current page

- The second search form
- The navy summary paragraph card
- The Cheapest / Best value / Points-can-cover strip
- The two how-to columns
- The Hotels toggle
- The bottom "Redeem your points" panel
- Four of the five OTA buttons per row
- "You save vs cash ₹0"
