'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, type CSSProperties } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { authedFetch } from '@/lib/authed-fetch';
import { useRouter } from 'next/navigation';
import { Search, Check, ArrowRight, ArrowLeft, X, Plane, CreditCard } from 'lucide-react';

const GOLD = '#C9972E';

type CatalogCard = { id: string; name: string; bank: string; reward_currency: string | null };
type WalletPick = { id: string; name: string; bank: string; currency: string; points: number };

const AIRPORTS = [
  { code: 'DEL', city: 'Delhi' }, { code: 'BOM', city: 'Mumbai' }, { code: 'BLR', city: 'Bangalore' },
  { code: 'HYD', city: 'Hyderabad' }, { code: 'MAA', city: 'Chennai' }, { code: 'CCU', city: 'Kolkata' },
  { code: 'PNQ', city: 'Pune' }, { code: 'GOI', city: 'Goa' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [sb] = useState(() =>
    createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
  );
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');

  const [q, setQ] = useState('');
  const [results, setResults] = useState<CatalogCard[]>([]);
  const [wallet, setWallet] = useState<WalletPick[]>([]);
  const [pending, setPending] = useState<CatalogCard | null>(null);
  const [pendingPts, setPendingPts] = useState('');

  const [airport, setAirport] = useState('');

  useEffect(() => {
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      setName(user.user_metadata?.full_name || '');
      try {
        const j = await (await fetch(`/api/onboarding?userId=${user.id}`)).json();
        if (j?.onboarding_complete) router.replace('/dashboard');
      } catch {}
    });
  }, []);

  // card catalog search
  useEffect(() => {
    if (step !== 1 || q.trim().length < 2) { setResults([]); return; }
    let off = false;
    sb.from('cards').select('id,name,bank,reward_currency').eq('active', true)
      .ilike('name', `%${q.trim()}%`).limit(8)
      .then(({ data }) => { if (!off) setResults((data as CatalogCard[]) ?? []); });
    return () => { off = true; };
  }, [q, step]);

  const confirmPending = () => {
    if (!pending) return;
    setWallet(w => [...w.filter(x => x.id !== pending.id), {
      id: pending.id, name: pending.name, bank: pending.bank,
      currency: pending.reward_currency || 'Points', points: parseInt(pendingPts) || 0,
    }]);
    setPending(null); setPendingPts(''); setQ(''); setResults([]);
  };

  const finish = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      for (const c of wallet) {
        await authedFetch('/api/manual-cards', {
          method: 'POST',
          body: JSON.stringify({ bank: c.bank, cardName: c.name, cardLast4: '', pointsBalance: String(c.points), pointsCurrency: c.currency }),
        });
      }
      await fetch('/api/onboarding', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, displayName: name, dateOfBirth: dob || null, homeAirport: airport || null, complete: true }),
      });
      router.replace('/dashboard');
    } catch { setSaving(false); }
  };

  const card: CSSProperties = { background: 'var(--surface, #fff)', border: '1px solid var(--line, rgba(20,41,80,0.1))', borderRadius: 16 };
  const input: CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 15, border: '1px solid var(--line, rgba(20,41,80,0.15))', background: 'var(--surface-2, #f8f9fc)', color: 'var(--ink, #142950)', outline: 'none' };
  const label: CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--ink-3, #5A6A8A)', marginBottom: 6, display: 'block' };
  const primaryBtn = (disabled = false): CSSProperties => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 12, background: GOLD, color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 });

  const canNext = step === 0 ? name.trim().length > 0 : true;

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg, #F5EFE6)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 440, width: '100%', margin: '0 auto', padding: '24px 16px 40px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* brand + progress */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink, #142950)', letterSpacing: '-0.02em' }}>
            CreditIQ
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ height: 4, flex: 1, borderRadius: 99, background: i <= step ? GOLD : 'var(--line, rgba(20,41,80,0.12))', transition: 'background .2s' }} />
            ))}
          </div>
        </div>

        {/* STEP 0 — about you */}
        {step === 0 && (
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink, #142950)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>Tell us about yourself</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted, #5A6A8A)', marginTop: 8, marginBottom: 24 }}>
              Your points could be your next business-class seat. Using them shouldn’t take ten tabs and a spreadsheet.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={label}>What should we call you?</label>
              <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label style={label}>Date of birth <span style={{ fontWeight: 400 }}>(for auto-importing points from statements)</span></label>
              <input style={input} type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
          </div>
        )}

        {/* STEP 1 — wallet */}
        {step === 1 && (
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink, #142950)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>What’s in your wallet?</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted, #5A6A8A)', marginTop: 8, marginBottom: 18 }}>
              Add the cards you hold so we can suggest the best way to book any flight. You can add more later.
            </p>

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search style={{ position: 'absolute', left: 12, top: 13, width: 16, height: 16, color: 'var(--ink-3, #5A6A8A)' }} />
              <input style={{ ...input, paddingLeft: 36 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Search a card — e.g. HDFC, Infinia, Atlas" />
            </div>

            {results.length > 0 && (
              <div style={{ ...card, padding: 6, marginBottom: 12 }}>
                {results.map(r => (
                  <button key={r.id} onClick={() => { setPending(r); setPendingPts(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 10px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 10 }}>
                    <CreditCard style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--ink, #142950)', fontWeight: 600 }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3, #5A6A8A)', marginLeft: 'auto' }}>{r.bank}</span>
                  </button>
                ))}
              </div>
            )}

            {/* points prompt for a tapped card */}
            {pending && (
              <div style={{ ...card, padding: 14, marginBottom: 12, borderColor: GOLD }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink, #142950)', marginBottom: 8 }}>{pending.name}</div>
                <label style={label}>Points balance ({pending.reward_currency || 'Points'}) — leave blank if unsure</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={input} type="number" value={pendingPts} onChange={e => setPendingPts(e.target.value)} placeholder="e.g. 52000" autoFocus />
                  <button onClick={confirmPending} style={{ ...primaryBtn(), width: 'auto', padding: '0 18px' }}><Check style={{ width: 18, height: 18 }} /></button>
                </div>
              </div>
            )}

            {/* added cards */}
            {wallet.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {wallet.map(w => (
                  <div key={w.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink, #142950)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3, #5A6A8A)' }}>{w.points ? `${w.points.toLocaleString('en-IN')} ${w.currency}` : w.bank}</div>
                    </div>
                    <button onClick={() => setWallet(list => list.filter(x => x.id !== w.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3, #5A6A8A)' }}>
                      <X style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — home airport */}
        {step === 2 && (
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink, #142950)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>Where’s your home airport?</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted, #5A6A8A)', marginTop: 8, marginBottom: 18 }}>
              We’ll surface award deals departing from here first.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {AIRPORTS.map(a => {
                const on = airport === a.code;
                return (
                  <button key={a.code} onClick={() => setAirport(a.code)}
                    style={{ ...card, padding: '16px 14px', textAlign: 'left', cursor: 'pointer', borderColor: on ? GOLD : 'var(--line, rgba(20,41,80,0.1))', borderWidth: on ? 2 : 1, background: on ? 'rgba(201,151,46,0.08)' : 'var(--surface, #fff)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plane style={{ width: 14, height: 14, color: GOLD }} />
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink, #142950)' }}>{a.code}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3, #5A6A8A)', marginTop: 2 }}>{a.city}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={label}>Or type another airport code</label>
              <input style={input} value={airport} onChange={e => setAirport(e.target.value.toUpperCase().slice(0, 4))} placeholder="IATA, e.g. COK" />
            </div>
          </div>
        )}

        {/* footer nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px', borderRadius: 12, background: 'none', border: '1px solid var(--line, rgba(20,41,80,0.15))', color: 'var(--ink, #142950)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </button>
          )}
          {step < 2 ? (
            <button onClick={() => canNext && setStep(s => s + 1)} disabled={!canNext} style={primaryBtn(!canNext)}>
              {step === 1 && wallet.length === 0 ? 'Skip for now' : 'Continue'} <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          ) : (
            <button onClick={finish} disabled={saving} style={primaryBtn(saving)}>
              {saving ? 'Setting up…' : 'Finish'} {!saving && <Check style={{ width: 16, height: 16 }} />}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
