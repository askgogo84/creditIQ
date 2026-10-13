import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { RedemptionCandidateResults } from './RedemptionCandidateResults'

it('groups identical blockers, withholds conditional cash and keeps independent cash comparisons', () => {
  render(<RedemptionCandidateResults candidates={[
    ...Array.from({ length: 26 }, () => ({ kind: 'PROGRAMME' as const, instructionBlocked: 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN' as const, cashPayableMinor: 12345 })),
    { kind: 'CASH', instructionBlocked: null, cashPayableMinor: 100000 },
  ]} />)
  expect(screen.getAllByText('PROGRAMME ELIGIBLE AMOUNT UNKNOWN')).toHaveLength(1)
  expect(screen.getByText(/26 scenarios withheld/)).toBeInTheDocument()
  expect(screen.getAllByText(/Booking cash payable/)).toHaveLength(1)
  expect(screen.queryByText(/123/)).not.toBeInTheDocument()
  expect(screen.getByText('CASH')).toBeInTheDocument()
})

it('preserves distinct blockers and distinguishes unloaded from empty results', () => {
  const view = render(<RedemptionCandidateResults />)
  expect(screen.getByText(/Select a supported card/)).toBeInTheDocument()
  view.rerender(<RedemptionCandidateResults candidates={[]} />)
  expect(screen.getByText('No booking comparison is available.')).toBeInTheDocument()
  view.rerender(<RedemptionCandidateResults candidates={[
    { kind: 'PROGRAMME', instructionBlocked: 'TRANSFER_MINIMUM_UNVERIFIED', cashPayableMinor: null },
    { kind: 'PROGRAMME', instructionBlocked: 'TRANSFER_INCREMENT_UNVERIFIED', cashPayableMinor: null },
  ]} />)
  expect(screen.getByText('TRANSFER MINIMUM UNVERIFIED')).toBeInTheDocument()
  expect(screen.getByText('TRANSFER INCREMENT UNVERIFIED')).toBeInTheDocument()
})
