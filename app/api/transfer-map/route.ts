import { NextResponse } from 'next/server';
import { TRANSFER_MAP } from '@/lib/transfer-map';

// Public reference data for the mobile app. All routes are honest estimates
// (verified:false) — see lib/transfer-map.ts for the honesty contract.
export const revalidate = 3600; // 1 hour cache

export async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    // NOTE: every route is verified:false — render as estimate, never verified.
    verifiedPolicy: 'all-estimates',
    sources: TRANSFER_MAP,
  });
}
