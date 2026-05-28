'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';

import Link from 'next/link';

interface TruthReport {
  cardName: string; bank: string; period: string;
  totalSpend: number; totalRewardsEarned: number;
  advertisedRate: number; actualRate: number; gapPercent: number;
  categoryBreakdown: { category: string; spend: number; rewardsEarned: number; advertisedRate: number; actualRate: number; moneyLeft: number }[];
  verdict: string; verdictColor: string; totalMoneyLeft: number; bestAlternative: string; insight: string;
}

export default function StatementTruthPage() {
  const [file, setFile] = useState<File | null>(null);
  const [cardName, setCardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TruthReport | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please upload a PDF statement.'); return; }
    setFile(f); setError('');
  };

  const analyze = async () => {
    if (!file) { setError('Please upload your statement.'); return; }
    setLoading(true); setError('');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/api/statement-truth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Pdf: base64, cardName }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setReport(data); setStep('result');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally { setLoading(false); }
  };

  const verdictBg = report?.verdictColor === 'red' ? 'rgba(184,66,48,0.08)' : report?.verdictColor === 'amber' ? 'rgba(212,163,115,0.12)' : 'rgba(45,122,86,0.08)';
  const verdictBorder = report?.verdictColor === 'red' ? 'rgba(184,66,48,0.25)' : report?.verdictColor === 'amber' ? 'rgba(212,163,115,0.30)' : 'rgba(45,122,86,0.25)';
  const verdictColor = report?.verdictColor === 'red' ? '#B84230' : report?.verdictColor === 'amber' ? 'var(--copper,#8C5F12)' : '#2d7a56';

  return (
    <>
      <Header />
      <div className="page-fade">

        {/* Hero */}
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderRadius: 999, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.28)', marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--copper,#8C5F12)', textTransform: 'uppercase', fontWeight: 700 }}>AI Tool &bull; Statement Truth</span>
              </div>
              <h1 style={{ fontSize: 'clamp(36px,6vw,80px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.0, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
                Is your bank{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: '#B84230', fontStyle: 'italic', fontWeight: 400 }}>lying</span>{' '}
                about your rewards?
              </h1>
              <p style={{ fontSize: 'clamp(15px,1.4vw,18px)', color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65, margin: 0, maxWidth: 520 }}>
                Upload your credit card statement. We show you what you actually earned vs what the bank advertised — category by category.
              </p>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 80 }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

            {step === 'upload' && (
              <Reveal>
                {/* Drop zone */}
                <div
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 20, border: file ? '2px solid var(--ink,#142950)' : '2px dashed var(--line,rgba(20,41,80,0.20))', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', marginBottom: 16, transition: 'border 0.2s' }}
                >
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <>
                      <div style={{ fontSize: 40, marginBottom: 12, color: '#2d7a56' }}>✓</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 4 }}>{file.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>Click to change file</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 6 }}>Drop your statement PDF here</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginBottom: 8 }}>or click to browse &bull; PDF only &bull; Not stored anywhere</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)', opacity: 0.6 }}>Password protected? Unlock at ilovepdf.com first</div>
                    </>
                  )}
                </div>

                {/* Card name */}
                <div style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 16, border: '1px solid var(--line,rgba(20,41,80,0.08))', padding: '20px 24px', marginBottom: 14 }}>
                  <label style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', display: 'block', marginBottom: 10 }}>
                    Card name (optional — helps accuracy)
                  </label>
                  <input type="text" placeholder="e.g. HDFC Regalia Gold, Axis Magnus" value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--line,rgba(20,41,80,0.12))', fontSize: 14, color: 'var(--ink,#142950)', background: 'var(--surface,#fff)', outline: 'none', boxSizing: 'border-box' as const }} />
                </div>

                {/* Privacy note */}
                <div style={{ background: 'rgba(45,122,86,0.08)', border: '1px solid rgba(45,122,86,0.20)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
                  <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                    <strong>Your statement is never stored.</strong> Processed in memory, analysed by AI, and immediately discarded. We store only the aggregated report, not your transaction details.
                  </p>
                </div>

                {error && <p style={{ color: '#B84230', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</p>}

                <button onClick={analyze} disabled={loading || !file} style={{ width: '100%', padding: '16px', borderRadius: 14, background: loading || !file ? 'rgba(20,41,80,0.15)' : 'var(--copper-3,#D89B2A)', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: loading || !file ? 'not-allowed' : 'pointer', opacity: loading || !file ? 0.6 : 1 }}>
                  {loading ? 'Analysing your statement...' : 'Generate Truth Report'}
                </button>
              </Reveal>
            )}

            {step === 'result' && report && (
              <>
                {/* Verdict */}
                <div style={{ background: verdictBg, border: `1px solid ${verdictBorder}`, borderRadius: 18, padding: '22px 24px', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: verdictColor, marginBottom: 8 }}>
                    Truth Verdict &bull; {report.cardName}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: verdictColor, marginBottom: 8, letterSpacing: '-0.01em' }}>{report.verdict}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65 }}>{report.insight}</div>
                </div>

                {/* Key numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Advertised rate', value: `${report.advertisedRate}%`, color: 'var(--ink,#142950)' },
                    { label: 'Actual rate', value: `${report.actualRate}%`, color: report.actualRate < report.advertisedRate ? '#B84230' : '#2d7a56' },
                    { label: 'Left behind', value: `Rs.${report.totalMoneyLeft.toLocaleString('en-IN')}`, color: '#B84230' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 14, border: '1px solid var(--line,rgba(20,41,80,0.08))', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: 'var(--ink-3,#5A6A8A)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Category breakdown */}
                <div style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 18, border: '1px solid var(--line,rgba(20,41,80,0.08))', overflow: 'hidden', marginBottom: 20 }}>
                  <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)', letterSpacing: '-0.01em' }}>Category breakdown</div>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)', marginTop: 2 }}>Advertised vs actual rewards per category</div>
                  </div>
                  {report.categoryBreakdown.map((cat, i) => (
                    <div key={i} style={{ padding: '16px 22px', borderBottom: i < report.categoryBreakdown.length - 1 ? '1px solid var(--line,rgba(20,41,80,0.06))' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', textTransform: 'capitalize' }}>{cat.category}</div>
                        <div style={{ fontSize: 13, color: '#B84230', fontWeight: 700 }}>-Rs.{cat.moneyLeft.toLocaleString('en-IN')} lost</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                        {[
                          { label: 'Spend', value: `Rs.${cat.spend.toLocaleString('en-IN')}` },
                          { label: 'Advertised', value: `${cat.advertisedRate}%` },
                          { label: 'Actual', value: `${cat.actualRate}%`, color: cat.actualRate < cat.advertisedRate ? '#B84230' : '#2d7a56' },
                        ].map((s) => (
                          <div key={s.label}>
                            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: 'var(--ink-3,#5A6A8A)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: s.color ?? 'var(--ink,#142950)', marginTop: 2 }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ height: 5, background: 'var(--line,rgba(20,41,80,0.08))', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 5, width: `${Math.min((cat.actualRate / Math.max(cat.advertisedRate, 1)) * 100, 100)}%`, background: cat.actualRate >= cat.advertisedRate ? '#2d7a56' : '#B84230', transition: 'width 0.6s' }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Best alternative */}
                <div style={{ background: 'var(--ink,#142950)', borderRadius: 18, padding: '22px 24px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                  <div className="aurora" style={{ top: -30, right: -30, width: 200, height: 200, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--copper-3,#D89B2A)', marginBottom: 10 }}>Better alternative</div>
                    <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 16 }}>{report.bestAlternative}</div>
                    <Link href="/spend-optimizer" style={{ display: 'inline-block', background: 'var(--copper-3,#D89B2A)', color: '#fff', padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                      Find my best card →
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => { setStep('upload'); setReport(null); setFile(null); }}
                    style={{ flex: 1, padding: '13px', background: 'var(--paper,#FAF5EB)', border: '1.5px solid var(--line,rgba(20,41,80,0.12))', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--ink-2,#2A3F6B)', cursor: 'pointer' }}>
                    Analyse another statement
                  </button>
                  <Link href="/card-switch" style={{ flex: 1, padding: '13px', background: 'var(--ink,#142950)', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none', textAlign: 'center' }}>
                    Switch my card →
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <DesignFooter />
      </div>
    </>
  );
}
