'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MessageSquare, Upload, CheckCircle, Zap, AlertCircle, ChevronDown, Copy, ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';

const SAMPLE_SMS = [
  { sender: 'HDFCBK', text: 'You have earned 2,500 Reward Points on your HDFC Bank Credit Card XX4821 for transaction of Rs.5,000 at AMAZON. Total RP Balance: 87,500.' },
  { sender: 'AXISCC', text: '1,200 EDGE Miles credited to your Axis Magnus Credit Card XX3345 for spend of Rs.4,000 at SWIGGY. Total Edge Miles: 45,200.' },
  { sender: 'AMEXIN', text: '500 Membership Rewards Points have been added to your Amex Card XX9012 for a transaction of Rs.2,500. MR Points Balance: 32,000.' },
];

interface ParsedCard {
  bank: string;
  points: number;
  earned: number;
  maskedCard?: string;
  transactions: number;
  estimatedValue: number;
}

interface ParseResult {
  parsed: number;
  total: number;
  cards: ParsedCard[];
  totalPoints: number;
  totalEstimatedValue: number;
}

export default function SmsImportPage() {
  const [smsText, setSmsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState('');
  const [showSample, setShowSample] = useState(false);

  const handlePaste = (e: React.ClipboardEvent) => {
    setSmsText(e.clipboardData.getData('text'));
  };

  const loadSample = () => {
    setSmsText(SAMPLE_SMS.map(s => `[${s.sender}]: ${s.text}`).join('\n\n'));
  };

  const parseMessages = async () => {
    if (!smsText.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Parse pasted SMS — each line or block is a message
      const lines = smsText.split(/\n{2,}|\n(?=\[)/);
      const messages = lines.filter(l => l.trim()).map(line => {
        const senderMatch = line.match(/^\[([A-Z0-9-]+)\]/);
        return {
          sender: senderMatch?.[1],
          text: senderMatch ? line.replace(/^\[[A-Z0-9-]+\]\s*:?\s*/, '') : line,
        };
      });

      const res = await fetch('/api/sms-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />
      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }}>
            <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>No bank login required</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl mb-4 leading-tight" style={{ color: 'var(--text)' }}>
            Import points from{' '}
            <em className="text-copper-400 not-italic display-italic">bank SMS</em>
          </h1>
          <p className="text-lg mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Paste your bank reward SMS messages below. CreditIQ reads your points instantly — no login, no OTP, no AA framework needed.
          </p>
          <p className="text-sm mb-10" style={{ color: 'var(--text-dim)' }}>
            Works with HDFC, Axis, ICICI, SBI, Kotak, AmEx, IDFC and 10+ more banks.
          </p>

          {/* How to get SMS */}
          <div className="rounded-xl border mb-6 overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <button onClick={() => setShowSample(!showSample)} className="w-full flex items-center justify-between p-4 text-sm font-medium text-left" style={{ color: 'var(--text)' }}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                How to get your bank SMS messages
              </div>
              <ChevronDown className="w-4 h-4 transition-transform" style={{ color: 'var(--text-dim)', transform: showSample ? 'rotate(180deg)' : 'none' }} />
            </button>
            {showSample && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="pt-3 space-y-2">
                  {[
                    { step: '1', title: 'Open your Messages app', desc: 'Find SMS from your bank (HDFCBK, AXISCC, AMEXIN, SBICRD etc.)' },
                    { step: '2', title: 'Search for "reward points"', desc: 'Filter messages containing "reward points", "cashback", "EDGE miles"' },
                    { step: '3', title: 'Select and copy', desc: 'Long press to select multiple messages → copy' },
                    { step: '4', title: 'Paste below', desc: 'Paste into the text area — CreditIQ extracts points automatically' },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex items-start gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--accent)', color: 'white' }}>{step}</div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>{title}</div>
                        <div style={{ color: 'var(--text-dim)' }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={loadSample} className="text-xs flex items-center gap-1.5 mt-2" style={{ color: 'var(--accent)' }}>
                  <Copy className="w-3 h-3" /> Load sample SMS to try
                </button>
              </div>
            )}
          </div>

          {/* SMS input */}
          <div className="mb-4">
            <label className="text-xs font-mono uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-dim)' }}>
              Paste bank SMS messages here
            </label>
            <textarea
              value={smsText}
              onChange={e => setSmsText(e.target.value)}
              onPaste={handlePaste}
              placeholder={'Paste your bank SMS messages here...\n\nExample:\n[HDFCBK]: You have earned 2,500 Reward Points on your HDFC Bank Credit Card XX4821...\n\n[AXISCC]: 1,200 EDGE Miles credited to your Axis Magnus Credit Card XX3345...'}
              rows={10}
              style={{ width: '100%', padding: 16, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical' }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {smsText.length > 0 ? `${smsText.split('\n').filter(l => l.trim()).length} lines pasted` : 'Nothing pasted yet'}
              </span>
              <button onClick={() => setSmsText('')} className="text-xs" style={{ color: 'var(--text-dim)' }}>Clear</button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg p-3 mb-4 text-sm" style={{ background: 'color-mix(in srgb, #ef4444 10%, transparent)', color: '#ef4444', border: '1px solid color-mix(in srgb, #ef4444 25%, transparent)' }}>
              {error}
            </div>
          )}

          <button
            onClick={parseMessages}
            disabled={!smsText.trim() || loading}
            className="btn-primary w-full text-base flex items-center justify-center gap-2 mb-8"
            style={{ opacity: !smsText.trim() || loading ? 0.6 : 1 }}
          >
            <Zap className="w-5 h-5" />
            {loading ? 'Reading your points...' : 'Extract my points'}
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-xl p-5 border" style={{ borderColor: 'color-mix(in srgb, var(--emerald) 30%, transparent)', background: 'color-mix(in srgb, var(--emerald) 6%, transparent)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--emerald)' }} />
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    Found {result.cards.length} card{result.cards.length !== 1 ? 's' : ''} — {result.parsed} of {result.total} messages matched
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Total points</div>
                    <div className="font-display text-3xl tabular" style={{ color: 'var(--emerald)' }}>{result.totalPoints.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Estimated value</div>
                    <div className="font-display text-3xl tabular" style={{ color: 'var(--accent)' }}>₹{result.totalEstimatedValue.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>Conservative estimate at ₹0.25/point. Actual value depends on redemption — optimize below.</p>
              </div>

              {/* Per card breakdown */}
              {result.cards.map((card, i) => (
                <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: card.bank === 'HDFC' ? '#004C8F' : card.bank === 'Axis' ? '#97144D' : card.bank === 'AmEx' ? '#006FCF' : card.bank === 'ICICI' ? '#F58220' : '#333' }}>
                      {card.bank.slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: 'var(--text)' }}>{card.bank} Bank</div>
                      <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{card.maskedCard || 'Card detected'} · {card.transactions} transactions parsed</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl tabular" style={{ color: 'var(--accent)' }}>{card.points.toLocaleString('en-IN')}</div>
                      <div className="text-xs" style={{ color: 'var(--text-dim)' }}>points</div>
                    </div>
                  </div>
                  <div className="px-4 pb-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="text-xs pt-3" style={{ color: 'var(--emerald)' }}>Est. ₹{card.estimatedValue.toLocaleString('en-IN')} value</div>
                    <Link href={`/optimize?bank=${card.bank}&points=${card.points}`} className="text-xs pt-3 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                      Optimize <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}

              {result.cards.length === 0 && (
                <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <CreditCard className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-dim)' }} />
                  <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>No reward points SMS detected</p>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Try loading the sample SMS to see how it works, or search for messages containing "reward points" or "miles"</p>
                  <button onClick={loadSample} className="text-xs mt-3 flex items-center gap-1 mx-auto" style={{ color: 'var(--accent)' }}>Load sample →</button>
                </div>
              )}

              {result.cards.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/optimize" className="btn-ghost flex-1 text-sm flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Optimize all points
                  </Link>
                  <Link href="/dashboard" className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                    View dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Privacy note */}
          <div className="mt-8 rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--emerald)' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>100% private.</strong> Your SMS messages are parsed in your browser and on our server only for point extraction. We never store the raw SMS content. Only the extracted points balance is saved to your profile. See our <Link href="/privacy" style={{ color: 'var(--accent)' }}>privacy policy</Link>.
              </p>
            </div>
          </div>

        </div>
      </section>
      <Footer />
    </main>
  );
}
