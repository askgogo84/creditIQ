import { Suspense } from 'react'
import { SimpleFlightWorkspace } from '@/components/ciq/travel/SimpleFlightWorkspace'

export default function TripPlannerPage() {
  return (
    <Suspense fallback={<div />}>
      <SimpleFlightWorkspace />
    </Suspense>
  )
}
