'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Plus, Trash2, AlertTriangle, TrendingUp, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';

// ── Loyalty programs data ─────────────────────────────────────
const PROGRAMS = [
  // Airlines
  { id: 'krisflyer', name: 'KrisFlyer', airline: 'Singapore Airlines', type: 'airline', color: '#012169', logo: 'SQ', expiryMonths: 36, expiryNote: 'Miles expire 36 months after earning if no activity', valuePerPoint: 1.6, transferFrom: ['HDFC', 'HSBC', 'Axis', 'AmEx'], sweetSpot: 'BLR-SIN Business: 42,500 miles one-way', loginUrl: 'https://www.singaporeair.com/en_UK/in/home/#/book/bookflight' },
  { id: 'air-india-fr', name: 'Flying Returns', airline: 'Air India', type: 'airline', color: '#B41E2B', logo: 'AI', expiryMonths: 36, expiryNote: 'Miles expire 36 months after last activity', valuePerPoint: 0.8, transferFrom: ['SBI', 'HDFC', 'Axis'], sweetSpot: 'DEL-LHR Business: 62,500 miles one-way', loginUrl: 'https://www.airindia.com/in/en/flying-returns.html' },
  { id: '6e-rewards', name: 'IndiGo 6E Rewards', airline: 'IndiGo', type: 'airline', color: '#0048DB', logo: 'IG', expiryMonths: 24, expiryNote: 'Miles expire 24 months from earning date', valuePerPoint: 0.5, transferFrom: ['HDFC', 'ICICI', 'SBI'], sweetSpot: 'BLR-DEL domestic: 8,000 miles one-way', loginUrl: 'https://www.goindigo.in/6e-rewards.html' },
  { id: 'turkish-miles', name: 'Miles & Smiles', airline: 'Turkish Airlines', type: 'airline', color: '#C8102E', logo: 'TK', expiryMonths: 36, expiryNote: 'Miles expire if no activity for 3 years', valuePerPoint: 1.5, transferFrom: ['Axis'], sweetSpot: 'IST-JFK Business: 45,000 miles one-way', loginUrl: 'https://www.turkishairlines.com/en-in/miles-and-smiles/' },
  { id: 'emirates-skywards', name: 'Skywards', airline: 'Emirates', type: 'airline', color: '#C69214', logo: 'EK', expiryMonths: 36, expiryNote: 'Miles valid for 36 months with activity', valuePerPoint: 1.2, transferFrom: ['AmEx', 'HSBC'], sweetSpot: 'BOM-DXB Business: 35,000 miles one-way', loginUrl: 'https://www.emirates.com/in/english/skywards/' },
  { id: 'etihad-guest', name: 'Etihad Guest', airline: 'Etihad Airways', type: 'airline', color: '#B8A06A', logo: 'EY', expiryMonths: 18, expiryNote: 'Miles expire 18 months from earning — shortest expiry!', valuePerPoint: 1.1, transferFrom: ['IndusInd', 'BOB'], sweetSpot: 'BOM-AUH-LHR Business via AUH', loginUrl: 'https://www.etihad.com/en-in/etihad-guest/' },
  { id: 'british-avios', name: 'Executive Club (Avios)', airline: 'British Airways', type: 'airline', color: '#075AAA', logo: 'BA', expiryMonths: 36, expiryNote: 'Avios never expire with any account activity in 36 months', valuePerPoint: 1.5, transferFrom: ['AmEx', 'HSBC', 'Axis'], sweetSpot: 'Short-haul Europe hops from London: 4,500 Avios', loginUrl: 'https://www.britishairways.com/en-in/executive-club/avios' },
  { id: 'vistara-cv', name: 'Air India FR (ex-CV)', airline: 'Air India (ex-Vistara)', type: 'airline', color: '#6D2077', logo: 'VA', expiryMonths: 36, expiryNote: 'CV Points converted to Air India Flying Returns Nov 2024', valuePerPoint: 0.8, transferFrom: ['Axis', 'SBI', 'ICICI'], sweetSpot: 'Converted to Air India FR — use for Air India routes', loginUrl: 'https://www.airindia.com/in/en/flying-returns.html' },
  // Hotels
  { id: 'marriott-bonvoy', name: 'Marriott Bonvoy', airline: 'Marriott International', type: 'hotel', color: '#8B1D1D', logo: 'MB', expiryMonths: 24, expiryNote: 'Points expire after 24 months of inactivity', valuePerPoint: 0.7, transferFrom: ['HDFC', 'AmEx', 'Axis', 'HSBC'], sweetSpot: 'Cat 1-4 India hotels: 7,500-17,000 pts/night', loginUrl: 'https://www.marriott.com/loyalty/redeem/travel/redeemPointsForHotels.mi' },
  { id: 'ihg-rewards', name: 'IHG One Rewards', airline: 'IHG Hotels', type: 'hotel', color: '#003087', logo: 'IH', expiryMonths: 12, expiryNote: 'Points expire after 12 months of inactivity — shortest hotel expiry!', valuePerPoint: 0.4, transferFrom: ['HSBC', 'AmEx'], sweetSpot: 'Holiday Inn India: 15,000-25,000 pts/night', loginUrl: 'https://www.ihg.com/onerewards/content/in/en/home' },
  { id: 'hilton-honors', name: 'Hilton Honors', airline: 'Hilton Hotels', type: 'hotel', color: '#002F61', logo: 'HH', expiryMonths: 24, expiryNote: 'Points expire after 24 months of inactivity', valuePerPoint: 0.4, transferFrom: ['AmEx'], sweetSpot: 'Cat 1-3 properties in India: 5,000-15,000 pts/night', loginUrl: 'https://www.hilton.com/en/hilton-honors/' },
  { id: 'taj-innercircle', name: 'Taj InnerCircle', airline: 'Taj Hotels', type: 'hotel', color: '#8B6914', logo: 'TJ', expiryMonths: 12, expiryNote: 'Points expire 12 months after earning — very short!', valuePerPoint: 0.6, transferFrom: ['AmEx', 'HDFC'], sweetSpot: 'Taj properties in India: 10,000-40,000 pts/night', loginUrl: 'https://www.tajhotels.com/en-in/taj-inner-circle/' },
];

interface LoyaltyBalance {
  id: string;
  programId: string;
  balance: number;
  expiryDate?: string;
  membershipId?: string;
  lastUpdated: string;
}

function getExpiryStatus(expiryDate?: string): { label: string; color: string; urgent: boolean } {
  if (!expiryDate) return { label: 'No expiry set', color: '#5A6A8A', urgent: false };
  const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: 'Expired!', color: '#B84230', urgent: true };
  if (days <= 30) return { label: `Expires in ${days} days!`, color: '#B84230', urgent: true };
  if (days <= 90) return { label: `Expires in ${days} days`, color: '#C9972E', urgent: true };
  if (days <= 180) return { label: `Expires in ${Math.ceil(days/30)} months`, color: '#C9972E', urgent: false };
  return { label: `Expires ${new Date(expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`, color: '#2d7a56', urgent: false };
}

export default function LoyaltyTrackerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balances, setBalances] = useState<LoyaltyBalance[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [balance, setBalance] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [membershipId, setMembershipId] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'airline' | 'hotel'>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
      loadBalances(user.id);
    });
  }, []);

  const loadBalances = async (userId: string) => {
    const saved = localStorage.getItem(`loyalty_${userId}`);
    if (saved) setBalances(JSON.parse(saved));
  };

  const saveBalance = async () => {
    if (!selectedProgram || !balance) return;
    setSaving(true);
    const newBalance: LoyaltyBalance = {
      id: Date.now().toString(),
      programId: selectedProgram,
      balance: parseInt(balance.replace(/,/g, '')),
      expiryDate: expiryDate || undefined,
      membershipId: membershipId || undefined,
      lastUpdated: new Date().toISOString(),
    };
    const updated = [...balances.filter(b => b.programId !== selectedProgram), newBalance];
    setBalances(updated);
    if (user) localStorage.setItem(`loyalty_${user.id}`, JSON.stringify(updated));
    setShowAdd(false);
    setSelectedProgram('');
    setBalance('');
    setExpiryDate('');
    setMembershipId('');
    setSaving(false);
  };

  const deleteBalance = (id: string) => {
    const updated = balances.filter(b => b.id !== id);
    setBalances(updated);
    if (user) localStorage.setItem(`loyalty_${user.id}`, JSON.stringify(updated));
  };

  // Calculate totals
  const totalValueInr = balances.reduce((sum, b) => {
    const prog = PROGRAMS.find(p => p.id === b.programId);
    return sum + (prog ? b.balance * prog.valuePerPoint : 0);
  }, 0);

  const urgentExpiries = balances.filter(b => {
    if (!b.expiryDate) return false;
    const days = Math.floor((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
    return days <= 90;
  });

  const filteredPrograms = PROGRAMS.filter(p =>
    filterType === 'all' ? true : p.type === filterType
  );

  const trackedProgramIds = new Set(balances.map(b => b.programId));

  return (
    <>
      <Header />
      <div className="page-fade" style={{ paddingTop: 'clamp(100px,14vw,140px)', paddingBottom: 80 }}>
        <div className="shell">

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'var(--copper,#8C5F12)', marginBottom: 12 }}>
              MY WALLET · LOYALTY PROGRAMS
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: 'var(--ink,#142950)', letterSpacing: '-0.03em', margin: 0 }}>
                  Loyalty Programs
                </h1>
                <p style={{ fontSize: 15, color: 'var(--ink-3,#5A6A8A)', marginTop: 8 }}>
                  Track all your airline miles and hotel points in one place. Free, forever.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link href="/dashboard" style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid var(--line,rgba(20,41,80,0.12))', fontSize: 13, fontWeight: 600, color: 'var(--ink-2,#2A3F6B)', textDecoration: 'none', background: 'var(--surface,#fff)' }}>
                  ← My Cards
                </Link>
                <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'var(--ink,#142950)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={14} /> Add program
                </button>
              </div>
            </div>
          </div>

          {/* Urgent expiry alerts */}
          {urgentExpiries.length > 0 && (
            <div style={{ background: 'rgba(184,66,48,0.08)', border: '1px solid rgba(184,66,48,0.25)', borderRadius: 16, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <AlertTriangle size={18} style={{ color: '#B84230', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#B84230' }}>
                  {urgentExpiries.length} program{urgentExpiries.length > 1 ? 's' : ''} expiring soon — act now!
                </span>
              </div>
              {urgentExpiries.map(b => {
                const prog = PROGRAMS.find(p => p.id === b.programId);
                const status = getExpiryStatus(b.expiryDate);
                return prog ? (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(184,66,48,0.12)' }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)' }}>{prog.name} ({prog.airline})</span>
                      <span style={{ fontSize: 13, color: '#B84230', marginLeft: 8, fontWeight: 600 }}>{status.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--copper-3,#D89B2A)', fontFamily: 'var(--font-mono,monospace)' }}>
                        {b.balance.toLocaleString('en-IN')} pts
                      </span>
                      <a href={prog.loginUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', background: '#B84230', color: '#fff', borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                        Redeem now →
                      </a>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}

          {/* Summary cards */}
          {balances.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'Programs tracked', value: balances.length.toString(), sub: `across ${new Set(balances.map(b => PROGRAMS.find(p=>p.id===b.programId)?.type)).size} types` },
                { label: 'Total estimated value', value: `₹${(totalValueInr/1000).toFixed(0)}K`, sub: 'via best redemption' },
                { label: 'Expiring soon', value: urgentExpiries.length.toString(), sub: 'within 90 days', alert: urgentExpiries.length > 0 },
                { label: 'Highest value', value: balances.length > 0 ? (() => { const top = balances.reduce((a,b) => { const ap = PROGRAMS.find(p=>p.id===a.programId); const bp = PROGRAMS.find(p=>p.id===b.programId); return (ap?a.balance*ap.valuePerPoint:0) > (bp?b.balance*bp.valuePerPoint:0) ? a : b; }); const prog = PROGRAMS.find(p=>p.id===top.programId); return prog?.name.split(' ')[0] || '-'; })() : '-', sub: 'by rupee value' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--paper,#FAF5EB)', border: `1px solid ${s.alert ? 'rgba(184,66,48,0.25)' : 'var(--line,rgba(20,41,80,0.08))'}`, borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--ink-3,#5A6A8A)', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.alert ? '#B84230' : 'var(--ink,#142950)', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--paper,#FAF5EB)', padding: 4, borderRadius: 12, border: '1px solid var(--line,rgba(20,41,80,0.08))', width: 'fit-content' }}>
            {(['all', 'airline', 'hotel'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: filterType === t ? 'var(--ink,#142950)' : 'transparent',
                color: filterType === t ? '#fff' : 'var(--ink-2,#2A3F6B)',
              }}>
                {t === 'all' ? 'All programs' : t === 'airline' ? '✈ Airlines' : '🏨 Hotels'}
              </button>
            ))}
          </div>

          {/* Programs grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16, marginBottom: 32 }}>
            {filteredPrograms.map(prog => {
              const tracked = balances.find(b => b.programId === prog.id);
              const status = tracked ? getExpiryStatus(tracked.expiryDate) : null;
              const valueInr = tracked ? tracked.balance * prog.valuePerPoint : 0;

              return (
                <div key={prog.id} style={{
                  background: 'var(--paper,#FAF5EB)',
                  border: `1px solid ${tracked ? (status?.urgent ? 'rgba(184,66,48,0.30)' : 'rgba(201,151,46,0.30)') : 'var(--line,rgba(20,41,80,0.08))'}`,
                  borderRadius: 18,
                  overflow: 'hidden',
                  opacity: tracked ? 1 : 0.7,
                }}>
                  {/* Program header */}
                  <div style={{ padding: '14px 18px', background: prog.color + '15', borderBottom: '1px solid var(--line,rgba(20,41,80,0.06))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: prog.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono,monospace)' }}>
                        {prog.logo}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)' }}>{prog.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>{prog.airline}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono,monospace)', textTransform: 'uppercase' as const, background: prog.type === 'airline' ? 'rgba(14,165,233,0.12)' : 'rgba(201,151,46,0.12)', color: prog.type === 'airline' ? '#0369a1' : 'var(--copper,#8C5F12)' }}>
                        {prog.type}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '14px 18px' }}>
                    {tracked ? (
                      <>
                        {/* Balance */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: 'var(--ink-3,#5A6A8A)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Balance</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--copper-3,#D89B2A)', fontVariantNumeric: 'tabular-nums' }}>
                              {tracked.balance.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>≈ ₹{valueInr.toLocaleString('en-IN')} value</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: 'var(--ink-3,#5A6A8A)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Expiry</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: status?.color }}>
                              {status?.label}
                            </div>
                          </div>
                        </div>

                        {/* Sweet spot */}
                        <div style={{ background: 'rgba(20,41,80,0.04)', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
                          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono,monospace)', color: 'var(--ink-3,#5A6A8A)', marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Sweet spot</div>
                          <div style={{ fontSize: 12, color: 'var(--ink-2,#2A3F6B)' }}>{prog.sweetSpot}</div>
                        </div>

                        {/* Expiry warning */}
                        <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginBottom: 12, fontStyle: 'italic' }}>
                          ⚠ {prog.expiryNote}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <a href={prog.loginUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '8px 12px', background: prog.color, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            Redeem <ExternalLink size={10} />
                          </a>
                          <button onClick={() => { setSelectedProgram(prog.id); setBalance(tracked.balance.toString()); setExpiryDate(tracked.expiryDate || ''); setShowAdd(true); }} style={{ padding: '8px 12px', background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.12))', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--ink-2,#2A3F6B)' }}>
                            Edit
                          </button>
                          <button onClick={() => deleteBalance(tracked.id)} style={{ padding: '8px 10px', background: 'rgba(184,66,48,0.08)', border: '1px solid rgba(184,66,48,0.20)', borderRadius: 8, cursor: 'pointer', color: '#B84230' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', marginBottom: 10, lineHeight: 1.6 }}>
                          {prog.sweetSpot}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginBottom: 12 }}>
                          <span style={{ fontWeight: 600 }}>Transfer from:</span> {prog.transferFrom.join(', ')}
                        </div>
                        <button onClick={() => { setSelectedProgram(prog.id); setShowAdd(true); }} style={{ width: '100%', padding: '9px', background: 'transparent', border: `1.5px dashed ${prog.color}40`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: prog.color }}>
                          + Add my {prog.name} balance
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transfer partners quick reference */}
          <div style={{ background: 'var(--ink,#142950)', borderRadius: 20, padding: 'clamp(24px,4vw,40px)', position: 'relative', overflow: 'hidden', marginBottom: 32 }}>
            <div className="aurora" style={{ top: -40, right: -40, width: 300, height: 300, background: 'radial-gradient(circle,rgba(212,163,115,0.20),transparent 60%)' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Transfer your credit card points</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '0 0 20px' }}>Transferring to airline miles gives 2-3x more value than cashback. Always transfer for a confirmed booking — transfers are irreversible.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
                {[
                  { bank: 'HDFC', programs: 'KrisFlyer (1:1) · Marriott (1:1) · Flying Returns', color: '#004C8F' },
                  { bank: 'Axis', programs: 'KrisFlyer (1.33:1) · Turkish (1:1) · Flying Blue (1:1)', color: '#97144D' },
                  { bank: 'AmEx', programs: 'Avios (1:1) · Marriott (1:1) · Taj (1:1)', color: '#006FCF' },
                  { bank: 'HSBC', programs: 'KrisFlyer (1:1) · Avios (1:1) · Cathay (1:1)', color: '#c41e3a' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{item.bank}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{item.programs}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <Link href="/transfer-partners" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--copper-3,#D89B2A)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Full transfer partner guide →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 480, border: '1px solid var(--line,rgba(20,41,80,0.10))' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 20px', letterSpacing: '-0.02em' }}>
              {selectedProgram ? `Update ${PROGRAMS.find(p => p.id === selectedProgram)?.name}` : 'Add loyalty program'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!selectedProgram && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3,#5A6A8A)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>Program</label>
                  <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--line,rgba(20,41,80,0.12))', fontSize: 14, color: 'var(--ink,#142950)', background: 'var(--surface,#fff)', outline: 'none' }}>
                    <option value="">Select program...</option>
                    <optgroup label="Airlines">
                      {PROGRAMS.filter(p => p.type === 'airline').map(p => <option key={p.id} value={p.id}>{p.name} — {p.airline}</option>)}
                    </optgroup>
                    <optgroup label="Hotels">
                      {PROGRAMS.filter(p => p.type === 'hotel').map(p => <option key={p.id} value={p.id}>{p.name} — {p.airline}</option>)}
                    </optgroup>
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3,#5A6A8A)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>Points / Miles balance</label>
                <input type="number" placeholder="e.g. 45000" value={balance} onChange={e => setBalance(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--line,rgba(20,41,80,0.12))', fontSize: 14, color: 'var(--ink,#142950)', background: 'var(--surface,#fff)', outline: 'none', boxSizing: 'border-box' as const }} />
                {selectedProgram && balance && (
                  <div style={{ fontSize: 12, color: 'var(--copper,#8C5F12)', marginTop: 6, fontWeight: 600 }}>
                    ≈ ₹{(parseInt(balance) * (PROGRAMS.find(p => p.id === selectedProgram)?.valuePerPoint || 0)).toLocaleString('en-IN')} estimated value via best redemption
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3,#5A6A8A)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>
                  Miles expiry date <span style={{ color: 'var(--ink-3,#5A6A8A)', fontWeight: 400 }}>(optional but recommended)</span>
                </label>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--line,rgba(20,41,80,0.12))', fontSize: 14, color: 'var(--ink,#142950)', background: 'var(--surface,#fff)', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3,#5A6A8A)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>
                  Membership ID <span style={{ fontWeight: 400 }}>(optional)</span>
                </label>
                <input type="text" placeholder="e.g. KF123456789" value={membershipId} onChange={e => setMembershipId(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--line,rgba(20,41,80,0.12))', fontSize: 14, color: 'var(--ink,#142950)', background: 'var(--surface,#fff)', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1.5px solid var(--line,rgba(20,41,80,0.12))', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--ink-3,#5A6A8A)' }}>
                  Cancel
                </button>
                <button onClick={saveBalance} disabled={!selectedProgram || !balance || saving} style={{ flex: 2, padding: '12px', background: 'var(--ink,#142950)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: (!selectedProgram || !balance) ? 0.5 : 1 }}>
                  {saving ? 'Saving...' : 'Save balance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <DesignFooter />
    </>
  );
}
