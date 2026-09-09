import type { Metadata } from 'next'
import { CreditIQAppV2 } from '@/components/ciq/app-v2/CreditIQAppV2'
import './preview.css'
import './v2.css'

export const metadata: Metadata = {
  title: 'CreditIQ Mobile App Prototype V2',
  description: 'Full first-run and mobile CreditIQ prototype for product review.',
  robots: { index: false, follow: false },
}

export default function AppPreviewPage() {
  return (
    <div id="creditiq-app-preview">
      <CreditIQAppV2 />
    </div>
  )
}
