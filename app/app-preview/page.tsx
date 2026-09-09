import type { Metadata } from 'next'
import { ReferenceApp } from '@/components/ciq/reference-app/ReferenceApp'
import './preview.css'
import './reference-parity.css'

export const metadata: Metadata = {
  title: 'CreditIQ Mobile App Prototype — Reference Parity',
  description: 'Interactive CreditIQ mobile app prototype rebuilt to match the approved visual reference boards.',
  robots: { index: false, follow: false },
}

export default function AppPreviewPage() {
  return (
    <div id="creditiq-app-preview">
      <ReferenceApp />
    </div>
  )
}
