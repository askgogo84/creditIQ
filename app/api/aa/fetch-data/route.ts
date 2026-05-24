import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';

const FINVU_UAT = 'https://webueuat.finvu.in';
const FINVU_PROD = 'https://webue.finvu.in';

export async function POST(req: NextRequest) {
  try {
    const { consentHandle } = await req.json();
    if (!consentHandle) return NextResponse.json({ error: 'consentHandle required' }, { status: 400 });

    const clientId = process.env.FINVU_CLIENT_ID;
    const secret = process.env.FINVU_CLIENT_SECRET;
    const isProd = process.env.FINVU_ENV === 'production';
    const BASE = isProd ? FINVU_PROD : FINVU_UAT;

    if (!clientId || !secret) return NextResponse.json({ error: 'Finvu not configured' }, { status: 500 });

    // Get token
    const authRes = await fetch(`${BASE}/auth/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: clientId, password: secret }) });
    const { token } = await authRes.json();

    // Create FI data request
    const sessionRes = await fetch(`${BASE}/FI/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-client-id': clientId },
      body: JSON.stringify({
        ver: '2.0.0',
        timestamp: new Date().toISOString(),
        txnid: `FI-${Date.now()}`,
        FIDataRange: { from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), to: new Date().toISOString() },
        Consent: { id: consentHandle, digitalSignature: '' },
        KeyMaterial: { cryptoAlg: 'ECDH', curve: 'Curve25519', params: '', DHPublicKey: { expiry: new Date(Date.now() + 3600000).toISOString(), Parameters: '', KeyValue: '' }, Nonce: '' },
      }),
    });

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.sessionId;

    // Poll for data (max 10 tries)
    let fiData = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const fetchRes = await fetch(`${BASE}/FI/fetch/${sessionId}`, { headers: { Authorization: `Bearer ${token}`, 'x-client-id': clientId } });
      const data = await fetchRes.json();
      if (data.FI && data.FI.length > 0) { fiData = data.FI; break; }
    }

    if (!fiData) return NextResponse.json({ error: 'Data not ready yet' }, { status: 202 });

    // Parse credit card data and extract points/rewards
    const cards = fiData.map((fi: any) => {
      const summary = fi.data?.Account?.Summary;
      return {
        maskedNumber: fi.data?.Account?.maskedAccNumber || '.... ????',
        bank: fi.fipId,
        rewardPoints: summary?.rewardPoints || 0,
        cashbackBalance: summary?.cashbackBalance || 0,
        creditLimit: summary?.creditLimit || 0,
        currentBalance: summary?.currentBalance || 0,
      };
    });

    // Save to Supabase
    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sUrl && sKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(sUrl, sKey);
      for (const card of cards) {
        await sb.from('linked_cards').upsert({
          consent_handle: consentHandle,
          masked_number: card.maskedNumber,
          bank: card.bank,
          reward_points: card.rewardPoints,
          cashback_balance: card.cashbackBalance,
          synced_at: new Date().toISOString(),
        }, { onConflict: 'consent_handle,masked_number' });
      }
      await sb.from('aa_consents').update({ status: 'DATA_FETCHED', last_synced: new Date().toISOString() }).eq('consent_handle', consentHandle);
    }

    return NextResponse.json({ cards, count: cards.length });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
