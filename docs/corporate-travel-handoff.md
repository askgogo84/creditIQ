# Corporate Travel handoff

CreditIQ Consumer and CreditIQ Business use separate Supabase projects and separate auth sessions.

The consumer app creates a 256-bit random handoff token and stores only its SHA-256 hash with a bounded FLIGHT/HOTEL request snapshot. The link expires after 30 minutes.

CreditIQ Business accepts the handoff only after the user is authenticated and belongs to an organisation. The Business API fetches the consumer payload server-to-server, deduplicates by token hash, and stores it as an UNVERIFIED corporate travel request.

Workflow and verification are intentionally separate:

- NEW → REVIEWING → OPTIONS_READY → AWAITING_APPROVAL → APPROVED → BOOKED
- UNVERIFIED → PARTIALLY_VERIFIED → VERIFIED

No handoff authorises an irreversible points transfer, payment charge, or booking. The Travel Desk must re-check live inventory, final price/taxes, transfer ratio/timing and the approval boundary before execution.
