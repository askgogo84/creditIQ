// /trip-planner — the Fly on Points board (Phase 5 swap). The AI trip planner is
// retired: free-text entry now lives on the Ask AI tab (/travel), and this route
// serves the award board. Every legacy inbound link (?points=&bank=, ?q=Trip to
// <city>) still resolves — the board reads ?q for a destination and ignores the
// points/bank params (it prices from the user's wallet cards, not a typed total).
//
// Board reads useSearchParams, so it must sit inside a Suspense boundary.

import { Suspense } from 'react';
import { Board } from '@/components/ciq/fly-points/Board';

export default function TripPlannerPage() {
  return (
    <Suspense fallback={<div />}>
      <Board />
    </Suspense>
  );
}
