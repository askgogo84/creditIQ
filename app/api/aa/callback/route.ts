import { NextRequest, NextResponse } from 'next/server';
import { aaEnabled } from '@/lib/aa-flag';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  // Kill-switch: AA flow disabled until identity is bound. See lib/aa-flag.ts.
  // Browser-facing redirect target, so bounce to the link-card page rather than
  // returning JSON.
  if (!aaEnabled()) return NextResponse.redirect('https://creditiq.app/link-card?error=unavailable');

  const { searchParams } = new URL(req.url);
  const consentHandle = searchParams.get('consentHandle');
  const status = searchParams.get('status'); // ACTIVE or REJECTED

  if (!consentHandle) {
    return NextResponse.redirect('https://creditiq.app/dashboard?error=no_consent');
  }

  // Update consent status in Supabase
  const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (sUrl && sKey) {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(sUrl, sKey);
    await sb.from('aa_consents').update({ status: status === 'ACTIVE' ? 'ACTIVE' : 'REJECTED', updated_at: new Date().toISOString() }).eq('consent_handle', consentHandle);

    // If approved, trigger data fetch
    if (status === 'ACTIVE') {
      // Fire-and-forget data fetch
      fetch(`https://creditiq.app/api/aa/fetch-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentHandle }),
      }).catch(() => {});
    }
  }

  const redirectPath = status === 'ACTIVE'
    ? `/dashboard?linked=success&consent=${consentHandle}`
    : `/link-card?error=consent_rejected`;

  return NextResponse.redirect(`https://creditiq.app${redirectPath}`);
}
