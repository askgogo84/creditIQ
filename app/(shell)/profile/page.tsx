'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { authedFetch } from '@/lib/authed-fetch';
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
  const [profileTab, setProfileTab] = useState<'personal' | 'preferences' | 'notifications' | 'privacy'>('personal');

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
    <main className="ciq-approved-stage ciq-approved-profile">
      <header className="approved-page-header"><div><span className="approved-eyebrow">Your CreditIQ</span><h1>Profile &amp; preferences</h1><p>Control how CreditIQ personalises recommendations and protects your data.</p></div>{editing && <button type="button" className="approved-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>}</header>
      <div className="approved-profile-layout">
        <aside className="approved-profile-nav" aria-label="Profile sections">
          {([['personal','Personal details'],['preferences','Rewards preferences'],['notifications','Notifications'],['privacy','Privacy & security']] as const).map(([key,label]) => <button type="button" key={key} className={profileTab === key ? 'active' : undefined} onClick={() => setProfileTab(key)}>{label}</button>)}
        </aside>
        <div className="approved-profile-panels">
          {profileTab === 'personal' && <section className="approved-profile-panel">
            <div className="approved-profile-panel-head"><div><h2>Personal details</h2><p>Used to personalise your CreditIQ experience.</p></div>{avatarUrl ? <img src={avatarUrl} alt={fullName} width={54} height={54} /> : <span>{initials}</span>}</div>
            {!editing ? <div className="approved-profile-details">{[['Full name',fullName],['Email address',email || '—'],['Home city',fields?.home_city || '—'],['Home airport',fields?.home_airport || '—']].map(([label,value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}<button type="button" className="approved-secondary" onClick={startEdit}>Edit details</button></div> : <div className="approved-profile-form"><label><span>Full name</span><input value={form.name} onChange={event => setForm(value => ({ ...value, name:event.target.value }))} /></label><label><span>Email address</span><input value={email} disabled /></label><label><span>Home city</span><input value={form.homeCity} onChange={event => setForm(value => ({ ...value, homeCity:event.target.value }))} /></label><label><span>Home airport</span><input value={form.homeAirport} onChange={event => setForm(value => ({ ...value, homeAirport:event.target.value }))} maxLength={4} /></label><button type="button" className="approved-secondary" onClick={() => setEditing(false)}>Cancel</button>{saveMsg && <p role="alert">{saveMsg}</p>}</div>}
          </section>}
          {profileTab === 'preferences' && <section className="approved-profile-panel">
            <div className="approved-profile-panel-head"><div><h2>Rewards preferences</h2><p>Membership and travel defaults for your recommendations.</p></div></div>
            <div className="approved-preference-list"><div><span><b>Membership</b><small>{pro?.isPro ? `${planLabel(pro.plan)} · active until ${fullDate(pro.current_period_end)}` : 'Free account'}</small></span><button type="button" className="approved-secondary" onClick={() => setShowPaywall(true)}>{pro?.isPro ? 'Extend' : 'View plans'}</button></div><div><span><b>Home airport</b><small>{fields?.home_airport || 'Not set'}</small></span><button type="button" className="approved-secondary" onClick={() => { startEdit(); setProfileTab('personal'); }}>Change</button></div><div><span><b>Primary goal</b><small>Maximum travel value</small></span><span className="approved-profile-status">Default</span></div>{activating && <p>Payment received — activating your membership.</p>}</div>
          </section>}
          {profileTab === 'notifications' && <section className="approved-profile-panel">
            <div className="approved-profile-panel-head"><div><h2>Notifications</h2><p>Choose where CreditIQ can keep you informed.</p></div></div>
            <div id="whatsapp" className="approved-profile-connection"><LinkWhatsAppButton sb={sb} /></div>
            <div className="approved-toggle-list"><div><span><b>Points expiry alerts</b><small>Important reminders before rewards expire.</small></span><i className="on" /></div><div><span><b>High-value redemption alerts</b><small>Sweet spots matched to your wallet.</small></span><i className="on" /></div><div><span><b>Statement refresh reminders</b><small>Know when a balance may be stale.</small></span><i /></div></div>
          </section>}
          {profileTab === 'privacy' && <section className="approved-profile-panel">
            <div className="approved-profile-panel-head"><div><h2>Privacy &amp; security</h2><p>Your financial documents remain under your control.</p></div></div>
            <div className="approved-security-list"><div><span><b>Account security</b><small>Signed in as {email}</small></span><button type="button" className="approved-secondary" onClick={handleSignOut}>Sign out</button></div><div><span><b>Transactions</b><small>{orders === null ? 'Loading…' : `${orders.length} membership transaction${orders.length === 1 ? '' : 's'}`}</small></span><span className="approved-profile-status">Private</span></div><div><span><b>Invite to CreditIQ</b><small>Join code {JOIN_CODE}</small></span><button type="button" className="approved-secondary" onClick={handleCopy}>{copied ? 'Copied' : 'Copy code'}</button></div></div>
            {orders && orders.length > 0 && <ul className="approved-orders">{orders.map(order => <li key={order.id}><span>CreditIQ Pro · {planLabel(order.plan)}<small>{fullDate(order.created_at)}</small></span><b>{rupees(order.amount_paise)}</b></li>)}</ul>}
          </section>}
        </div>
      </div>
      {showPaywall && <MembershipModal user={user} onClose={() => setShowPaywall(false)} onPurchased={onPurchased} />}
    </main>
  );
}
