'use client';

// The transfer ladder — ONE component shared by the Fly-on-Points board's expanded
// row AND the /transfer-partners calculator. One route per line: path, nominal ratio
// (labelled nominal — never the payable figure), hops, DAYS (unknown -> "time
// unknown"), provenance state, and the payable pointsRequired (the truth).
// roundingInflated is explained so the number never looks like a bug.

import type { Route } from '@/lib/transfer-ladder';
import { describeDuration } from '@/lib/transfer-ladder';
import '@/components/ciq/fly-points/fly-points.css';

export function Ladder({ routes, cardName, programme }: { routes: Route[]; cardName: string; programme: string }) {
  return (
    <div className="fp-ladder">
      {routes.map((r, i) => {
        const days = describeDuration(r);
        const risky = r.durationDaysMax != null && r.durationDaysMax > 7; // too slow to hold an award seat
        const unknown = r.durationUnknown;
        const hops = r.hops.length === 1 ? 'Direct' : `${r.hops.length} hops`;
        const [nf, nt] = r.nominalRatio;
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
              {r.roundingInflated && (
                <div className="fp-rmeta">
                  rounded up to a {(r.minTransferIncrement ?? 0).toLocaleString('en-IN')}-mile transfer minimum
                </div>
              )}
            </div>
            <div className={`fp-days fp-mono${risky ? ' risk' : unknown ? ' warn' : ' ok'}`}>
              {unknown ? 'time unknown' : days}
            </div>
            <div className="fp-pts fp-mono">{r.pointsRequired.toLocaleString('en-IN')} pts</div>
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
