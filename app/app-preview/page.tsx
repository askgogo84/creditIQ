import type { Metadata } from 'next'
import { MobileAppPrototype } from '@/components/ciq/mobile-app/MobileAppPrototype'
import './preview.css'

export const metadata: Metadata = {
  title: 'CreditIQ Mobile App Prototype',
  description: 'Interactive mobile-first CreditIQ application prototype for product review.',
  robots: { index: false, follow: false },
}

export default function AppPreviewPage() {
  return (
    <div id="creditiq-app-preview">
      <MobileAppPrototype />
    </div>
  )
}
