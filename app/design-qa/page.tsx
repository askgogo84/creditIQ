import { notFound } from 'next/navigation'
import { DesignQaClient } from '@/components/ciq/DesignQaClient'

export default function DesignQaPage() {
  if (process.env.VERCEL_ENV !== 'preview') notFound()
  return <DesignQaClient />
}
