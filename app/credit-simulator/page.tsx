'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface SimAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  impact: (score: number, params: any) => number;
  params?: { label: string; type: string; min?: number; max?: number; options?: string[] }[];
}

const ACTIONS: SimAction[] = [
  {
    id: 'payoff',
    label: 'Pay off credit card balance',
    description: 'Reduces credit utilization — biggest single score booster',
    icon: '💳',
    impact: (score, p) => {
      const util = parseInt(p.utilization) || 30;
      if (util > 70) return Math.min(150, Math.round((util - 10) * 1.5));
      if (util > 30) return Math.min(80, Math.round((util - 10) * 0.8));
      return Math.min(20, Math.round(util * 0.3));
    },
    params: [{ label: 'Current utilization %', type: 'number', min: 1, max: 100 }],
  },
  {
    id: 'new-card',
    label: 'Apply for a new credit card',
    description: 'Hard inquiry lowers score short-term, new credit helps long-term',
    icon: '🆕',
    impact: () => -8,
    params: [],
  },
  {
    id: 'missed-payment',
    label: 'Miss a payment',
    description: 'Single biggest negative event — avoid at all costs',
    icon: '❌',
    impact: () => -85,
    params: [],
  },
  {
    id: 'close-card',
    label: 'Close an old credit card',
    description: 'Reduces available credit and credit age — hurts score',
    icon: '🚫',
    impact: () => -22,
    params: [],
  },
  {
    id: 'on-time',
    label: 'Pay all bills on time for 6 months',
    description: 'Consistent on-time payments are the #1 score factor',
    icon: '✅',
    impact: () => 35,
    params: [],
  },
  {
    id: 'dispute',
    label: 'Remove an error from credit report',
    description: 'Errors are common — removing them can boost score significantly',
    icon: '🔍',
    impact: () => 45,
    params: [],
  },
  {
    id: 'limit-increase',
    label: 'Get a credit limit increase',
    description: 'More available credit reduces utilization ratio',
    icon: '📈',
    impact: (score, p) => {
      const increase = parseInt(p.percent) || 50;
      return Math.min(30, Math.round(increase * 0.25));
    },
    params: [{ label: 'Limit increase %', type: 'number', min: 10, max: 200 }],
  },
  {
    id: 'personal-loan',
    label: 'Take a personal loan',
    description: 'Adds to credit mix but increases debt load',
    icon: '🏦',
    impact: () => -12,
    params: [],
  },
];

export default function CreditSimulatorPage() {
  const [baseScore, setBaseScore] = useState(720);
  const [selectedActions, setSelectedActions] = useState<{ action: SimAction; params: Record<string, string> }[]>([]);
  const [showAddAction, setShowAddAction] = useState(false);
  const [tempParams, setTempParams] = useState<Record<string, string>>({});

  const simulatedScore = Math.max(300, Math.min(900, selectedActions.reduce((score, { action, params }) => {
    return score + action.impact(score, params);
  }, baseScore)));

  const scoreDelta = simulatedScore - baseScore;

  const getScoreLabel = (score: number) => {
    if (score >= 800) return { label: 'Exceptional', color: '#22c55e' };
    if (score >= 750) return { label: 'Very Good', color: '#16a34a' };
    if (score >= 700) return { label: 'Good', color: '#C9972E' };
    if (score >= 650) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Poor', color: '#ef4444' };
  };

  const baseLabel = getScoreLabel(baseScore);
  const simLabel = getScoreLabel(simulatedScore);

  const addAction = (action: SimAction) => {
    setSelectedActions(prev => [...prev, { action, params: tempParams }]);
    setTempParams({});
    setShowAddAction(false);
  };

  const removeAction = (index: number) => {
    setSelectedActions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #08080E)' }}>
      <Header />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
            Credit Score Simulator
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, color: 'var(--text, #f0f0ff)', margin: '0 0 10px', letterSpacing: -0.5 }}>
            See your score before you act.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted, #8888AA)', margin: 0 }}>
            Model the impact of financial decisions before making them. No hard inquiry, no real impact.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Left — Score display */}
          <div>
            {/* Current score input */}
            <div style={{ background: 'var(--bg-card, #111118)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Your current CIBIL score
              </div>
              <input
                type="range" min={300} max={900} value={baseScore}
                onChange={e => setBaseScore(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#C9972E', marginBottom: 12 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: baseLabel.color, lineHeight: 1 }}>{baseScore}</div>
                  <div style={{ fontSize: 13, color: baseLabel.color, fontWeight: 600, marginTop: 4 }}>{baseLabel.label}</div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)', marginBottom: 4 }}>Range</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted, #8888AA)' }}>300 – 900</div>
                </div>
              </div>
            </div>

            {/* Simulated score */}
            <div style={{
              background: scoreDelta > 0 ? 'rgba(34,197,94,0.08)' : scoreDelta < 0 ? 'rgba(239,68,68,0.08)' : 'var(--bg-card, #111118)',
              border: `1px solid ${scoreDelta > 0 ? 'rgba(34,197,94,0.25)' : scoreDelta < 0 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 20, padding: 24,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Simulated score
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: simLabel.color, lineHeight: 1 }}>{simulatedScore}</div>
                  <div style={{ fontSize: 13, color: simLabel.color, fontWeight: 600, marginTop: 4 }}>{simLabel.label}</div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: scoreDelta > 0 ? '#22c55e' : scoreDelta < 0 ? '#ef4444' : 'var(--text-muted, #8888AA)' }}>
                    {scoreDelta > 0 ? '+' : ''}{scoreDelta}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, #8888AA)' }}>point change</div>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ marginTop: 16 }}>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%',
                    width: `${((baseScore - 300) / 600) * 100}%`,
                    background: baseLabel.color, borderRadius: 8, opacity: 0.4,
                    transition: 'width 0.3s',
                  }} />
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%',
                    width: `${((simulatedScore - 300) / 600) * 100}%`,
                    background: simLabel.color, borderRadius: 8,
                    transition: 'width 0.5s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted, #8888AA)', marginTop: 4 }}>
                  <span>300 Poor</span><span>600 Fair</span><span>750 Good</span><span>900 Exceptional</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Actions */}
          <div>
            <div style={{ background: 'var(--bg-card, #111118)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #f0f0ff)' }}>Simulated actions</div>
                <button onClick={() => setShowAddAction(true)} style={{
                  padding: '6px 14px', background: 'rgba(201,151,46,0.15)', border: '1px solid rgba(201,151,46,0.3)',
                  borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#C9972E', cursor: 'pointer',
                }}>+ Add action</button>
              </div>

              {selectedActions.length === 0 && (
                <div style={{ textAlign: 'center' as const, padding: '24px 0', color: 'var(--text-muted, #8888AA)', fontSize: 13 }}>
                  Add actions to see how they affect your score
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedActions.map(({ action, params }, i) => {
                  const impact = action.impact(baseScore, params);
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{action.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #f0f0ff)' }}>{action.label}</div>
                          <div style={{ fontSize: 11, color: impact > 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                            {impact > 0 ? '+' : ''}{impact} points
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeAction(i)} style={{
                        width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                        cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action picker */}
            {showAddAction && (
              <div style={{ background: 'var(--bg-card, #111118)', border: '1px solid rgba(201,151,46,0.3)', borderRadius: 20, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #f0f0ff)', marginBottom: 12 }}>Choose an action</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ACTIONS.map(action => {
                    const impact = action.impact(baseScore, tempParams);
                    return (
                      <button key={action.id} onClick={() => addAction(action)} style={{
                        padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
                        cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 16 }}>{action.icon}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #f0f0ff)' }}>{action.label}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)' }}>{action.description}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: impact > 0 ? '#22c55e' : '#ef4444', flexShrink: 0, marginLeft: 8 }}>
                            {impact > 0 ? '+' : ''}{impact}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setShowAddAction(false)} style={{
                  width: '100%', marginTop: 12, padding: '10px', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                  color: 'var(--text-muted, #8888AA)', fontSize: 13, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
