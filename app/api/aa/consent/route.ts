import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';

const FINVU_UAT = 'https://webueuat.finvu.in';
const FINVU_PROD = 'https://webue.finvu.in';

export async function POST(req: NextRequest) {
  try {
    const { userId, mobile } = await req.json();
    if (!userId || !mobile) return NextResponse.json({ error: 'userId and mobile required' }, { status: 400 });

    const clientId = process.env.FINVU_CLIENT_ID;
    const secret = process.env.FINVU_CLIENT_SECRET;
    const isProd = process.env.FINVU_ENV === 'production';
    const BASE = isProd ? FINVU_PROD : FINVU_UAT;

    // Demo mode if keys not set
    if (!clientId || !secret) {
      return NextResponse.json({
        demo: true,
        consentHandle: `demo-${Date.now()}`,
        redirectUrl: null,
        message: 'Demo mode  --  add FINVU_CLIENT_ID + FINVU_CLIENT_SECRET to Vercel env vars',
      });
    }

    // Get Finvu token
    const authRes = await fetch(`${BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: clientId, password: secret }),
    });
    const { token } = await authRes.json();

    // Create consent
    const txnId = `CREDITIQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const consentRes = await fetch(`${BASE}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-client-id': clientId },
      body: JSON.stringify({
        ver: '2.0.0',
        timestamp: now.toISOString(),
        txnid: txnId,
        ConsentDetail: {
          consentStart: now.toISOString(),
          consentExpiry: expiry.toISOString(),
          consentMode: 'VIEW',
          fetchType: 'PERIODIC',
          consentTypes: ['PROFILE', 'SUMMARY'],
          fiTypes: ['CREDIT_CARD'],
          DataConsumer: { id: clientId },
          Customer: { id: `${mobile}@finvu` },
          Purpose: {
            code: '101',
            refUri: 'https://api.rebit.org.in/aa/purpose/101.xml',
            text: 'Credit card points tracking and optimization',
            Category: { type: 'Personal Finance' },
          },
          FIDataRange: { from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), to: now.toISOString() },
          DataLife: { unit: 'YEAR', value: 1 },
          Frequency: { unit: 'MONTH', value: 1 },
        },
      }),
    });

    const consentData = await consentRes.json();
    const consentHandle = consentData.ConsentHandle;

    // Save to Supabase
    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sUrl && sKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(sUrl, sKey);
      await sb.from('aa_consents').upsert({ user_id: userId, consent_handle: consentHandle, status: 'PENDING', mobile, txn_id: txnId, created_at: now.toISOString() });
    }

    const redirectUrl = `${BASE}/consent/webRedirect?consentHandle=${consentHandle}&redirect_url=${encodeURIComponent('https://creditiq.app/api/aa/callback')}`;
    return NextResponse.json({ consentHandle, redirectUrl });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
