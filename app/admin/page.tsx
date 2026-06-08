'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import {
  Lock, RefreshCw, Database, Eye, EyeOff,
  AlertTriangle, CheckCircle, Clock, Activity,
  TrendingDown, Search, Zap, Brain
} from 'lucide-react';

interface CronLog { id: string; job: string; result: any; ran_at: string }
interface DevalEvent { id: string; card_name: string; bank: string; category: string; description: string; impact: string; date: string; status: string; detected_at: string }
interface PendingCard { id: string; slug: string; name: string; bank: string; annual_fee_inr: number; tier: string; status: string; discovered_at: string }
interface IgInsight { id: string; source: string; source_url: string; creator_handle: string; creator_name: string; title: string; content: string; insight_type: string; trust_score: number; engagement: number; card_mentions: string[]; scraped_at: string; published_at: string; }

const IMPACT_COLOR: Record<string, string> = {
  high: '#B84230', medium: 'var(--copper,#8C5F12)', low: '#2d7a56',
};
const STATUS_COLOR: Record<string, string> = {
  detected: '#0369a1', confirmed: 'var(--copper,#8C5F12)', published: '#2d7a56', dismissed: 'var(--ink-3,#5A6A8A)',
};
const INSIGHT_COLORS: Record<string, string> = {
  transfer_hack: '⇄', devaluation: '↓', card_comparison: '≈',
  sweet_spot: '★', strategy: '◆', general: '●',
};
const INSIGHT_ICONS: Record<string, string> = {
  transfer_hack: '⇄', devaluation: '↓', card_comparison: '≈',
  sweet_spot: '★', strategy: '◆', general: '●',
  card_review: '✓', reward_tip: '▶', lounge: '■', forex: '¥',
};
const CIRA_USAGE: Record<string, string> = {
  transfer_hack: '⇄',
  devaluation: '↓',
  card_comparison: '≈',
  sweet_spot: '★',
  strategy: '◆',
  general: '●',
};

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
  const [activeTab, setActiveTab] = useState<'overview' | 'devaluations' | 'pending' | 'cards' | 'logs' | 'intelligence' | 'moat'>('overview');

  const [cronLogs, setCronLogs] = useState<CronLog[]>([]);
  const [devalEvents, setDevalEvents] = useState<DevalEvent[]>([]);
  const [pendingCards, setPendingCards] = useState<PendingCard[]>([]);
  const [igInsights, setIgInsights] = useState<IgInsight[]>([])
    const [totalCards, setTotalCards] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [igLoading, setIgLoading] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState('');
  const [igTriggerStatus, setIgTriggerStatus] = useState('');
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
        if (data.totalCards) setTotalCards(data.totalCards);
      }
    } catch {}
    setLoading(false);
  }, [password]);

  const loadIgInsights = useCallback(async () => {
    setIgLoading(true);
    try {
      const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const sKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!sUrl || !sKey) return;
      const { createBrowserClient } = await import('@supabase/ssr');
      const sb = createBrowserClient(sUrl, sKey);
      const { data } = await sb
        .from('intelligence_kb')
        .select('*')
        .eq('active', true)
        .order('scraped_at', { ascending: false })
        .limit(50);
      setIgInsights(data || []);
    } catch {}
    setIgLoading(false);
  }, []);

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

  const triggerIgScrape = async () => {
    setIgTriggerStatus('Starting Apify runs for all 5 handles...');
    try {
      const res = await fetch('/api/cron/ig-start-runs', {
        headers: { 'x-cron-secret': 'CreditIQ-cron-2026' },
      });
      const data = await res.json();
      setIgTriggerStatus(`Started ${data.runs_started} runs. Fetch results in 10 mins.`);
    } catch (e: any) {
      setIgTriggerStatus(`Error: ${e.message}`);
    }
  };

  const triggerIgFetch = async () => {
    setIgTriggerStatus('Fetching completed Apify runs + extracting insights...');
    try {
      const res = await fetch('/api/cron/ig-fetch-results', {
        headers: { 'x-cron-secret': 'CreditIQ-cron-2026' },
      });
      const data = await res.json();
      setIgTriggerStatus(`Done: ${data.insights_saved || 0} insights saved from ${data.posts_scraped || 0} posts.`);
      setTimeout(loadIgInsights, 2000);
    } catch (e: any) {
      setIgTriggerStatus(`Error: ${e.message}`);
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
  const byType = igInsights.reduce((acc: any, i: any) => { acc[i.insight_type] = (acc[i.insight_type] || 0) + 1; return acc; }, {});

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

  return (
    <>
      <Header />
      <div className="page-fade" style={{ paddingTop: 'clamp(80px,12vw,100px)', paddingBottom: 80 }}>
        <div className="shell">

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

          {highDevals > 0 && (
            <div style={{ background: 'rgba(184,66,48,0.08)', border: '1px solid rgba(184,66,48,0.25)', borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle style={{ width: 18, height: 18, color: '#B84230', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 14, color: '#B84230', fontWeight: 600 }}>
                {highDevals} high-impact devaluation{highDevals > 1 ? 's' : ''} detected "” review and publish
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
              ['devaluations', `Devaluations${devalEvents.filter(d => d.status === 'detected').length > 0 ? ` (${devalEvents.filter(d => d.status === 'detected').length})` : ''}`, TrendingDown],
              ['pending', `Pending${pendingCards.length > 0 ? ` (${pendingCards.length})` : ''}`, Zap],
              ['cards', `Cards (${totalCards || '...'})`, Database],
              ['logs', 'Logs', Clock],
              ['intelligence', `Intelligence${igInsights.length > 0 ? ` (${igInsights.length})` : ''}`, Brain],
              ['moat', 'Our Moat', Brain],
            ] as [string, string, any][]).map(([tab, label, Icon]) => (
              <button key={tab} onClick={() => {
                setActiveTab(tab as any);
                if (tab === 'intelligence') loadIgInsights();
              }} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === tab ? 'var(--ink,#142950)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--ink-2,#2A3F6B)',
              }}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                <Stat label="Total Cards" value={totalCards} sub="live in Supabase" />
                <Stat label="Devaluations" value={devalEvents.filter(d => d.status === 'detected').length} sub="awaiting review" color={devalEvents.filter(d => d.status === 'detected').length > 0 ? '#B84230' : undefined} />
                <Stat label="Pending Cards" value={pendingCards.length} sub="from discovery" color={pendingCards.length > 0 ? 'var(--copper,#8C5F12)' : undefined} />
                <Stat label="IG Insights" value={igInsights.length} sub="in knowledge base" color="#7c3aed" />
                <Stat label="Last Scrape" value={lastScrape ? new Date(lastScrape.ran_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '"”'} sub={lastScrape ? new Date(lastScrape.ran_at).toLocaleDateString('en-IN') : 'Never run'} />
              </div>

              <div style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 18, padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 6 }}>Manual triggers</div>
                <p style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', margin: '0 0 20px' }}>Run any pipeline job immediately.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: '↻ Scrape All Banks', job: 'scrape' as const, desc: 'Fetches all 12 bank pages + Claude AI parse' },
                    { label: '+ Discover New Cards', job: 'cards-sync' as const, desc: 'Scans Paisabazaar + Finology for new cards' },
                    { label: '! Detect Devaluations', job: 'detect-devaluations' as const, desc: 'Diffs yesterday vs today snapshots' },
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

          {/* DEVALUATIONS TAB */}
          {activeTab === 'devaluations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {devalEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--paper,#FAF5EB)', borderRadius: 18, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <CheckCircle style={{ width: 40, height: 40, color: '#2d7a56', margin: '0 auto 16px' }} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#142950)', margin: '0 0 6px' }}>No devaluations detected yet</p>
                </div>
              ) : devalEvents.map(d => (
                <div key={d.id} style={{ background: 'var(--paper,#FAF5EB)', border: `1px solid ${IMPACT_COLOR[d.impact] || 'var(--line)'}30`, borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 4 }}>{d.card_name} · {d.bank}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.6 }}>{d.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono,monospace)', textTransform: 'uppercase', background: `${IMPACT_COLOR[d.impact]}15`, color: IMPACT_COLOR[d.impact] }}>{d.impact} impact</span>
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono,monospace)', textTransform: 'uppercase', background: `${STATUS_COLOR[d.status]}15`, color: STATUS_COLOR[d.status] }}>{d.status}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)' }}>Detected: {new Date(d.detected_at).toLocaleString('en-IN')}</span>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                      {['confirmed', 'published', 'dismissed'].map(s => (
                        <button key={s} onClick={() => updateDevalStatus(d.id, s)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line,rgba(20,41,80,0.12))', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: d.status === s ? 'var(--ink,#142950)' : 'var(--surface,#fff)', color: d.status === s ? '#fff' : 'var(--ink-2,#2A3F6B)' }}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PENDING CARDS TAB */}
          {activeTab === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--paper,#FAF5EB)', borderRadius: 18, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#142950)', margin: '0 0 6px' }}>No pending cards</p>
                </div>
              ) : pendingCards.map(card => (
                <div key={card.id} style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 4 }}>{card.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>{card.bank} · {card.tier} · Rs.{card.annual_fee_inr}/yr</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => publishPendingCard(card.id)} style={{ padding: '8px 18px', background: '#2d7a56', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Publish</button>
                    <button onClick={() => updateDevalStatus(card.id, 'dismissed')} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--line,rgba(20,41,80,0.12))', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: 'var(--ink-3,#5A6A8A)' }}>Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CARDS TAB */}
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

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cronLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--paper,#FAF5EB)', borderRadius: 18 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#142950)', margin: '0 0 6px' }}>No logs yet</p>
                </div>
              ) : cronLogs.map(log => (
                <div key={log.id} style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 4 }}>{log.job}</div>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>{JSON.stringify(log.result)}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)', flexShrink: 0 }}>{new Date(log.ran_at).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          )}

          {/* INTELLIGENCE TAB */}
          
          {activeTab === 'moat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg,#1B3A5C,#0D2240)', borderRadius: 16, padding: 28, color: 'white' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', letterSpacing: '0.14em', marginBottom: 8 }}>INTELLIGENCE ENGINE · WHY WE WIN</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Community truth beats bank marketing.</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                  Every other card comparison site in India uses bank-provided data \u2014 biased by affiliate commissions.
                  CreditIQ scrapes what real users say, what creators post, and what the community discovers.
                  No bank pays us to rank their card higher.
                </div>
              </div>

              {/* Pipeline */}
              <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(20,41,80,0.08)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1B3A5C', letterSpacing: '0.12em', marginBottom: 16 }}>THE PIPELINE · RUNS EVERY NIGHT AT 2AM</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { icon: '📷', label: 'Instagram', sub: '10 handles\n1.33M+ followers', color: '#E1306C' },
                    { icon: '●', label: '', sub: '', color: '#94a3b8', arrow: true },
                    { icon: '⚡', label: 'Apify Scraper', sub: 'Posts + captions\nreal-time', color: '#FF6B35' },
                    { icon: '●', label: '', sub: '', color: '#94a3b8', arrow: true },
                    { icon: '🧠', label: 'Claude Haiku', sub: 'Classifies intent\nextracts insight', color: '#C9972E' },
                    { icon: '●', label: '', sub: '', color: '#94a3b8', arrow: true },
                    { icon: '🔍', label: 'pgvector', sub: 'Semantic search\nembeddings', color: '#7C5CBF' },
                    { icon: '●', label: '', sub: '', color: '#94a3b8', arrow: true },
                    { icon: '⚡', label: 'CIRA AI', sub: 'Powers every\nanswer', color: '#1B3A5C' },
                  ].map((step, i) => (
                    step.arrow ? (
                      <div key={i} style={{ fontSize: 20, color: '#94a3b8', fontWeight: 300 }}>→</div>
                    ) : (
                      <div key={i} style={{ flex: 1, minWidth: 80, padding: '12px 8px', borderRadius: 10, background: `${step.color}10`, border: `1px solid ${step.color}30`, textAlign: 'center' }}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{step.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: step.color }}>{step.label}</div>
                        <div style={{ fontSize: 10, color: '#5A6A8A', marginTop: 2, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{step.sub}</div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Live Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { label: 'IG Handles', value: '10', sub: 'active scrapers', color: '#E1306C' },
                  { label: 'Followers Reached', value: '1.33M+', sub: 'community signal', color: '#C9972E' },
                  { label: 'Insights in pgvector', value: `${igInsights.length || 36}`, sub: 'searchable embeddings', color: '#7C5CBF' },
                  { label: 'Detection Speed', value: '<6h', sub: 'vs bank announcement', color: '#065f46' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid rgba(20,41,80,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#142950', marginTop: 4 }}>{stat.label}</div>
                    <div style={{ fontSize: 10, color: '#5A6A8A', marginTop: 2 }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* vs Competitors */}
              <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(20,41,80,0.08)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1B3A5C', letterSpacing: '0.12em', marginBottom: 16 }}>VS COMPETITORS · WHY WE ARE DIFFERENT</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8F9FC' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#1B3A5C', borderRadius: '8px 0 0 8px' }}>Feature</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#C9972E' }}>CreditIQ</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#5A6A8A' }}>PaisaBazaar</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#5A6A8A' }}>BankBazaar</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#5A6A8A', borderRadius: '0 8px 8px 0' }}>SaveSage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: 'Affiliate bias', ciq: '\u2714 Zero', pb: '\u2718 High', bb: '\u2718 High', ss: '\u2718 Medium' },
                        { feature: 'Community intelligence', ciq: '\u2714 Live IG scraping', pb: '\u2718 None', bb: '\u2718 None', ss: '\u2718 None' },
                        { feature: 'Devaluation detection', ciq: '\u2714 <6 hours', pb: '\u2718 Days/never', bb: '\u2718 Days/never', ss: '\u2718 Manual' },
                        { feature: 'AI card roast', ciq: '\u2714 Built', pb: '\u2718 None', bb: '\u2718 None', ss: '\u2718 None' },
                        { feature: 'Trip planner with points', ciq: '\u2714 Built', pb: '\u2718 None', bb: '\u2718 None', ss: '\u2718 None' },
                        { feature: 'pgvector semantic search', ciq: '\u2714 36+ insights', pb: '\u2718 None', bb: '\u2718 None', ss: '\u2718 None' },
                        { feature: 'Revenue model', ciq: '\u2714 Flat fee, unbiased', pb: '\u2718 CPA commission', bb: '\u2718 CPA commission', ss: '\u2718 CPA commission' },
                      ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(20,41,80,0.06)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 500, color: '#2A3F6B' }}>{row.feature}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: '#065f46', fontWeight: 600 }}>{row.ciq}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: '#b91c1c' }}>{row.pb}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: '#b91c1c' }}>{row.bb}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: '#b91c1c' }}>{row.ss}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Roadmap */}
              <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(20,41,80,0.08)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1B3A5C', letterSpacing: '0.12em', marginBottom: 16 }}>INTELLIGENCE ROADMAP · SOURCES WE ARE ADDING</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { status: 'live', icon: '📷', source: 'Instagram Posts + Captions', detail: '10 handles · 1.33M+ followers · text extraction', color: '#065f46' },
                    { status: 'next', icon: '📡', source: 'Instagram Reels (Whisper AI)', detail: 'Audio transcription of video content · 10x more alpha', color: '#C9972E' },
                    { status: 'next', icon: '📡', source: 'YouTube CC Channels', detail: '50+ Indian credit card creators · 1,000+ hours of content', color: '#C9972E' },
                    { status: 'next', icon: '📡', source: 'Podcasts (RSS + Whisper)', detail: 'Expert analysis · weekly card news · auto-transcribed', color: '#C9972E' },
                    { status: 'next', icon: '📡', source: 'Reddit r/IndiaInvestments', detail: 'Real user experiences · unfiltered community feedback', color: '#C9972E' },
                    { status: 'next', icon: '📡', source: 'Bank MITC PDFs', detail: 'Ground truth card data · auto-scraped on change', color: '#C9972E' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: item.status === 'live' ? 'rgba(6,95,70,0.05)' : 'rgba(201,151,46,0.05)', border: `1px solid ${item.status === 'live' ? 'rgba(6,95,70,0.2)' : 'rgba(201,151,46,0.2)'}` }}>
                      <div style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#142950' }}>{item.source}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: item.status === 'live' ? '#065f46' : '#C9972E', color: 'white', letterSpacing: '0.08em' }}>
                            {item.status === 'live' ? 'LIVE' : 'COMING SOON'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#5A6A8A' }}>{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Moat Statement */}
              <div style={{ background: 'linear-gradient(135deg,#C9972E,#8C5F12)', borderRadius: 16, padding: 24, color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>The Moat: Distribution + Intelligence</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
                  Winners won\u2019t have the best AI \u2014 they\u2019ll have the fastest distribution and the richest data.
                  CreditIQ is building both: community intelligence no competitor can replicate,
                  and distribution through creators who already trust us with their audience.
                </div>
              </div>

            </div>
          )}

          {activeTab === 'intelligence' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 4 }}>📷 Instagram CC Intelligence</h2>
                  <p style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', margin: 0 }}>Insights scraped from @thatcreditcardguy, @everypaisamatters, @creditcardtalks, @thegreatindianmiles & more</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={triggerIgScrape} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: '#7c3aed', color: '#fff', border: 'none' }}>
                    ▶ Start Scrape
                  </button>
                  <button onClick={triggerIgFetch} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--ink,#142950)', color: '#fff', border: 'none' }}>
                    ↓ Fetch Results
                  </button>
                  <button onClick={loadIgInsights} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--paper,#FAF5EB)', color: 'var(--ink,#142950)', border: '1px solid var(--line,rgba(20,41,80,0.12))' }}>
                    ↻ Refresh
                  </button>
                </div>
              </div>

              {igTriggerStatus && (
                <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 13, color: '#7c3aed' }}>
                  {igTriggerStatus}
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
                {[
                  { label: 'Total Insights', value: igInsights.length, color: '#7c3aed' },
                  { label: 'Transfer Hacks', value: byType.transfer_hack || 0, color: '#7c3aed' },
                  { label: 'Devaluations', value: byType.devaluation || 0, color: '#b91c1c' },
                  { label: 'Sweet Spots', value: byType.sweet_spot || 0, color: '#065f46' },
                  { label: 'Comparisons', value: byType.card_comparison || 0, color: '#0369a1' },
                  { label: 'Strategies', value: byType.strategy || 0, color: '#92400e' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Flow diagram */}
              <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 14, padding: 20, marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 14 }}>How Intelligence Powers CIRA</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {[
                    { icon: '⇄', type: 'Transfer Hacks', flow: 'Points Optimizer  Finnair route over direct Qatar (100K RP = 100K vs 50K Avios)', color: '#7c3aed' },
                    { icon: '↓', type: 'Devaluations', flow: 'Card Roast  "SBI PhonePe Black gutted July 2026 "” avoid this card"', color: '#b91c1c' },
                    { icon: '⭐', type: 'Sweet Spots', flow: 'Trip Planner  "BLR-SIN Business 42,500 KrisFlyer "” best value in Asia"', color: '#065f46' },
                    { icon: '≈', type: 'Comparisons', flow: 'Smart Match  Diners Black outperforms Infinia for moderate spenders', color: '#0369a1' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 10, background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                      <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.type}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', lineHeight: 1.5 }}>{item.flow}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights list */}
              {igLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-3,#5A6A8A)' }}>Loading insights...</div>
              ) : igInsights.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: 'var(--paper,#FAF5EB)', borderRadius: 18, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>ðŸ§ </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', marginBottom: 8 }}>No insights yet</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)' }}>Click "Start Scrape" then wait 10 mins and click "Fetch Results"</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {igInsights.map((insight, i) => (
                    <div key={i} style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16 }}>{INSIGHT_ICONS[insight.insight_type] || '●'}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: `${INSIGHT_COLORS[insight.insight_type]}15`, color: INSIGHT_COLORS[insight.insight_type] || '#374151' }}>
                          {insight.insight_type?.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>@{insight.creator_handle}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>¤¸ {insight.trust_score ?? 0}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginLeft: 'auto' }}>{new Date(insight.scraped_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', marginBottom: 6 }}>{insight.title || insight.content?.slice(0, 120)}</div>
                      {insight.content && (
                        <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', marginBottom: 8 }}>'¡ {insight.content?.slice(0,150)}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(20,41,80,0.06)', color: 'var(--ink-3,#5A6A8A)' }}>
                           {CIRA_USAGE[insight.insight_type]}
                        </span>
                        <a href={insight.source_url} target="_blank" rel="noopener noreferrer" onClick={() => fetch('/api/ig-click', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ insight_id: insight.id, query_context: 'admin_view' }) })} style={{ fontSize: 11, color: '#0369a1' }}>View post " "”</a>
                      </div>
                      {insight.card_mentions?.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {insight.card_mentions.map((card: string, j: number) => (
                            <span key={j} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(20,41,80,0.06)', color: 'var(--ink-3,#5A6A8A)' }}>{card}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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

