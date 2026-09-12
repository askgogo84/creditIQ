# CreditIQ Travel + Concierge E2E acceptance matrix

This is the locked acceptance matrix for the Travel transaction flow. A screen or backend stage is not considered complete until its matching case passes.

## Search and selection

1. Domestic economy: BLR → DEL, exact date, Economy. Expect multiple exact-date cash itineraries when the live provider returns them; selected itinerary id, carrier, times, cabin and price must remain unchanged through the decision screen and Concierge handoff.
2. Domestic business: BLR → DEL, Business. Economy/cached fares must never be labelled as verified Business cash evidence.
3. International economy: BLR → SIN, exact date. Multiple options should be retained from the first live provider that returns inventory.
4. International premium cabin: BLR → LHR/SIN, Business. Selected cabin must survive search → decision → Concierge.
5. Provider fallback: force/observe primary provider unavailable. Next configured provider may return results, but the source and coverage label must change truthfully.
6. No live cash fare: redemption discovery may remain visible; the UI must not fabricate a matched cash benchmark.

## Redemption

7. HDFC Infinia SmartBuy: projected points + cash, 70% booking-value cap and 150,000 RP calendar-month ceiling.
8. Axis Atlas portal: Travel EDGE points/points+card, 500-mile minimum where applicable.
9. Axis Atlas transfer: group and annual ceilings enforced; path beyond known ceiling must not rank as usable.
10. Amex travel: Points for Travel / Points + Pay remains checkout-defined; no invented exact MR requirement.
11. Loyalty transfer: transfer ratio, minimum/increment and irreversible warning shown; never execute merely because a path exists.
12. Unsupported card: card remains visible as unsupported/no verified rail rather than borrowing another card's economics.

## Hotels

13. Domestic hotel: Goa/Jaipur/Mysuru exact check-in/out. Expect multiple provider properties where inventory exists.
14. International hotel: Dubai/Bangkok/Singapore exact dates. Expect global provider results where configured.
15. Hotel media: property image must come from the returned provider/content source; missing media uses a neutral fallback, never another hotel's image.
16. Hotel detail: selected hotel name/id, dates, room/rate, cancellation/meal/payment terms, price and provider must persist through detail and Concierge handoff.
17. Hotel cash-provider failure: loyalty-property/redemption discovery stays available and is clearly not labelled live cash inventory.

## Concierge verification + approval

18. Create case from selected flight. Case snapshot must contain exact selection and decision context, no passwords/OTP/CVV/full card number.
19. Create case from selected hotel. Same exact-selection rule.
20. CLIENT_REQUEST case cannot start booking. Server/operator must re-price/re-check and store a verified snapshot first.
21. Price changed during verification: case becomes PRICE_CHANGED and requires a new confirmation cycle.
22. Award disappeared during verification: case becomes AWARD_UNAVAILABLE; no transfer instruction is executable.
23. Confirmed option: SERVER_VERIFIED snapshot → OPTION_CONFIRMED → AWAITING_USER_APPROVAL.
24. User approval is accepted only from AWAITING_USER_APPROVAL. Approval does not itself move money or points.

## Execution modes

25. Cash provider deeplink: verified exact selection + provider booking URL → user/Concierge checkout → capture real PNR/reservation reference before BOOKED.
26. Cash supplier API: verified exact selection → final approval/payment → supplier create order/reservation → real PNR/reference before BOOKED.
27. Issuer portal: re-open exact itinerary/property in issuer portal → final points+cash amount → approval → booking → reference.
28. Loyalty transfer: verify award → approve irreversible transfer → confirm points posted → re-check award → book programme → capture PNR/reference.
29. Transfer delay: case remains in execution workflow; never mark BOOKED before a real booking reference exists.
30. Supplier error after approval: case becomes FAILED; preserve audit trail and do not invent reference.

## Reconciliation

31. MARK_BOOKED is rejected without a booking reference.
32. RECONCILE is rejected without a reconciliation payload.
33. Reconciliation records final cash paid, taxes/fees, points transferred/redeemed where applicable, supplier/provider and booking reference.
34. Completed case follows REVIEWING → OPTION_CONFIRMED → AWAITING_USER_APPROVAL → TRANSFER_APPROVED → BOOKING_IN_PROGRESS → BOOKED → RECONCILED.

## Mobile UX

35. 360px, 390px and 430px widths: no horizontal overflow; primary CTA, prices and booking state remain readable.
36. Browser back/forward and tab switches do not replace a selected route/hotel/card with demo/default data.
37. Loading/error states preserve the user's submitted route/dates/cabin/property rather than resetting to BLR→DEL or a demo hotel.
