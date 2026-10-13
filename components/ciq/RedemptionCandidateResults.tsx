import type { RedemptionCandidate } from '@/lib/redemption-engine/types'
import { formatINR } from '@/lib/utils'

type Candidate = Pick<RedemptionCandidate, 'kind' | 'instructionBlocked' | 'cashPayableMinor'>

/** Group withheld scenarios without exposing their conditional payable amounts. */
export function RedemptionCandidateResults({ candidates }: { candidates?: Candidate[] }) {
  if (!candidates) return <p className="text-sm">Select a supported card and captured booking for a server-calculated comparison.</p>
  const blocked = candidates.filter(c => c.kind === 'PROGRAMME' && c.instructionBlocked)
  const visible = candidates.filter(c => !(c.kind === 'PROGRAMME' && c.instructionBlocked))
  const reasons = [...new Set(blocked.map(c => c.instructionBlocked))]
  return <div className="space-y-2">
    {blocked.length > 0 && <div className="bg-ink-900/40 border border-white/10 rounded-lg p-3">
      <b>Programme scenarios — verification required</b>
      <p className="text-sm">{blocked.length} scenarios withheld. Exact programme payable amounts and transfer instructions need verification.</p>
      {reasons.map(reason => <p key={reason} className="text-xs">{reason?.replaceAll('_', ' ')}</p>)}
    </div>}
    {visible.map((candidate, i) => <div key={i} className="bg-ink-900/40 border border-white/10 rounded-lg p-3">
      <b>{candidate.kind === 'PROGRAMME' ? 'Programme scenario — conditional' : candidate.kind}</b>
      <p className="text-sm">{candidate.cashPayableMinor === null ? 'Payable amount unavailable.' : `Booking cash payable: ${formatINR(candidate.cashPayableMinor / 100)}`}</p>
      {candidate.instructionBlocked && <p className="text-xs">{candidate.instructionBlocked.replaceAll('_', ' ')}</p>}
    </div>)}
    {candidates.length === 0 && <p className="text-sm">No booking comparison is available.</p>}
  </div>
}
