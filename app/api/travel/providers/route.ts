import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { providerDiagnostics } from '@/lib/travel/provider-registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  return NextResponse.json({
    providers: providerDiagnostics(),
    generated_at: new Date().toISOString(),
    note: 'This endpoint reports only whether required environment variables exist. It never returns credential values.',
  })
}
