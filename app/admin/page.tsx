'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Lock, RefreshCw, Database, Eye, EyeOff } from 'lucide-react';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState<string>('');

  // Persist auth in sessionStorage for the session
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('CreditIQ-admin') === '1') {
      setAuthed(true);
    }
  }, []);

  const checkPassword = async () => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      sessionStorage.setItem('CreditIQ-admin', '1');
    } else {
      setError('Wrong password');
    }
  };

  const triggerScrape = async (bank: string) => {
    setScrapeStatus(`Scraping ${bank}...`);
    try {
      const res = await fetch(`/api/admin/scrape?bank=${bank}`, { method: 'POST' });
      const data = await res.json();
      setScrapeStatus(data.message || 'Done');
    } catch (e: any) {
      setScrapeStatus(`Error: ${e.message}`);
    }
  };

  if (!authed) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-40 pb-32 min-h-[70vh] flex items-center">
          <div className="max-w-md mx-auto px-6 w-full">
            <div className="bg-ink-900/40 border border-white/10 rounded-xl p-8">
              <Lock className="w-8 h-8 text-copper-400 mb-4" />
              <h1 className="font-display text-3xl text-ink-50 mb-2">Admin</h1>
              <p className="text-sm text-ink-300 mb-6">
                Internal panel for the AskGogo team.
              </p>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
                    placeholder="Admin password"
                    className="w-full bg-ink-950 border border-white/10 rounded px-3 py-2.5 pr-10 text-sm text-ink-100 focus:border-copper-500 outline-none"
                  />
                  <button
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && <div className="text-sm text-crimson-400">{error}</div>}
                <button onClick={checkPassword} className="btn-primary w-full">
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </section>
        <DesignFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="divider-rule mb-6 max-w-xs">- Admin</div>
          <h1 className="font-display text-5xl text-ink-50 leading-[1.05] mb-12">
            CreditIQ <span className="display-italic text-copper-400">control</span>
          </h1>

          {/* Scraper controls */}
          <div className="bg-ink-900/40 border border-white/10 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-copper-400" />
              <h2 className="font-display text-2xl text-ink-50">Trigger scrape</h2>
            </div>
            <p className="text-sm text-ink-300 mb-6">
              Run the scraper for a specific bank to refresh card data. Default schedule is weekly
              (Sundays 2:00 IST) via Vercel Cron.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'AmEx', 'IDFC', 'RBL', 'Yes', 'IndusInd', 'SC', 'AU'].map(
                (bank) => (
                  <button
                    key={bank}
                    onClick={() => triggerScrape(bank)}
                    className="btn-ghost text-xs py-2"
                  >
                    {bank}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => triggerScrape('all')}
              className="btn-primary text-xs w-full mt-4"
            >
              Scrape ALL banks (slow, ~6 hours)
            </button>
            {scrapeStatus && (
              <div className="mt-4 p-3 bg-ink-950 rounded text-xs font-mono text-ink-200">
                {scrapeStatus}
              </div>
            )}
          </div>

          {/* Cards list */}
          <div className="bg-ink-900/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-copper-400" />
                <h2 className="font-display text-2xl text-ink-50">
                  Cards <span className="text-copper-300 tabular">({SEED_CARDS.length})</span>
                </h2>
              </div>
              <div className="text-xs font-mono text-ink-400">
                Source: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Supabase' : 'Seed (no DB connected)'}
              </div>
            </div>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {SEED_CARDS.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[auto,1fr,auto,auto,auto] gap-4 items-center px-3 py-2 hover:bg-white/[0.03] rounded text-sm"
                >
                  <div className="font-mono text-xs text-ink-500 tabular w-20">{c.bank}</div>
                  <div className="text-ink-100">{c.name}</div>
                  <div className="text-xs text-ink-400 font-mono">{c.tier}</div>
                  <div className="text-xs text-copper-300 font-mono tabular">
                    {c.base_reward_rate}%
                  </div>
                  <div className="text-xs text-ink-400 font-mono">
                    {c.last_verified ? new Date(c.last_verified).toLocaleDateString('en-IN') : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <DesignFooter />
    </main>
  );
}

