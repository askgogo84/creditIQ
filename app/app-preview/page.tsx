import type { Metadata } from 'next'
import { MobileAppPrototype } from '@/components/ciq/mobile-app/MobileAppPrototype'

export const metadata: Metadata = {
  title: 'CreditIQ Mobile App Prototype',
  description: 'Interactive mobile-first CreditIQ application prototype for product review.',
  robots: { index: false, follow: false },
}

export default function AppPreviewPage() {
  return <MobileAppPrototype />
}
