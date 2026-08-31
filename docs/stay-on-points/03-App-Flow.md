# 03 — App Flow · Stay on Points

---

## 1. Entry points

| From | Lands on | State carried |
|---|---|---|
| Travel nav → Stay on Points | `/stay-on-points` | signed-in balance if present |
| Wallet card → "what can these points book" | `/stay-on-points?mode=points&bank=HDFC` | balance prefilled |
| Fly on Points board cross-link | `/stay-on-points?city=Bangkok` | city prefilled |
| Direct / SEO | `/stay-on-points` | none — signed-out safe |

Signed-out users see the full page. The points-coverage line is replaced by a
prompt to add a balance. No paywall, no gate — this is an acquisition surface.

## 2. The four search modes

All four render the same result cards. They differ only in what the user
supplies.

**A · By city** — destination, check-in, check-out → all seeded hotels in that
city, sorted by transfer advantage descending.

**B · By hotel** — hotel name, dates → one result, expanded.

**C · What can my points book** — points balance (from wallet or manual),
nights, region → hotels the balance fully covers, cheapest points first.

**D · Best value now** — sort selector (value per point / lowest points /
biggest saving) + card selector → ranked list. This is the browse mode and the
most linkable; it needs no user input at all.

Mode is a URL param so every mode is shareable and indexable.

## 3. The result card — decision order

The card is built to answer questions in the order a user actually asks them:

```
1. Which hotel is this?          photo, name, chain, area, room type
2. What does it cost in points?  points figure + rupee value of those points
3. What does it cost in cash?    cash figure + per-night
4. So which is better?           the verdict band — the headline
5. Can I afford it?              coverage line: fully covered / top-up / shortfall
6. How do you know?              provenance row
7. What do I do now?             see-the-maths / book-direct
```

The verdict band is visually dominant because it is the answer. Everything above
it is context, everything below is justification.

## 4. Verdict states

| State | Condition | Band | Headline |
|---|---|---|---|
| POINTS_WIN | advantage > +5% | green | "Points win — N% better than your portal" |
| CLOSE_CALL | −5% to +5% | amber | "Close call — only N% better" |
| CASH_WINS | advantage < −5% | amber | "Keep your points — cash is better here" |
| NOT_PUBLISHED | programme prices dynamically | grey | "Points cost not published" |
| FX_UNAVAILABLE | FX fetch failed | grey | "Cannot compare right now" |

`CASH_WINS` is amber, not red. Telling someone to keep their points is useful
advice, not a failure.

`NOT_PUBLISHED` still shows the real cash price and links out to the programme.
The card stays useful even when we cannot compute the comparison.

## 5. Coverage line logic

```
balance >= points_required        → "covers all N nights, X left over. Nothing extra to pay."
balance covers some nights        → "covers N nights. Night N+1 is ₹X cash, or transfer Y more points."
balance covers none               → "you would need X more points, or ₹Y cash."
no balance on file                → "add your points balance to see what this covers." → /wallet
```

## 6. See the maths

Expands in place. Shows every input with its provenance:

```
Points required        60,000       Accor published rate
Accor value            EUR 1,200    2,000 pts = EUR 40, published
EUR/INR                110.42       live, fetched 11:41 IST
Value of your points   ₹66,000      computed
Your portal would give ₹60,000      HDFC SmartBuy, ₹1.00/pt, sourced
Advantage              +10.0%       computed
```

This panel is the product's credibility. Every row names where it came from.

## 7. Failure paths

| Failure | Behaviour |
|---|---|
| FX fetch fails | points cost still shown; rupee comparison suppressed; honest message; **no fallback constant** |
| No seeded rate for hotel | hotel omitted from results entirely, not shown with a blank price |
| Programme rate missing | `NOT_PUBLISHED` state |
| No hotels match | empty state naming which cities are covered in v1 |
| Portal value unknown for card | comparison suppressed, points value still shown, "we have not verified your card's portal rate" |

## 8. What the user can never do here

Book, pay, transfer points, or authorise anything. Every action is a link out to
the hotel programme or the bank. CreditIQ computes and explains; it does not
transact.
