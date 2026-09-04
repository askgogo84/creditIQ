'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { authedFetch } from '@/lib/authed-fetch';
import { PageHeader } from '@/components/ciq/PageHeader';
import { MembershipModal } from '@/components/ciq/MembershipModal';
import { LinkWhatsAppButton } from './LinkWhatsAppButton';
import { PLANS, type ProPlanKey } from '@/lib/plans';

// Consumer↔Business bridge join code (single-org code; unchanged from the prior page).
const JOIN_CODE = 'CIQ-2850AF';

interface ProStatus {
  isPro: boolean;
  plan: ProPlanKey | null;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}
interface OrderRow {
  id: number;
  plan: string | null;
  amount_paise: number | null;
  months: number | null;
  applied_pro_until: string | null;
  created_at: string;
}
interface ProfileFields {
  display_name: string | null;
  home_airport: string | null;
  home_city: string | null;
}

const monthYear = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
const fullDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const rupees = (paise?: number | null) =>
  paise != null ? '₹' + (paise / 100).toLocaleString('en-IN') : '—';
const planLabel = (plan?: string | null) =>
  plan && plan in PLANS ? PLANS[plan as ProPlanKey].label : (plan || '');

// ── white/copper tokens (retires the gold [data-ciq] system) ──
const card: CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--line-strong)',
  borderRadius: 16, padding: 18, boxShadow: 'var(--shadow-sm)',
};
const kicker: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--ink-3)',
};
const inputStyle: CSSProperties = {
  width: '100%', minHeight: 44, padding: '0 12px', background: 'var(--surface)',
  border: '1px solid var(--line-strong)', borderRadius: 10, color: 'var(--ink)', fontSize: 14,
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [pro, setPro] = useState<ProStatus | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [fields, setFields] = useState<ProfileFields | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', homeCity: '', homeAirport: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [showPaywall, setShowPaywall] = useState(false);
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const loadPro = async () => {
    try { const r = await authedFetch('/api/subscription/status'); if (r.ok) setPro(await r.json()); } catch {}
  };
  const loadOrders = async () => {
    try {
      const r = await authedFetch('/api/user/order-history');
      setOrders(r.ok ? (await r.json()).orders ?? [] : []);
    } catch { setOrders([]); }
  };
  const loadProfile = async () => {
    try {
      const r = await authedFetch('/api/onboarding');
      if (!r.ok) return;
      const p = (await r.json())?.profile ?? {};
      setFields({ display_name: p.display_name ?? null, home_airport: p.home_airport ?? null, home_city: p.home_city ?? null });
    } catch {}
  };

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      setLoading(false);
      void loadPro(); void loadOrders(); void loadProfile();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meta = user?.user_metadata || {};
  const fullName: string = fields?.display_name || meta.full_name || meta.name || 'CreditIQ member';
  const email: string = user?.email || '';
  const avatarUrl: string | null = meta.avatar_url || meta.picture || null;
  const initials =
    (fullName.split(' ').map((p: string) => p[0]).filter(Boolean).slice(0, 2).join('') || 'CI').toUpperCase();

  const startEdit = () => {
    setForm({
      name: fields?.display_name || meta.full_name || '',
      homeCity: fields?.home_city || '',
      homeAirport: fields?.home_airport || '',
    });
    setSaveMsg(null);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      const tasks: Promise<Response>[] = [];
      // Name + airport → partial-update endpoint (never touches date_of_birth).
      const patch: Record<string, string> = {};
      if (form.name.trim() !== (fields?.display_name || '')) patch.displayName = form.name.trim();
      if (form.homeAirport.trim().toUpperCase() !== (fields?.home_airport || '')) patch.homeAirport = form.homeAirport.trim();
      if (Object.keys(patch).length) {
        tasks.push(authedFetch('/api/profile', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
        }));
      }
      // Home city → its own already-partial-safe endpoint.
      if (form.homeCity.trim() !== (fields?.home_city || '')) {
        tasks.push(authedFetch('/api/user-city', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city: form.homeCity.trim() }),
        }));
      }
      if (!tasks.length) { setEditing(false); return; }
      const results = await Promise.all(tasks);
      if (results.some(r => !r.ok)) throw new Error('save failed');
      await loadProfile();
      setEditing(false);
    } catch {
      setSaveMsg('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Entitlement is granted by the Razorpay webhook, which can lag a few seconds after
  // the sheet closes — so we show an honest "activating" note and re-poll, rather than
  // optimistically claiming Pro before pro_until is actually written.
  const onPurchased = () => {
    setActivating(true);
    setTimeout(() => { void loadPro(); void loadOrders(); }, 4000);
    setTimeout(() => { void loadPro(); void loadOrders(); }, 9000);
  };
  useEffect(() => { if (pro?.isPro) setActivating(false); }, [pro?.isPro]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(JOIN_CODE); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setCopied(false); }
  };
  const handleSignOut = async () => { await sb.auth.signOut(); router.replace('/'); };

  if (loading) {
    return (
      <main style={{ padding: '18px clamp(20px, 2.6vw, 48px) 104px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...kicker }}>LOADING</span>
        </div>
      </main>
    );
  }

  return (
    <main className="ciq-product-page" style={{ padding: '18px clamp(20px, 2.6vw, 48px) 104px' }}>
      <PageHeader
        eyebrow="Your CreditIQ"
        title={<>Built around <span style={{ color: 'var(--copper)' }}>you.</span></>}
        subtitle="Keep your identity, home airport, membership and connected services in one private account workspace."
        tone="light"
      />

      <div className="pf-wrap">
        <div className="pf-grid">
          {/* LEFT: identity + membership */}
          <div className="pf-col">
            {/* Avatar card */}
            <section style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={fullName} width={52} height={52}
                    style={{ borderRadius: '50%', border: '1px solid var(--line-strong)', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', background: 'var(--surface-2)',
                    border: '1px solid var(--copper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--copper)',
                  }}>{initials}</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="w-display" style={{ fontWeight: 600, fontSize: 18, letterSpacing: '-.01em', color: 'var(--ink)' }}>{fullName}</div>
                  {email ? (
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                  ) : null}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--line)', margin: '16px 0' }} />
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={kicker}>Member Since</div>
                  <div style={{ fontSize: 15, color: 'var(--ink)', marginTop: 4, fontWeight: 500 }}>{monthYear(user?.created_at) || '—'}</div>
                </div>
                <div>
                  <div style={kicker}>Account Status</div>
                  <div style={{ fontSize: 15, marginTop: 4, fontWeight: 600, color: pro?.isPro ? 'var(--copper)' : 'var(--ink-3)' }}>
                    {pro ? (pro.isPro ? 'Pro' : 'Free') : '—'}
                  </div>
                </div>
              </div>
            </section>

            {/* Membership card */}
            <section style={card}>
              <div style={kicker}>Membership</div>
              {pro?.isPro ? (
                <>
                  <div className="w-display" style={{ fontWeight: 600, fontSize: 20, color: 'var(--ink)', marginTop: 8 }}>CreditIQ Pro</div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 4 }}>
                    {planLabel(pro.plan)} · active until {fullDate(pro.current_period_end)}
                  </div>
                  <button type="button" onClick={() => setShowPaywall(true)} style={{
                    marginTop: 16, minHeight: 44, padding: '0 18px', width: '100%',
                    background: 'transparent', border: '1px solid var(--copper)', borderRadius: 11,
                    color: 'var(--copper)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>Extend membership</button>
                </>
              ) : (
                <>
                  <div className="w-display" style={{ fontWeight: 600, fontSize: 20, color: 'var(--ink)', marginTop: 8 }}>No active membership</div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 4 }}>
                    Unlock Statement Truth, Optimize and the Points Optimizer.
                  </div>
                  <button type="button" onClick={() => setShowPaywall(true)} style={{
                    marginTop: 16, minHeight: 44, padding: '0 18px', width: '100%',
                    background: 'var(--copper)', border: 'none', borderRadius: 11,
                    color: 'var(--surface)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>Get a membership</button>
                </>
              )}
              {activating && !pro?.isPro ? (
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', fontSize: 12.5, color: 'var(--ink-2)' }}>
                  Payment received — activating your membership. It’ll appear here in a few seconds.
                </div>
              ) : null}
            </section>
          </div>

          {/* RIGHT: personal details + transactions */}
          <div className="pf-col">
            {/* Personal Details */}
            <section style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={kicker}>Personal Details</div>
                {!editing ? (
                  <button type="button" onClick={startEdit} style={{
                    background: 'transparent', border: 'none', color: 'var(--copper)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
                  }}>Edit</button>
                ) : null}
              </div>

              {!editing ? (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    ['Name', fullName],
                    ['Email', email || '—'],
                    ['Home city', fields?.home_city || '—'],
                    ['Home airport', fields?.home_airport || '—'],
                  ].map(([k, v]) => (
                    <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{k}</span>
                      <span style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500, textAlign: 'right', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'block' }}>
                    <span style={{ ...kicker, display: 'block', marginBottom: 6 }}>Name</span>
                    <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={80} />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ ...kicker, display: 'block', marginBottom: 6 }}>Email</span>
                    <input style={{ ...inputStyle, background: 'var(--surface-2)', color: 'var(--ink-3)' }} value={email} readOnly disabled />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ ...kicker, display: 'block', marginBottom: 6 }}>Home city</span>
                    <input style={inputStyle} value={form.homeCity} onChange={e => setForm(f => ({ ...f, homeCity: e.target.value }))} placeholder="e.g. Bengaluru" />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ ...kicker, display: 'block', marginBottom: 6 }}>Home airport</span>
                    <input style={inputStyle} value={form.homeAirport} onChange={e => setForm(f => ({ ...f, homeAirport: e.target.value }))} placeholder="e.g. BLR" maxLength={4} />
                  </label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button type="button" onClick={save} disabled={saving} style={{
                      flex: 1, minHeight: 44, background: 'var(--copper)', border: 'none', borderRadius: 11,
                      color: 'var(--surface)', fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
                    }}>{saving ? 'Saving…' : 'Save'}</button>
                    <button type="button" onClick={() => { setEditing(false); setSaveMsg(null); }} disabled={saving} style={{
                      flex: 1, minHeight: 44, background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: 11,
                      color: 'var(--ink-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}>Cancel</button>
                  </div>
                  {saveMsg ? <div style={{ fontSize: 13, color: 'var(--red, #A13020)' }} role="alert">{saveMsg}</div> : null}
                </div>
              )}
            </section>

            {/* Transactions */}
            <section style={card}>
              <div style={kicker}>Transactions</div>
              {orders === null ? (
                <div style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-3)' }}>Loading…</div>
              ) : orders.length === 0 ? (
                <div style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-3)' }}>
                  No transactions yet. When you buy or renew a plan, your receipts will show up here.
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'flex', flexDirection: 'column' }}>
                  {orders.map((o, i) => (
                    <li key={o.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>CreditIQ Pro · {planLabel(o.plan)}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{fullDate(o.created_at)}</div>
                      </div>
                      <div className="mono" style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600, whiteSpace: 'nowrap' }}>{rupees(o.amount_paise)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        {/* Appended: bridge + AskGogo + sign out (kept — no other home in the app) */}
        <div className="pf-appended">
          {/* Referral / Join-code */}
          <section style={card}>
            <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 500 }}>Invite to CreditIQ</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, marginBottom: 14 }}>
              Share your join code. Colleagues connect their workplace in one tap.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', padding: '0 14px', minHeight: 44,
                background: 'var(--surface-2)', border: '1px solid var(--line-strong)', borderRadius: 10,
                fontFamily: 'var(--font-mono)', fontSize: 15, letterSpacing: '0.10em', color: 'var(--copper)',
              }}>{JOIN_CODE}</div>
              <button onClick={handleCopy} style={{
                padding: '0 18px', minHeight: 44, background: 'transparent',
                border: '1px solid var(--line-strong)', borderRadius: 10,
                color: copied ? 'var(--prov-verified)' : 'var(--ink-2)',
                fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s ease',
              }}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
          </section>

          {/* Link WhatsApp — #whatsapp anchor target for the You section's WhatsApp tab. */}
          <div id="whatsapp" style={{ scrollMarginTop: 72 }}>
            <LinkWhatsAppButton sb={sb} />
          </div>

          {/* Sign out */}
          <button onClick={handleSignOut} style={{
            width: '100%', minHeight: 48, background: 'transparent',
            border: '1px solid var(--line-strong)', borderRadius: 14,
            color: 'var(--ink-2)', fontSize: 15, fontWeight: 500, cursor: 'pointer',
          }}>Sign out</button>
        </div>
      </div>

      {showPaywall ? (
        <MembershipModal user={user} onClose={() => setShowPaywall(false)} onPurchased={onPurchased} />
      ) : null}

      <style>{`
        .pf-wrap { width: 100%; }
        .pf-grid { display: grid; grid-template-columns: 1fr; gap: 18px; margin-top: 30px; align-items: start; }
        .pf-col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        .pf-appended { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 18px; align-items: start; }
        @media (min-width: 768px) { .pf-grid { grid-template-columns: minmax(320px, .68fr) minmax(0, 1.32fr); } }
        @media (max-width: 900px) { .pf-appended { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
