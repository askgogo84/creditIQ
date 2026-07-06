'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { authedFetch } from '@/lib/authed-fetch';
import { useRouter } from 'next/navigation';
import { CiqTheme, ThemeToggle } from '@/components/ciq/ThemeProvider';

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

  // ---- auth load (unchanged logic) ----
  useEffect(() => {
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      setName(user.user_metadata?.full_name || '');
      try {
        const j = await (await authedFetch('/api/onboarding')).json();
        if (j?.onboarding_complete) router.replace('/dashboard');
      } catch {}
    });
  }, []);

  // ---- card catalog search (unchanged logic) ----
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
      await authedFetch('/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({ displayName: name, dateOfBirth: dob || null, homeAirport: airport || null, complete: true }),
      });
      router.replace('/dashboard');
    } catch { setSaving(false); }
  };

  const canNext = step === 0 ? name.trim().length > 0 : true;

  // ---- shared styles ----
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 15px', borderRadius: 12, fontSize: 15,
    background: 'var(--ciq-panel-2)', border: '1px solid var(--ciq-line-2)',
    color: 'var(--ciq-ink)', outline: 'none',
  };
  const goldBtn = (disabled = false): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
    padding: 15, borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none',
    background: disabled ? 'var(--ciq-line-2)' : 'linear-gradient(135deg,var(--ciq-gold-2),var(--ciq-gold))',
    color: disabled ? 'var(--ciq-ink-3)' : '#1a1710', cursor: disabled ? 'default' : 'pointer',
  });
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--ciq-ink-3)', marginBottom: 7, display: 'block' };

  return (
    <CiqTheme>
      <div style={{ maxWidth: 420, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* masthead */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 8px' }}>
          <div className="ciq-display" style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-.02em' }}>
            Credit<span style={{ color: 'var(--ciq-gold-2)' }}>IQ</span>
          </div>
          <ThemeToggle />
        </div>

        {/* progress dots */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 20px 0' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: i <= step ? 'var(--ciq-gold)' : 'var(--ciq-line-2)',
              transition: 'background .3s',
            }} />
          ))}
        </div>

        <div style={{ flex: 1, padding: '28px 20px 20px' }}>
          {/* STEP 0 — WELCOME */}
          {step === 0 && (
            <div className="ciq-rise">
              <div className="ciq-mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ciq-gold-2)' }}>
                Welcome
              </div>
              <h1 className="ciq-serif" style={{ fontSize: 38, lineHeight: 1.08, letterSpacing: '-.02em', marginTop: 14 }}>
                Your points are a <span style={{ fontStyle: 'italic', color: 'var(--ciq-gold-2)' }}>business-class seat.</span>
              </h1>
              <p style={{ fontSize: 13.5, color: 'var(--ciq-ink-3)', marginTop: 12, lineHeight: 1.5 }}>
                Using them shouldn&apos;t need ten tabs and a spreadsheet. Let&apos;s set up your wallet — honestly.
              </p>
              <div style={{ marginTop: 28 }}>
                <label style={label}>What should we call you?</label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div style={{ marginTop: 18 }}>
                <label style={label}>Date of birth <span style={{ color: 'var(--ciq-ink-3)', fontWeight: 400 }}>· optional, for statement auto-import</span></label>
                <input style={inputStyle} type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 1 — WALLET */}
          {step === 1 && (
            <div className="ciq-rise">
              <h1 className="ciq-serif" style={{ fontSize: 32, letterSpacing: '-.02em' }}>What&apos;s in your wallet?</h1>
              <p style={{ fontSize: 13, color: 'var(--ciq-ink-3)', marginTop: 8, lineHeight: 1.5 }}>
                Add every card you use. Manually-added balances show as <b style={{ color: 'var(--ciq-ink-2)' }}>Estimated</b> — upload a statement later to verify.
              </p>

              <input style={{ ...inputStyle, marginTop: 20 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Search a card, airline, or hotel…" />

              {/* search results */}
              {results.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.map(r => (
                    <button key={r.id} onClick={() => { setPending(r); setPendingPts(''); }}
                      style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: 'var(--ciq-panel)', border: '1px solid var(--ciq-line)', color: 'var(--ciq-ink)', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                      <div className="ciq-mono" style={{ fontSize: 10, color: 'var(--ciq-ink-3)', marginTop: 2 }}>{r.bank}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* pending points entry */}
              {pending && (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: 'var(--ciq-panel)', border: '1px solid var(--ciq-gold-line)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{pending.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input style={{ ...inputStyle, flex: 1 }} type="number" autoFocus value={pendingPts}
                      onChange={e => setPendingPts(e.target.value)} placeholder={`${pending.reward_currency || 'Points'} balance`} />
                    <button onClick={confirmPending} style={{ ...goldBtn(), width: 'auto', padding: '0 20px' }}>Add</button>
                  </div>
                </div>
              )}

              {/* wallet list */}
              {wallet.length > 0 && (
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {wallet.map(w => (
                    <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 14, background: 'var(--ciq-panel)', border: '1px solid var(--ciq-line)' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--ciq-card-metal)', border: '1px solid var(--ciq-gold-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ciq-gold-2)', fontWeight: 700, fontSize: 11 }}>
                        {w.bank.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{w.name}</div>
                        <div className="ciq-mono" style={{ fontSize: 10, color: 'var(--ciq-ink-3)', marginTop: 2 }}>
                          {w.points.toLocaleString('en-IN')} {w.currency}
                        </div>
                      </div>
                      <button onClick={() => setWallet(list => list.filter(x => x.id !== w.id))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ciq-ink-3)', fontSize: 18 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — AIRPORT */}
          {step === 2 && (
            <div className="ciq-rise">
              <h1 className="ciq-serif" style={{ fontSize: 32, letterSpacing: '-.02em' }}>Where&apos;s home base?</h1>
              <p style={{ fontSize: 13, color: 'var(--ciq-ink-3)', marginTop: 8, lineHeight: 1.5 }}>
                We&apos;ll surface award deals departing from here first.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
                {AIRPORTS.map(a => {
                  const sel = airport === a.code;
                  return (
                    <button key={a.code} onClick={() => setAirport(a.code)}
                      style={{
                        textAlign: 'left', padding: '16px 16px', borderRadius: 14, cursor: 'pointer',
                        background: sel ? 'var(--ciq-gold-soft)' : 'var(--ciq-panel)',
                        border: `1px solid ${sel ? 'var(--ciq-gold)' : 'var(--ciq-line)'}`,
                        color: 'var(--ciq-ink)',
                      }}>
                      <div className="ciq-display" style={{ fontSize: 20, fontWeight: 600, color: sel ? 'var(--ciq-gold-2)' : 'var(--ciq-ink)' }}>{a.code}</div>
                      <div className="ciq-mono" style={{ fontSize: 11, color: 'var(--ciq-ink-3)', marginTop: 2 }}>{a.city}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 — DONE */}
          {step === 3 && (
            <div className="ciq-rise" style={{ textAlign: 'center', paddingTop: 30 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto', background: 'var(--ciq-gold-soft)', border: '1px solid var(--ciq-gold-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="var(--ciq-gold-2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="ciq-mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ciq-gold-2)', marginTop: 22 }}>
                You&apos;re all set
              </div>
              <h1 className="ciq-serif" style={{ fontSize: 34, marginTop: 10 }}>{name || 'Welcome'}.</h1>
              <p style={{ fontSize: 14, color: 'var(--ciq-ink-3)', marginTop: 10, lineHeight: 1.5 }}>
                {wallet.length > 0
                  ? `${wallet.length} card${wallet.length > 1 ? 's' : ''} added · ${wallet.reduce((s, w) => s + w.points, 0).toLocaleString('en-IN')} points ready to optimize.`
                  : 'Your wallet is ready. Add cards anytime from the dashboard.'}
              </p>
            </div>
          )}
        </div>

        {/* nav footer */}
        <div style={{ padding: '0 20px calc(24px + env(safe-area-inset-bottom))', display: 'flex', gap: 10 }}>
          {step > 0 && step < 3 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '15px 18px', borderRadius: 12, background: 'none', border: '1px solid var(--ciq-line-2)', color: 'var(--ciq-ink)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>←</button>
          )}
          {step < 3 && (
            <button onClick={() => canNext && setStep(s => s + 1)} disabled={!canNext} style={goldBtn(!canNext)}>
              Continue →
            </button>
          )}
          {step === 3 && (
            <button onClick={finish} disabled={saving} style={goldBtn(saving)}>
              {saving ? 'Setting up…' : 'Enter your wallet →'}
            </button>
          )}
        </div>
      </div>
    </CiqTheme>
  );
}


