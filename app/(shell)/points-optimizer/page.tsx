'use client';

import { authedFetch } from '@/lib/authed-fetch';
import { useState } from 'react';

const CARDS_WITH_POINTS = [
  { value: 'hdfc-infinia', label: 'HDFC Infinia', bank: 'HDFC Bank', pointName: 'Reward Points', ratio: '1 pt = Rs.1 (SmartBuy) / 0.5 base' },
  { value: 'hdfc-diners-black', label: 'HDFC Diners Black', bank: 'HDFC Bank', pointName: 'Reward Points', ratio: '1 pt = Rs.1 (SmartBuy)' },
  { value: 'hdfc-regalia-gold', label: 'HDFC Regalia Gold', bank: 'HDFC Bank', pointName: 'Reward Points', ratio: '1 pt = Rs.0.50' },
  { value: 'hdfc-tata-neu-infinity', label: 'Tata Neu Infinity HDFC', bank: 'HDFC Bank', pointName: 'NeuCoins', ratio: '1 NeuCoin = Rs.1' },
  { value: 'axis-magnus', label: 'Axis Magnus', bank: 'Axis Bank', pointName: 'EDGE Miles', ratio: '1 EDGE Mile = Rs.2 (partner)' },
  { value: 'axis-reserve', label: 'Axis Reserve', bank: 'Axis Bank', pointName: 'EDGE Miles', ratio: '1 EDGE Mile = Rs.2 (partner)' },
  { value: 'axis-vistara-infinite', label: 'Axis Vistara Infinite', bank: 'Axis Bank', pointName: 'CV Points', ratio: '1 CV Point = 1 Vistara mile' },
  { value: 'axis-flipkart', label: 'Axis Flipkart', bank: 'Axis Bank', pointName: 'Cashback', ratio: 'Direct cashback' },
  { value: 'amex-platinum-travel', label: 'Amex Platinum Travel', bank: 'American Express', pointName: 'Membership Rewards', ratio: '1 MR = Rs.0.5-Rs.1.75 (transfer)' },
  { value: 'amex-mrcc', label: 'Amex MRCC', bank: 'American Express', pointName: 'Membership Rewards', ratio: '1 MR = Rs.0.5-Rs.1.75' },
  { value: 'icici-emeralde', label: 'ICICI Emeralde', bank: 'ICICI Bank', pointName: 'PAYBACK Points', ratio: '1 pt = Rs.0.25' },
  { value: 'icici-sapphiro', label: 'ICICI Sapphiro', bank: 'ICICI Bank', pointName: 'PAYBACK Points', ratio: '1 pt = Rs.0.25' },
  { value: 'sbi-elite', label: 'SBI Card ELITE', bank: 'SBI Card', pointName: 'Reward Points', ratio: '1 pt = Rs.0.25' },
  { value: 'sbi-aurum', label: 'SBI Aurum', bank: 'SBI Card', pointName: 'Reward Points', ratio: '1 pt = Rs.1 (premium)' },
  { value: 'indusind-iconia', label: 'IndusInd Iconia', bank: 'IndusInd Bank', pointName: 'Reward Points', ratio: '1 pt = Rs.0.70' },
  { value: 'indusind-legend', label: 'IndusInd Legend', bank: 'IndusInd Bank', pointName: 'Reward Points', ratio: '1 pt = Rs.0.70' },
  { value: 'idfc-wealth', label: 'IDFC FIRST Wealth', bank: 'IDFC FIRST', pointName: 'Reward Points', ratio: '1 pt = Rs.0.25' },
  { value: 'standard-chartered-ultimate', label: 'SC Ultimate', bank: 'Standard Chartered', pointName: '360 Reward Points', ratio: '1 pt = Rs.1' },
  { value: 'kotak-white', label: 'Kotak White Reserve', bank: 'Kotak Mahindra', pointName: 'Reward Points', ratio: '1 pt = Rs.0.25' },
  { value: 'rbl-world-safari', label: 'RBL World Safari', bank: 'RBL Bank', pointName: 'Travel Points', ratio: '1 pt = Rs.0.50' },
];

// No emojis in label — use separate icon field rendered as aria-hidden text
const GOALS = [
  { id: 'flights',  icon: 'FLIGHT',  label: 'Flights',      desc: 'Maximize flight value via airline transfers' },
  { id: 'hotels',   icon: 'HOTEL',   label: 'Hotels',       desc: 'Get hotel stays via transfers or cashback' },
  { id: 'cashback', icon: 'CASH',    label: 'Cashback',     desc: 'Convert to statement credit or cash' },
  { id: 'lounge',   icon: 'LOUNGE',  label: 'Lounge Access',desc: 'Maximize lounge visits per point' },
  { id: 'shopping', icon: 'SHOP',    label: 'Shopping',     desc: 'Use on e-commerce or brand vouchers' },
];

// SVG icons — no emoji, no font dependency
function GoalIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? '#C9972E' : '#94a3b8';
  const size = 18;
  if (icon === 'FLIGHT') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1.02h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  );
  if (icon === 'HOTEL') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
  if (icon === 'CASH') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  );
  if (icon === 'LOUNGE') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 9V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2"/><path d="M2 11h20v4H2z"/><path d="M5 15v4M19 15v4M1 11h22"/>
    </svg>
  );
  // SHOP
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}

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
      const goalData = GOALS.find(g => g.id === goal);
      const prompt = `You are CreditIQ's points optimization expert for India.

Card: ${selectedCardData?.label} (${selectedCardData?.bank})
Points balance: ${pointsNum.toLocaleString('en-IN')} ${selectedCardData?.pointName}
Base ratio: ${selectedCardData?.ratio}
User goal: ${goalData?.label} - ${goalData?.desc}

Give the top 3 redemption strategies ranked by value. Be specific about transfer partners, programs, and realistic valuations for India.

Respond ONLY with valid JSON (no markdown, no code fences):
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

      const response = await authedFetch('/api/points-optimizer', {
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
      <main className="mx-auto px-4 pb-28" style={{ maxWidth: 760, paddingTop: 40 }}>

        {/* Hero */}
        <div className="text-center mb-8">
          <span style={{
            display: 'inline-block', backgroundColor: '#1B3A5C', color: '#C9972E',
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, padding: '5px 16px',
            borderRadius: 100, marginBottom: 20, textTransform: 'uppercase',
          }}>
            AI-Powered &nbsp;&bull;&nbsp; Real Valuations
          </span>
          <h1 style={{
            fontSize: 'clamp(26px,5vw,38px)', fontWeight: 800, color: '#1B3A5C',
            margin: '0 0 12px', lineHeight: 1.15, letterSpacing: '-0.5px',
          }}>
            Squeeze every rupee from<br />your reward points
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 460, marginInline: 'auto', lineHeight: 1.7 }}>
            Pick a card, tell me your goal &mdash; I&apos;ll rank every redemption path by actual value.
          </p>
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 20 }}
          className="points-grid">
          <style>{`
            @media (max-width: 640px) { .points-grid { grid-template-columns: 1fr !important; } }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>

          {/* ── LEFT: Inputs ── */}
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
                  Points: {selectedCardData.pointName} &middot; {selectedCardData.ratio}
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
                  Base value (cash): ~{fmt(pointsNum * 0.25)} &ndash; {fmt(pointsNum * 1.0)}
                </p>
              )}
            </div>

            {/* Goal selector — SVG icons, no emoji */}
            <div style={{ backgroundColor: '#fff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>Optimize For</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {GOALS.map(g => {
                  const active = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 10,
                        border: active ? '1.5px solid #C9972E' : '1.5px solid transparent',
                        backgroundColor: active ? '#1B3A5C' : '#f8fafc',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <GoalIcon icon={g.icon} active={active} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: active ? '#fff' : '#334155' }}>
                          {g.label}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: active ? '#94a3b8' : '#94a3b8', lineHeight: 1.4 }}>{g.desc}</p>
                      </div>
                    </button>
                  );
                })}
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
              ) : 'Optimize My Points'}
            </button>
          </div>

          {/* ── RIGHT: Results ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {!result && !loading && (
              <div style={{
                backgroundColor: '#fff', borderRadius: 18, padding: '32px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 300,
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#64748b', margin: '0 0 6px' }}>Redemption paths will appear here</p>
                <p style={{ fontSize: 13, margin: 0, color: '#94a3b8' }}>Select a card and enter your points balance to get started</p>
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
                {/* AI Strategy banner */}
                {aiStrategy && (
                  <div style={{ backgroundColor: '#1B3A5C', borderRadius: 16, padding: '16px 18px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.2 }}>AI Strategy</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', lineHeight: 1.65 }}>{aiStrategy}</p>
                  </div>
                )}

                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Redemption Paths &mdash; Ranked
                </p>

                {result.paths.map((path, idx) => (
                  <div key={idx} style={{
                    backgroundColor: '#fff', borderRadius: 16,
                    boxShadow: path.isTopPick
                      ? '0 0 0 2px #C9972E, 0 4px 16px rgba(201,151,46,0.1)'
                      : '0 1px 3px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '14px 18px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          {path.isTopPick && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 2 }}>
                              Best Value
                            </span>
                          )}
                          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{path.program}</p>
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
                        }} />
                      </div>

                      <div style={{ display: 'flex', gap: 16, marginBottom: path.steps?.length ? 10 : 0 }}>
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

                {result.warnings && result.warnings.length > 0 && (
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px' }}>
                    {result.warnings.map((w, i) => (
                      <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0, fontSize: 12, color: '#78350f' }}>Note: {w}</p>
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
