'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/Header';

interface TruthReport {
  cardName: string;
  bank: string;
  period: string;
  totalSpend: number;
  totalRewardsEarned: number;
  advertisedRate: number;
  actualRate: number;
  gapPercent: number;
  categoryBreakdown: {
    category: string;
    spend: number;
    rewardsEarned: number;
    advertisedRate: number;
    actualRate: number;
    moneyLeft: number;
  }[];
  verdict: string;
  verdictColor: string;
  totalMoneyLeft: number;
  bestAlternative: string;
  insight: string;
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
    if (f.type !== 'application/pdf') {
      setError('Please upload a PDF statement.');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (!file) { setError('Please upload your statement.'); return; }
    setLoading(true);
    setError('');
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
        setReport(data);
        setStep('result');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg,#F5EFE6)' }}>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(100px,14vw,140px) clamp(20px,5vw,40px) 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-block', backgroundColor: '#1B3A5C', borderRadius: 100,
            padding: '5px 18px', marginBottom: 16,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.5 }}>
              Statement Truth Report &nbsp;&bull;&nbsp; vs Bank Claims
            </span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1B3A5C', margin: '0 0 10px', lineHeight: 1.2 }}>
            Is your bank lying about your rewards?
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Upload your credit card statement. We'll show you what you actually earned vs what the bank advertised &mdash; category by category.
          </p>
        </div>

        {step === 'upload' && (
          <>
            {/* Upload zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{
                backgroundColor: '#fff', borderRadius: 20,
                border: file ? '2px solid #1B3A5C' : '2px dashed #cbd5e1',
                padding: '48px 24px', textAlign: 'center' as const,
                cursor: 'pointer', marginBottom: 16, transition: 'border 0.2s',
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>&#10003;</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1B3A5C', marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>Click to change file</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>&#128196;</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1B3A5C', marginBottom: 4 }}>
                    Drop your statement PDF here
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
                    or click to browse &nbsp;&bull;&nbsp; PDF only &nbsp;&bull;&nbsp; Not stored anywhere
                  </div>
                  <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                    Password protected? Unlock at ilovepdf.com first
                  </div>
                </>
              )}
            </div>

            {/* Card name input */}
            <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                Card name (optional -- helps with accuracy)
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC Regalia Gold, Axis Magnus"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b',
                  backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' as const,
                }}
              />
            </div>

            {/* Privacy note */}
            <div style={{
              backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
              padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>&#128274;</div>
              <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                <strong>Your statement is never stored.</strong> It is processed in memory, analyzed by AI, and immediately discarded. We only store the aggregated report, not your transaction details.
              </div>
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' as const, marginBottom: 12 }}>{error}</p>}

            <button
              onClick={analyze}
              disabled={loading || !file}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                backgroundColor: loading || !file ? '#94a3b8' : '#C9972E',
                color: '#fff', border: 'none', fontSize: 16, fontWeight: 700,
                cursor: loading || !file ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Analyzing your statement...' : 'Generate Truth Report'}
            </button>
          </>
        )}

        {step === 'result' && report && (
          <>
            {/* Verdict banner */}
            <div style={{
              backgroundColor: report.verdictColor === 'red' ? '#fef2f2' : report.verdictColor === 'amber' ? '#fffbeb' : '#f0fdf4',
              border: `1px solid ${report.verdictColor === 'red' ? '#fecaca' : report.verdictColor === 'amber' ? '#fde68a' : '#bbf7d0'}`,
              borderRadius: 16, padding: '20px 24px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1.2, marginBottom: 8,
                color: report.verdictColor === 'red' ? '#991b1b' : report.verdictColor === 'amber' ? '#92400e' : '#166534' }}>
                Truth verdict &nbsp;&bull;&nbsp; {report.cardName}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8,
                color: report.verdictColor === 'red' ? '#dc2626' : report.verdictColor === 'amber' ? '#d97706' : '#16a34a' }}>
                {report.verdict}
              </div>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{report.insight}</div>
            </div>

            {/* Key numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Advertised rate', value: `${report.advertisedRate}%`, color: '#1B3A5C' },
                { label: 'Actual rate', value: `${report.actualRate}%`, color: report.actualRate < report.advertisedRate ? '#dc2626' : '#16a34a' },
                { label: 'Money left behind', value: `Rs.${report.totalMoneyLeft.toLocaleString('en-IN')}`, color: '#dc2626' },
              ].map((stat, i) => (
                <div key={i} style={{
                  backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
                  padding: '16px', textAlign: 'center' as const,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Category breakdown */}
            <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C' }}>Category breakdown</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Advertised vs actual rewards per category</div>
              </div>
              {report.categoryBreakdown.map((cat, i) => (
                <div key={i} style={{
                  padding: '16px 24px',
                  borderBottom: i < report.categoryBreakdown.length - 1 ? '1px solid #f8fafc' : 'none',
                  backgroundColor: i % 2 === 0 ? '#fff' : '#fafbfc',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' as const }}>
                      {cat.category}
                    </div>
                    <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                      -Rs.{cat.moneyLeft.toLocaleString('en-IN')} lost
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Spend</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Rs.{cat.spend.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Advertised</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1B3A5C' }}>{cat.advertisedRate}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Actual</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: cat.actualRate < cat.advertisedRate ? '#dc2626' : '#16a34a' }}>
                        {cat.actualRate}%
                      </div>
                    </div>
                  </div>
                  {/* Gap bar */}
                  <div style={{ marginTop: 10, height: 6, backgroundColor: 'var(--bg,#F5EFE6)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 6,
                      width: `${Math.min((cat.actualRate / Math.max(cat.advertisedRate, 1)) * 100, 100)}%`,
                      backgroundColor: cat.actualRate >= cat.advertisedRate ? '#16a34a' : '#dc2626',
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Best alternative */}
            <div style={{ backgroundColor: '#1B3A5C', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.2, marginBottom: 8 }}>
                Better alternative
              </div>
              <div style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.7 }}>{report.bestAlternative}</div>
              <a href="/spend-optimizer" style={{
                display: 'inline-block', marginTop: 14, padding: '10px 20px',
                backgroundColor: '#C9972E', color: '#fff', borderRadius: 10,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}>
                Find my best card &rarr;
              </a>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setStep('upload'); setReport(null); setFile(null); }} style={{
                flex: 1, padding: '13px', backgroundColor: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer',
              }}>Analyze another statement</button>
              <a href="/card-switch" style={{
                flex: 1, padding: '13px', backgroundColor: '#1B3A5C', borderRadius: 12,
                fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
                textAlign: 'center' as const,
              }}>Switch my card &rarr;</a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
