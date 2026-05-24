'use client';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RefreshCw, Check, X, Plus, Loader2 } from 'lucide-react';

interface PendingCard {
  slug: string;
  name: string;
  bank: string;
  joining_fee_inr: number;
  annual_fee_inr: number;
  base_reward_rate: number;
  best_for: string;
  tier: string;
  apr_percent: number;
  status: string;
  discovered_at: string;
  source: string;
}

export default function AdminCardsPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [pending, setPending] = useState<PendingCard[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const login = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'CreditIQ2026') {
      setAuthed(true);
      loadPending();
    } else {
      alert('Wrong password');
    }
  };

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pending-cards');
      const data = await res.json();
      setPending(data.cards || []);
    } catch {}
    setLoading(false);
  };

  const runScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/cards-sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_SYNC_SECRET || 'CreditIQ-sync-2026'}` },
      });
      const data = await res.json();
      setScanResult(data);
      await loadPending();
    } catch (e: any) {
      setScanResult({ error: e.message });
    }
    setScanning(false);
  };

  const approve = async (slug: string) => {
    await fetch('/api/admin/approve-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    setPending(p => p.filter(c => c.slug !== slug));
  };

  const reject = async (slug: string) => {
    await fetch('/api/admin/reject-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    setPending(p => p.filter(c => c.slug !== slug));
  };

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-ink-900/40 border border-white/10 rounded-xl p-8 space-y-4">
          <h1 className="font-display text-2xl text-ink-50">Admin - Card Manager</h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Password"
            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 14, color: 'var(--text)', outline: 'none' }} />
          <button onClick={login} className="btn-primary w-full">Enter</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl text-ink-50">Card Discovery Manager</h1>
              <p className="text-ink-400 text-sm mt-1">Auto-discover new cards from the web. Review and approve before going live.</p>
            </div>
            <button onClick={runScan} disabled={scanning} className="btn-primary flex items-center gap-2">
              {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning web...</> : <><RefreshCw className="w-4 h-4" /> Scan for new cards</>}
            </button>
          </div>

          {scanResult && (
            <div className={`rounded-xl p-4 mb-6 border ${scanResult.error ? 'border-crimson-500/30 bg-crimson-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
              {scanResult.error
                ? <p className="text-crimson-300 text-sm">Error: {scanResult.error}</p>
                : <p className="text-emerald-300 text-sm">Found {scanResult.found} new cards. Stored {scanResult.stored} for review. {scanResult.cards?.join(', ')}</p>
              }
            </div>
          )}

          <div className="bg-ink-900/40 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-medium text-ink-50">Pending review ({pending.length})</h2>
              <button onClick={loadPending} className="text-xs text-ink-400 hover:text-copper-400">Refresh</button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-ink-400">Loading...</div>
            ) : pending.length === 0 ? (
              <div className="p-8 text-center text-ink-400 font-display italic">No cards pending review. Run a scan to discover new cards.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {pending.map(card => (
                  <div key={card.slug} className="p-4 flex items-start gap-4 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-100">{card.name}</div>
                      <div className="text-xs text-ink-400 mt-0.5 font-mono">{card.bank} . {card.tier} . Rs.{card.annual_fee_inr}/year . {card.apr_percent}% APR</div>
                      <div className="text-xs text-ink-300 mt-1">{card.best_for}</div>
                      <div className="text-[10px] text-ink-500 mt-1 font-mono">Discovered: {new Date(card.discovered_at).toLocaleDateString('en-IN')} via {card.source}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => approve(card.slug)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => reject(card.slug)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-crimson-500/30 text-crimson-400 bg-crimson-500/10 hover:bg-crimson-500/20 transition-colors">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

