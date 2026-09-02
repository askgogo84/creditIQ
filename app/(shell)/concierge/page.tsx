import { Suspense } from 'react'
import ConciergeCaseView from '@/components/ciq/concierge/ConciergeCaseView'

export const metadata = {
  title: 'Concierge cases | CreditIQ',
  description: 'Track CreditIQ Concierge booking requests, approvals and reconciliation.',
}

export default function ConciergePage() {
  return (
    <Suspense fallback={<div />}>
      <ConciergeCaseView />
    </Suspense>
  )
}
