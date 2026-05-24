'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MessageSquare, CheckCircle, Zap, AlertCircle, ArrowRight, Copy, LogIn, Plus } from 'lucide-react';
import Link from 'next/link';

const SAMPLE_SMS = [
  'You have earned 2,500 Reward Points on your HDFC Bank Credit Card XX4821. Total RP Balance: 87,500.',
  '1,200 EDGE Miles credited to your Axis Magnus Credit Card XX3345. Total Edge Miles: 45,200.',
  '500 Membership Rewards Points added to your Amex Card XX9012. MR Points Balance: 32,000.',
];

const BANK_SENDERS = [
  { bank: 'HDFC', sender: 'HDFCBK or HDFCCC' },
  { bank: 'Axis', sender: 'AXISCC' },
  { bank: 'Amex', sender: 'AMEXIN' },
  { bank: 'ICICI', sender: 'ICICIB' },
  { bank: 'SBI', sender: 'SBICRD' },
  { bank: 'Kotak', sender: 'KOTAKB' },
];

export default function SmsImportPage() {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    sb.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetch(`/api/user-cards?userId=${user.id}`)
          .then(r => r.json())
          .then(d => setSavedCount(d.cards?.length || 0));
      }
    });
  }, []);

  const parseSmsText = (text: string) => {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 20)
      .map(line => {
        // Try to detect sender prefix like "HDFCBK: message"
        const senderMatch = line.match(/^([A-Z]{4,8})[:\s-]+(.+)$/);
        return senderMatch
          ? { sender: senderMatch[1], text: senderMatch[2], date: new Date().toISOString() }
          : { sender: 'UNKNOWN', text: line, date: new Date().toISOString() };
      });
  };

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const messages = parseSmsText(rawText);
      const res = await fetch('/api/sms-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to parse');
      setResult(data);
      if (userId && data.cards?.length > 0) setSavedCount(c => c + data.cards.length);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const BANK_COLORS: Record<string, string> = {
    HDFC: '#004C8F', Axis: '#97144D', AmEx: '#006FCF',
    ICICI: '#F58220', SBI: '#2C4C9C', Kotak: '#EF3E23',
  };

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />
      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }}>
            <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Paste SMS . Points extracted instantly
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl mb-3 leading-tight" style={{ color: 'var(--text)' }}>
            Import points from <em className="not-italic" style={{ color: 'var(--accent)' }}>bank SMS</em>
          </h1>
          <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
            Copy your reward points SMS messages and paste below. Works with all major Indian banks.
          </p>

          {/* Login nudge */}
          {!userId && (
            <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
              <LogIn className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Sign in to save points to dashboard</p>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Extract without signing in, but points won't persist.</p>
                <Link href="/login" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Sign in with Google →</Link>
              </div>
            </div>
          )}

          {/* Already saved indicator */}
          {userId && savedCount > 0 && !result && (
            <div className="rounded-xl p-3 mb-5 flex items-center justify-between" style={{ background: 'color-mix(in srgb, var(--emerald) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--emerald) 20%, transparent)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" style={{ color: 'var(--emerald)' }} />
                <span className="text-sm" style={{ color: 'var(--text)' }}>{savedCount} card{savedCount !== 1 ? 's' : ''} already in your dashboard</span>
              </div>
              <Link href="/dashboard" className="text-xs" style={{ color: 'var(--accent)' }}>View →</Link>
            </div>
          )}

          {/* How to get SMS */}
          <div className="rounded-xl p-4 border mb-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>How to get your SMS messages</p>
            <div className="space-y-1.5">
              {[
                'Open your phone Messages app',
                'Search for: "reward points" or "EDGE miles" or "cashback"',
                'Copy 3-5 recent messages from your bank',
                'Paste all of them below',
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: 'var(--accent)', color: 'white' }}>{i + 1}</div>
                  {s}
                </div>
              ))}
            </div>
            <p className="text-xs mt-3 pt-3" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              Works with: {BANK_SENDERS.map(b => b.bank).join(' . ')} and more
            </p>
          </div>

          {/* Sample SMS button */}
          <button onClick={() => setRawText(SAMPLE_SMS.join('\n'))}
            className="text-xs flex items-center gap-1.5 mb-3" style={{ color: 'var(--accent)' }}>
            <Copy className="w-3.5 h-3.5" /> Try with sample SMS messages
          </button>

          {/* Text area */}
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="Paste your bank SMS messages here...

Example:
You have earned 2,500 Reward Points on your HDFC Card XX4821. Total RP Balance: 87,500.

1,200 EDGE Miles credited to Axis Magnus XX3345. Total Edge Miles: 45,200."
            rows={8}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 13, lineHeight: 1.6,
              outline: 'none', resize: 'vertical', marginBottom: 16,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          />

          {error && (
            <div className="rounded-xl p-3 mb-4 text-sm flex items-center gap-2"
              style={{ background: 'color-mix(in srgb, #ef4444 10%, transparent)', color: '#ef4444', border: '1px solid color-mix(in srgb, #ef4444 25%, transparent)' }}>
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button onClick={handleExtract} disabled={!rawText.trim() || loading}
            className="btn-primary w-full text-base flex items-center justify-center gap-2"
            style={{ opacity: !rawText.trim() || loading ? 0.6 : 1 }}>
            <Zap className="w-5 h-5" />
            {loading ? 'Extracting points...' : 'Extract my points'}
          </button>

          {/* Results */}
          {result && (
            <div className="mt-6 space-y-4">
              {result.cards?.length === 0 ? (
                <div className="rounded-xl p-5 border text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-dim)' }} />
                  <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>No points found</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Make sure to paste SMS messages that mention reward points or miles balance.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl p-5 border" style={{ borderColor: 'color-mix(in srgb, var(--emerald) 30%, transparent)', background: 'color-mix(in srgb, var(--emerald) 6%, transparent)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-5 h-5" style={{ color: 'var(--emerald)' }} />
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>
                          {result.cards.length} card{result.cards.length !== 1 ? 's' : ''} found
                          {userId && <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--emerald) 15%, transparent)', color: 'var(--emerald)' }}>Saved to dashboard (ok)</span>}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                          Total: {result.totalPoints?.toLocaleString('en-IN')} points across all cards
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {result.cards.map((card: any, i: number) => (
                        <div key={i} className="rounded-xl p-4 flex items-center gap-3"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: BANK_COLORS[card.bank] || '#333' }}>
                            {card.bank?.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{card.bank} Card</div>
                            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                              {card.card_last4 ? `....${card.card_last4}` : 'Card number not found'}
                              {card.points_earned > 0 ? ` . +${card.points_earned.toLocaleString('en-IN')} earned` : ''}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-display text-xl tabular" style={{ color: 'var(--accent)' }}>
                              {card.points_balance.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{card.points_currency}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button onClick={() => { setResult(null); setRawText(''); }}
                      className="btn-ghost text-sm flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" /> Paste more SMS
                    </button>
                    <Link href="/dashboard" className="btn-ghost text-sm flex items-center justify-center gap-1.5">
                      View dashboard <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href={`/optimize?points=${result.totalPoints}`}
                      className="btn-primary text-sm flex items-center justify-center gap-1.5">
                      <Zap className="w-4 h-4" /> Optimize points
                    </Link>
                  </div>

                  {!userId && (
                    <div className="rounded-xl p-4 border text-center" style={{ borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
                      <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>Sign in to save these to your dashboard permanently</p>
                      <Link href="/login" className="btn-primary text-sm inline-flex items-center gap-1.5">
                        <LogIn className="w-4 h-4" /> Sign in with Google
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </section>
      <Footer />
    </main>
  );
}
