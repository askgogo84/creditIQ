import { redirect } from 'next/navigation';

// The Account Aggregator "link a card" flow is disabled — all /api/aa/* routes
// are gated off until identity is bound to a real authenticated user (see
// lib/aa-flag.ts). Nothing in the app links here, so instead of maintaining a
// dead page (and the generic error it would show against the now-404 consent
// route) we redirect to the live way to add card points today: statement upload.
// Restore the AA UI here when the flow is rebuilt.
export default function LinkCardPage() {
  redirect('/upload-statement');
}
