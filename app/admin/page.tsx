'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import {
  Lock, RefreshCw, Database, Eye, EyeOff,
  AlertTriangle, CheckCircle, Clock, Activity,
  TrendingDown, Search, Play, Zap
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface CronLog { id: string; job: string; result: any; ran_at: string }
interface DevalEvent { id: string; card_name: string; bank: string; category: string; description: string; impact: string; date: string; status: string; detected_at: string }
interface PendingCard { id: string; slug: string; name: string; bank: string; annual_fee_inr: number; tier: string; status: string; discovered_at: string }

const IMPACT_COLOR: Record<string, string> = {
  high: '#B84230', medium: 'var(--copper,#8C5F12)', low: '#2d7a56',
};
const STATUS_COLOR: Record<string, string> = {
  detected: '#0369a1', confirmed: 'var(--copper,#8C5F12)', published: '#2d7a56', dismissed: 'var(--ink-3,#5A6A8A)',
};

// ── Stat Card ─────────────────────────────────────────────────
function Stat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: color ?? 'var(--ink,#142950)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'devaluations' | 'pending' | 'cards' | 'logs'>('overview');

  // Data state
  const [cronLogs, setCronLogs] = useState<CronLog[]>([]);
  const [devalEvents, setDevalEvents] = useState<DevalEvent[]>([]);
  const [pendingCards, setPendingCards] = useState<PendingCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('CreditIQ-admin') === '1') {
      setAuthed(true);
    }
  }, []);

  const checkPassword = async () => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      sessionStorage.setItem('CreditIQ-admin', '1');
    } else {
      setError('Wrong password');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pipeline-data', {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('CreditIQ-admin-token') || password}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCronLogs(data.cronLogs || []);
        setDevalEvents(data.devalEvents || []);
        setPendingCards(data.pendingCards || []);
      }
    } catch {}
    setLoading(false);
  }, [password]);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  const triggerJob = async (job: 'scrape' | 'cards-sync' | 'detect-devaluations', bank?: string) => {
    setTriggerStatus(`Starting ${job}...`);
    try {
      const url = job === 'scrape'
        ? `/api/scrape${bank ? `?bank=${bank}` : ''}`
        : job === 'cards-sync' ? '/api/cards-sync' : '/api/cron/detect-devaluations';
      const method = job === 'detect-devaluations' ? 'GET' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'CreditIQ-cron-2026'}` },
      });
      const data = await res.json();
      setTriggerStatus(data.message || JSON.stringify(data));
      setTimeout(loadData, 5000);
    } catch (e: any) {
      setTriggerStatus(`Error: ${e.message}`);
    }
  };

  const updateDevalStatus = async (id: string, status: string) => {
    await fetch('/api/admin/update-deval', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    loadData();
  };

  const publishPendingCard = async (id: string) => {
    await fetch('/api/admin/publish-card', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  const filteredCards = SEED_CARDS.filter(c =>
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lastScrape = cronLogs.find(l => l.job === 'scrape');
  const lastDetect = cronLogs.find(l => l.job === 'detect-devaluations');
  const highDevals = devalEvents.filter(d => d.impact === 'high' && d.status === 'detected').length;

  // ── Login screen ────────────────────────────────────────────
  if (!authed) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 16px 60px' }}>
          <div style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 20, padding: 40, width: '100%', maxWidth: 400 }}>
            <Lock style={{ width: 28, height: 28, color: 'var(--copper,#8C5F12)', marginBottom: 16 }} />
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Admin</h1>
            <p style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', margin: '0 0 24px' }}>CreditIQ internal panel</p>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input type={showPwd ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkPassword()}
                placeholder="Admin password"
                style={{ width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10, border: '1.5px solid var(--line,rgba(20,41,80,0.12))', fontSize: 14, color: 'var(--ink,#142950)', background: 'var(--surface,#fff)', outline: 'none', boxSizing: 'border-box' as const }} />
              <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3,#5A6A8A)' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <p style={{ color: '#B84230', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button onClick={checkPassword} style={{ width: '100%', padding: '12px', background: 'var(--ink,#142950)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Sign in
            </button>
          </div>
        </div>
        <DesignFooter />
      </>
    );
  }

  // ── Admin dashboard ─────────────────────────────────────────
  return (
    <>
      <Header />
      <div className="page-fade" style={{ paddingTop: 'clamp(80px,12vw,100px)', paddingBottom: 80 }}>
        <div className="shell">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 6 }}>Internal</div>
              <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: 0, letterSpacing: '-0.03em' }}>
                CreditIQ <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>Control</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.12))', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--ink,#142950)' }}>
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
              </button>
              <button onClick={() => { sessionStorage.removeItem('CreditIQ-admin'); setAuthed(false); }} style={{ padding: '10px 18px', background: 'transparent', border: '1.5px solid var(--line,rgba(20,41,80,0.12))', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--ink-3,#5A6A8A)' }}>
                Sign out
              </button>
            </div>
          </div>

          {/* Alert banner */}
          {highDevals > 0 && (
            <div style={{ background: 'rgba(184,66,48,0.08)', border: '1px solid rgba(184,66,48,0.25)', borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle style={{ width: 18, height: 18, color: '#B84230', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 14, color: '#B84230', fontWeight: 600 }}>
                {highDevals} high-impact devaluation{highDevals > 1 ? 's' : ''} detected — review and publish
              </p>
              <button onClick={() => setActiveTab('devaluations')} style={{ marginLeft: 'auto', padding: '6px 14px', background: '#B84230', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                Review now
              </button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--paper,#FAF5EB)', padding: 4, borderRadius: 12, border: '1px solid var(--line,rgba(20,41,80,0.08))', width: 'fit-content', flexWrap: 'wrap' }}>
            {([
              ['overview', 'Overview', Activity],
              ['devaluations', `Devaluations ${devalEvents.filter(d => d.status === 'detected').length > 0 ? `(${devalEvents.filter(d => d.status === 'detected').length})` : ''}`, TrendingDown],
              ['pending', `Pending Cards ${pendingCards.length > 0 ? `(${pendingCards.length})` : ''}`, Zap],
              ['cards', `Cards (${SEED_CARDS.length})`, Database],
              ['logs', 'Cron Logs', Clock],
            ] as [string, string, any][]).map(([tab, label, Icon]) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === tab ? 'var(--ink,#142950)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--ink-2,#2A3F6B)',
              }}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                <Stat label="Total Cards" value={SEED_CARDS.length} sub="in seed database" />
                <Stat label="Devaluations" value={devalEvents.filter(d => d.status === 'detected').length} sub="awaiting review" color={devalEvents.filter(d => d.status === 'detected').length > 0 ? '#B84230' : undefined} />
                <Stat label="Pending Cards" value={pendingCards.length} sub="from discovery" color={pendingCards.length > 0 ? 'var(--copper,#8C5F12)' : undefined} />
                <Stat label="Last Scrape" value={lastScrape ? new Date(lastScrape.ran_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'} sub={lastScrape ? new Date(lastScrape.ran_at).toLocaleDateString('en-IN') : 'Never run'} />
                <Stat label="Last Detection" value={lastDetect ? new Date(lastDetect.ran_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'} sub={lastDetect ? `${lastDetect.result?.checked || 0} pages checked` : 'Never run'} />
              </div>

              {/* Manual triggers */}
              <div style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 18, padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 6, letterSpacing: '-0.01em' }}>Manual triggers</div>
                <p style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', margin: '0 0 20px' }}>Run any pipeline job immediately without waiting for the cron schedule.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: '🔍 Scrape All Banks', job: 'scrape' as const, desc: 'Fetches all 12 bank pages + Claude AI parse' },
                    { label: '🆕 Discover New Cards', job: 'cards-sync' as const, desc: 'Scans Paisabazaar + Finology for new cards' },
                    { label: '⚠️ Detect Devaluations', job: 'detect-devaluations' as const, desc: 'Diffs yesterday vs today snapshots' },
                  ].map(({ label, job, desc }) => (
                    <button key={job} onClick={() => triggerJob(job)} style={{ padding: '14px 16px', background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 12, textAlign: 'left', cursor: 'pointer' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)' }}>{desc}</div>
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2,#2A3F6B)', marginBottom: 10 }}>Scrape specific bank:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'AmEx', 'IDFC', 'RBL', 'Yes', 'IndusInd', 'SC', 'AU', 'HSBC', 'BOB', 'Federal'].map(bank => (
                      <button key={bank} onClick={() => triggerJob('scrape', bank)} style={{ padding: '6px 14px', background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.10))', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--ink-2,#2A3F6B)', cursor: 'pointer' }}>
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>

                {triggerStatus && (
                  <div style={{ padding: '12px 16px', background: 'var(--ink,#142950)', borderRadius: 10, fontFamily: 'var(--font-mono,monospace)', fontSize: 12, color: 'var(--copper-3,#D89B2A)', marginTop: 12 }}>
                    {triggerStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DEVALUATIONS TAB ── */}
          {activeTab === 'devaluations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {devalEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--paper,#FAF5EB)', borderRadius: 18, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <CheckCircle style={{ width: 40, height: 40, color: '#2d7a56', margin: '0 auto 16px' }} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#142950)', margin: '0 0 6px' }}>No devaluations detected yet</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', margin: 0 }}>First detection run will compare today vs tomorrow. Check back after 6am IST tomorrow.</p>
                </div>
              ) : (
                devalEvents.map(d => (
                  <div key={d.id} style={{ background: 'var(--paper,#FAF5EB)', border: `1px solid ${IMPACT_COLOR[d.impact] || 'var(--line)'}30`, borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 4 }}>{d.card_name} · {d.bank}</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.6 }}>{d.description}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono,monospace)', textTransform: 'uppercase', background: `${IMPACT_COLOR[d.impact]}15`, color: IMPACT_COLOR[d.impact] }}>
                          {d.impact} impact
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono,monospace)', textTransform: 'uppercase', background: `${STATUS_COLOR[d.status]}15`, color: STATUS_COLOR[d.status] }}>
                          {d.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)' }}>
                        Detected: {new Date(d.detected_at).toLocaleString('en-IN')}
                      </span>
                      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                        {['confirmed', 'published', 'dismissed'].map(s => (
                          <button key={s} onClick={() => updateDevalStatus(d.id, s)} style={{
                            padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line,rgba(20,41,80,0.12))', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            background: d.status === s ? 'var(--ink,#142950)' : 'var(--surface,#fff)',
                            color: d.status === s ? '#fff' : 'var(--ink-2,#2A3F6B)',
                          }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── PENDING CARDS TAB ── */}
          {activeTab === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--paper,#FAF5EB)', borderRadius: 18, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#142950)', margin: '0 0 6px' }}>No pending cards</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', margin: 0 }}>New cards discovered by the AI will appear here for review before publishing.</p>
                </div>
              ) : (
                pendingCards.map(card => (
                  <div key={card.id} style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 4 }}>{card.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>
                        {card.bank} · {card.tier} · Rs.{card.annual_fee_inr}/yr · Discovered {new Date(card.discovered_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => publishPendingCard(card.id)} style={{ padding: '8px 18px', background: '#2d7a56', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Publish
                      </button>
                      <button onClick={() => updateDevalStatus(card.id, 'dismissed')} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--line,rgba(20,41,80,0.12))', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: 'var(--ink-3,#5A6A8A)' }}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── CARDS TAB ── */}
          {activeTab === 'cards' && (
            <div>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--ink-3,#5A6A8A)' }} />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search cards or banks..."
                  style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1.5px solid var(--line,rgba(20,41,80,0.12))', fontSize: 14, color: 'var(--ink,#142950)', background: 'var(--surface,#fff)', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              <div style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 18, border: '1px solid var(--line,rgba(20,41,80,0.08))', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 60px 100px', padding: '10px 20px', borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))', background: 'var(--surface,#fff)' }}>
                  {['Bank', 'Card', 'Tier', 'Rate', 'Verified'].map(h => (
                    <div key={h} style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)' }}>{h}</div>
                  ))}
                </div>
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  {filteredCards.map((c, i) => (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 60px 100px', padding: '11px 20px', borderBottom: i < filteredCards.length - 1 ? '1px solid var(--line,rgba(20,41,80,0.06))' : 'none', alignItems: 'center', background: i % 2 === 0 ? 'var(--paper,#FAF5EB)' : 'var(--surface,#fff)' }}>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)', fontWeight: 600 }}>{c.bank}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink,#142950)' }}>{c.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)' }}>{c.tier}</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 12, fontWeight: 700, color: 'var(--copper-3,#D89B2A)' }}>{c.base_reward_rate}%</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: c.last_verified ? '#2d7a56' : '#B84230' }}>
                        {c.last_verified ? new Date(c.last_verified).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }) : 'Not set'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── LOGS TAB ── */}
          {activeTab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cronLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--paper,#FAF5EB)', borderRadius: 18, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#142950)', margin: '0 0 6px' }}>No logs yet</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', margin: 0 }}>Cron logs will appear here after the first pipeline run (tonight at 2am IST).</p>
                </div>
              ) : (
                cronLogs.map(log => (
                  <div key={log.id} style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 4 }}>{log.job}</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>
                        {JSON.stringify(log.result)}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)', flexShrink: 0 }}>
                      {new Date(log.ran_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <DesignFooter />
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </>
  );
}
