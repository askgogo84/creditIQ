'use client';

// The transfer ladder — ONE component shared by the Fly-on-Points board's expanded
// row AND the /transfer-partners calculator. One route per line: path, nominal ratio
// (labelled nominal — never the payable figure), hops, DAYS (unknown -> "time
// unknown"), provenance state.
//
// Two directions off the SAME route data:
//   cost (default) — REVERSE: the payable pointsRequired (the board + calculator's
//                    reverse toggle). roundingInflated is explained.
//   receive={N}    — FORWARD: miles you get from N source points, via milesReceivedFor
//                    (rounds DOWN to the transfer minimum). Below the minimum -> "—"
//                    with a note, never a misleading zero.

import type { Route } from '@/lib/transfer-ladder';
import { describeDuration, milesReceivedFor } from '@/lib/transfer-ladder';
import '@/components/ciq/fly-points/fly-points.css';

export function Ladder({
  routes, cardName, programme, receive,
}: {
  routes: Route[];
  cardName: string;
  programme: string;
  receive?: number; // set => FORWARD mode: miles received from this many source points
}) {
  const forward = receive != null;
  return (
    <div className="fp-ladder">
      {routes.map((r, i) => {
        const days = describeDuration(r);
        const risky = r.durationDaysMax != null && r.durationDaysMax > 7; // too slow to hold an award seat
        const unknown = r.durationUnknown;
        const hops = r.hops.length === 1 ? 'Direct' : `${r.hops.length} hops`;
        const [nf, nt] = r.nominalRatio;
        const miles = forward ? milesReceivedFor(r, receive as number) : 0;
        const belowMin = forward && miles === 0 && (r.minTransferIncrement ?? 0) > (receive ?? 0);
        return (
          <div key={i} className={`fp-rung${i === 0 ? ' best' : ''}`}>
            <div>
              <div className="fp-path">
                {cardName} <span className="fp-arw">→</span> {programme}
              </div>
              <div className="fp-rmeta">
                {hops} · nominal {nf}:{nt}
                {r.minTransferIncrement ? ` · min ${r.minTransferIncrement.toLocaleString('en-IN')}` : ''}
                {r.state !== 'verified' ? ' · estimated, not issuer-confirmed' : ''}
              </div>
              {!forward && r.roundingInflated && (
                <div className="fp-rmeta">
                  rounded up to a {(r.minTransferIncrement ?? 0).toLocaleString('en-IN')}-mile transfer minimum
                </div>
              )}
              {belowMin && (
                <div className="fp-rmeta">
                  below the {(r.minTransferIncrement ?? 0).toLocaleString('en-IN')}-point minimum to transfer
                </div>
              )}
            </div>
            <div className={`fp-days fp-mono${risky ? ' risk' : unknown ? ' warn' : ' ok'}`}>
              {unknown ? 'time unknown' : days}
            </div>
            <div className="fp-pts fp-mono">
              {forward
                ? belowMin ? '—' : `${miles.toLocaleString('en-IN')} miles`
                : `${r.pointsRequired.toLocaleString('en-IN')} pts`}
            </div>
          </div>
        );
      })}
      {routes.some((r) => r.durationDaysMax != null && r.durationDaysMax > 7) && (
        <p className="fp-risknote">
          A transfer this slow is a real risk — award seats can vanish before the miles land.
        </p>
      )}
    </div>
  );
}
