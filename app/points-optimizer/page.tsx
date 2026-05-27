'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';

const CARDS_WITH_POINTS = [
  // HDFC
  { value: 'hdfc-infinia', label: 'HDFC Infinia', bank: 'HDFC Bank', pointName: 'Reward Points', ratio: '1 pt = Rs.1 (SmartBuy) / 0.5 base' },
  { value: 'hdfc-diners-black', label: 'HDFC Diners Black', bank: 'HDFC Bank', pointName: 'Reward Points', ratio: '1 pt = Rs.1 (SmartBuy)' },
  { value: 'hdfc-regalia-gold', label: 'HDFC Regalia Gold', bank: 'HDFC Bank', pointName: 'Reward Points', ratio: '1 pt = Rs.0.50' },
  { value: 'hdfc-tata-neu-infinity', label: 'Tata Neu Infinity HDFC', bank: 'HDFC Bank', pointName: 'NeuCoins', ratio: '1 NeuCoin = Rs.1' },
  // Axis
  { value: 'axis-magnus', label: 'Axis Magnus', bank: 'Axis Bank', pointName: 'EDGE Miles', ratio: '1 EDGE Mile = Rs.2 (partner)' },
  { value: 'axis-reserve', label: 'Axis Reserve', bank: 'Axis Bank', pointName: 'EDGE Miles', ratio: '1 EDGE Mile = Rs.2 (partner)' },
  { value: 'axis-vistara-infinite', label: 'Axis Vistara Infinite', bank: 'Axis Bank', pointName: 'CV Points', ratio: '1 CV Point = 1 Vistara mile' },
  { value: 'axis-flipkart', label: 'Axis Flipkart', bank: 'Axis Bank', pointName: 'Cashback', ratio: 'Direct cashback' },
  // Amex
  { value: 'amex-platinum-travel', label: 'Amex Platinum Travel', bank: 'American Express', pointName: 'Membership Rewards', ratio: '1 MR = Rs.0.5–Rs.1.75 (transfer)' },
  { value: 'amex-mrcc', label: 'Amex MRCC', bank: 'American Express', pointName: 'Membership Rewards', ratio: '1 MR = Rs.0.5–Rs.1.75' },
  // ICICI
  { value: 'icici-emeralde', label: 'ICICI Emeralde', bank: 'ICICI Bank', pointName: 'PAYBACK Points', ratio: '1 pt = Rs.0.25' },
  { value: 'icici-sapphiro', label: 'ICICI Sapphiro', bank: 'ICICI Bank', pointName: 'PAYBACK Points', ratio: '1 pt = Rs.0.25' },
  // SBI
  { value: 'sbi-elite', label: 'SBI Card ELITE', bank: 'SBI Card', pointName: 'Reward Points', ratio: '1 pt = Rs.0.25' },
  { value: 'sbi-aurum', label: 'SBI Aurum', bank: 'SBI Card', pointName: 'Reward Points', ratio: '1 pt = Rs.1 (premium)' },
  // IndusInd
  { value: 'indusind-iconia', label: 'IndusInd Iconia', bank: 'IndusInd Bank', pointName: 'Reward Points', ratio: '1 pt = Rs.0.70' },
  { value: 'indusind-legend', label: 'IndusInd Legend', bank: 'IndusInd Bank', pointName: 'Reward Points', ratio: '1 pt = Rs.0.70' },
  // Others
  { value: 'idfc-wealth', label: 'IDFC FIRST Wealth', bank: 'IDFC FIRST', pointName: 'Reward Points', ratio: '1 pt = Rs.0.25' },
  { value: 'standard-chartered-ultimate', label: 'SC Ultimate', bank: 'Standard Chartered', pointName: '360° Reward Points', ratio: '1 pt = Rs.1' },
  { value: 'kotak-white', label: 'Kotak White Reserve', bank: 'Kotak Mahindra', pointName: 'Reward Points', ratio: '1 pt = Rs.0.25' },
  { value: 'rbl-world-safari', label: 'RBL World Safari', bank: 'RBL Bank', pointName: 'Travel Points', ratio: '1 pt = Rs.0.50' },
];

const GOALS = [
  { id: 'flights', label: '✈️ Flights', desc: 'Maximize flight value via airline transfers' },
  { id: 'hotels', label: '🏨 Hotels', desc: 'Get hotel stays via transfers or cashback' },
  { id: 'cashback', label: '💵 Cashback', desc: 'Convert to statement credit or cash' },
  { id: 'lounge', label: '🛋️ Lounge Access', desc: 'Maximize lounge visits per point' },
  { id: 'shopping', label: '🛍️ Shopping', desc: 'Use on e-commerce or brand vouchers' },
];

interface RedemptionPath {
  program: string;
  route: string;
  pointsNeeded: number;
  estimatedValue: number;
  valuePerPoint: number;
  steps: string[];
  isTopPick: boolean;
  transferPartner?: string;
}

interface OptimizeResult {
  paths: RedemptionPath[];
  topStrategy: string;
  warnings?: string[];
}

function fmt(n: number) {
  return 'Rs.' + Math.round(n).toLocaleString('en-IN');
}

export default function PointsOptimizerPage() {
  const [selectedCard, setSelectedCard] = useState('');
  const [points, setPoints] = useState('');
  const [goal, setGoal] = useState('flights');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState('');
  const [aiStrategy, setAiStrategy] = useState('');

  const selectedCardData = CARDS_WITH_POINTS.find(c => c.value === selectedCard);
  const pointsNum = parseInt(points.replace(/,/g, '')) || 0;

  const handleOptimize = async () => {
    if (!selectedCard || pointsNum < 100) {
      setError('Please select a card and enter at least 100 points.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setAiStrategy('');

    try {
      const prompt = `You are CreditIQ's points optimization expert for India. 

Card: ${selectedCardData?.label} (${selectedCardData?.bank})
Points balance: ${pointsNum.toLocaleString('en-IN')} ${selectedCardData?.pointName}
Base ratio: ${selectedCardData?.ratio}
User goal: ${GOALS.find(g => g.id === goal)?.label} - ${GOALS.find(g => g.id === goal)?.desc}

Give the top 3 redemption strategies ranked by value. Be specific about transfer partners, programs, and realistic valuations for India.

Respond ONLY with valid JSON (no markdown):
{
  "paths": [
    {
      "program": "Turkish Airlines Miles&Smiles",
      "route": "DEL to IST (R/T)",
      "pointsNeeded": 60000,
      "estimatedValue": 64000,
      "valuePerPoint": 1.07,
      "steps": ["Transfer HDFC points to Miles&Smiles via SmartBuy (1:1)", "Search partner award on Turkish.com", "Book 2-4 weeks in advance"],
      "isTopPick": true,
      "transferPartner": "Turkish Airlines"
    }
  ],
  "topStrategy": "2-3 sentence explanation of the single best move to make right now with these points",
  "warnings": ["Optional: any expiry risk, devaluation notice, or tip"]
}`;

      const response = await fetch('/api/points-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, card: selectedCard, points: pointsNum, goal }),
      });

      if (!response.ok) throw new Error('API error ' + response.status);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setAiStrategy(data.topStrategy || '');
    } catch (e: unknown) {
      setError('Optimization failed. Please try again. ' + (e instanceof Error ? e.message : ''));
    } finally {
      setLoading(false);
    }
  };

  const barWidth = (val: number, max: number) => `${Math.min(100, Math.round((val / max) * 100))}%`;
  const maxVal = result ? Math.max(...result.paths.map(p => p.estimatedValue)) : 1;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <Header />
      <main className="mx-auto px-4 pb-28" style={{ maxWidth: 760, paddingTop: 40 }}>

        {/* Hero */}
        <div className="text-center mb-8">
          <span style={{
            display: 'inline-block', backgroundColor: '#1B3A5C', color: '#C9972E',
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, padding: '5px 16px',
            borderRadius: 100, marginBottom: 20, textTransform: 'uppercase',
          }}>
            AI-Powered &nbsp;•&nbsp; Real Valuations
          </span>
          <h1 style={{
            fontSize: 'clamp(26px,5vw,38px)', fontWeight: 800, color: '#1B3A5C',
            margin: '0 0 12px', lineHeight: 1.15, letterSpacing: '-0.5px',
          }}>
            Squeeze every rupee from<br />your reward points
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 460, marginInline: 'auto', lineHeight: 1.7 }}>
            Pick a card, tell me your goal — I&apos;ll rank every redemption path by actual value.
          </p>
        </div>

        {/* Left-right layout on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 20 }}
          className="points-grid">
          <style>{`
            @media (max-width: 640px) { .points-grid { grid-template-columns: 1fr !important; } }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>

          {/* Left: Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Card selector */}
            <div style={{ backgroundColor: '#fff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>Your Card</p>
              <select
                value={selectedCard}
                onChange={e => setSelectedCard(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b',
                  backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Select your card...</option>
                {CARDS_WITH_POINTS.map(c => (
                  <option key={c.value} value={c.value}>{c.label} ({c.bank})</option>
                ))}
              </select>
              {selectedCardData && (
                <div style={{ marginTop: 10, padding: '8px 12px', backgroundColor: '#f0f4ff', borderRadius: 8, fontSize: 12, color: '#3730a3' }}>
                  💎 {selectedCardData.pointName} · {selectedCardData.ratio}
                </div>
              )}
            </div>

            {/* Points input */}
            <div style={{ backgroundColor: '#fff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>Points to Redeem</p>
              <input
                type="number"
                placeholder="e.g. 60000"
                value={points}
                onChange={e => setPoints(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', fontSize: 16, fontWeight: 700,
                  color: '#1B3A5C', backgroundColor: '#f8fafc', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {pointsNum > 0 && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>
                  Base value (cash): ~{fmt(pointsNum * 0.25)} – {fmt(pointsNum * 1.0)}
                </p>
              )}
            </div>

            {/* Goal selector */}
            <div style={{ backgroundColor: '#fff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>Optimize For</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10, border: 'none',
                      backgroundColor: goal === g.id ? '#1B3A5C' : '#f8fafc',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{g.label.split(' ')[0]}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: goal === g.id ? '#fff' : '#334155' }}>
                        {g.label.split(' ').slice(1).join(' ')}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: goal === g.id ? '#94a3b8' : '#94a3b8' }}>{g.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleOptimize}
              disabled={loading || !selectedCard || pointsNum < 100}
              style={{
                padding: '14px 20px', borderRadius: 12, border: 'none',
                backgroundColor: selectedCard && pointsNum >= 100 ? '#C9972E' : '#cbd5e1',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: selectedCard && pointsNum >= 100 && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  Calculating...
                </>
              ) : '✨ Optimize My Points'}
            </button>
          </div>

          {/* Right: Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {!result && !loading && (
              <div style={{
                backgroundColor: '#fff', borderRadius: 18, padding: '32px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 300, color: '#94a3b8',
              }}>
                <span style={{ fontSize: 48, marginBottom: 12 }}>💎</span>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#64748b', margin: '0 0 6px' }}>Redemption paths will appear here</p>
                <p style={{ fontSize: 13, margin: 0 }}>Select a card and enter your points balance to get started</p>
              </div>
            )}

            {loading && (
              <div style={{
                backgroundColor: '#fff', borderRadius: 18, padding: '32px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center',
                minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#C9972E', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
                <p style={{ color: '#64748b', fontWeight: 600, margin: 0 }}>Calculating best redemption paths...</p>
              </div>
            )}

            {result && (
              <>
                {/* AI Strategy */}
                {aiStrategy && (
                  <div style={{ backgroundColor: '#1B3A5C', borderRadius: 16, padding: '16px 18px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.2 }}>✦ AI Strategy</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', lineHeight: 1.65 }}>{aiStrategy}</p>
                  </div>
                )}

                {/* Paths */}
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Redemption Paths — Ranked
                </p>

                {result.paths.map((path, idx) => (
                  <div key={idx} style={{
                    backgroundColor: '#fff', borderRadius: 16,
                    boxShadow: path.isTopPick
                      ? '0 0 0 2px #C9972E, 0 4px 16px rgba(201,151,46,0.1)'
                      : '0 1px 3px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '14px 18px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          {path.isTopPick && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1 }}>
                              Best Value
                            </span>
                          )}
                          <p style={{ margin: path.isTopPick ? '2px 0 0' : '0', fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            {path.program}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#1B3A5C' }}>{path.route}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Value</p>
                          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#10b981' }}>{fmt(path.estimatedValue)}</p>
                        </div>
                      </div>

                      {/* Value bar */}
                      <div style={{ height: 4, backgroundColor: '#f1f5f9', borderRadius: 4, margin: '8px 0', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          backgroundColor: path.isTopPick ? '#C9972E' : '#94a3b8',
                          width: barWidth(path.estimatedValue, maxVal),
                          transition: 'width 0.8s ease',
                        }} />
                      </div>

                      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>POINTS</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#475569' }}>{path.pointsNeeded.toLocaleString('en-IN')} pts</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>VALUE / PT</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#475569' }}>Rs.{path.valuePerPoint.toFixed(2)}</p>
                        </div>
                        {path.transferPartner && (
                          <div>
                            <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>PARTNER</p>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#475569' }}>{path.transferPartner}</p>
                          </div>
                        )}
                      </div>

                      {/* Steps */}
                      {path.steps && path.steps.length > 0 && (
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                          <p style={{ margin: '0 0 6px', fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>How to redeem</p>
                          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {path.steps.map((step, si) => (
                              <li key={si} style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px' }}>
                    {result.warnings.map((w, i) => (
                      <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0, fontSize: 12, color: '#78350f' }}>⚠️ {w}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
