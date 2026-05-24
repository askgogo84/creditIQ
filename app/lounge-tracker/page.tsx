'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { SEED_CARDS } from '@/lib/data/seed-cards';

const LOUNGES_BY_AIRPORT = [
  { airport: 'BOM -- Mumbai (CSIA)', terminal: 'T2 International', lounges: ['Plaza Premium', 'Air India Maharaja', 'BIAL Lounge'] },
  { airport: 'DEL -- Delhi (IGI)', terminal: 'T3 International', lounges: ['Plaza Premium', 'Encalm Prive', 'Air India Maharaja'] },
  { airport: 'BLR -- Bangalore (KIA)', terminal: 'T1 & T2', lounges: ['BLR Lounges by Encalm', 'Plaza Premium'] },
  { airport: 'HYD -- Hyderabad (RGIA)', terminal: 'International', lounges: ['GMR Aero Lounge', 'Plaza Premium'] },
  { airport: 'MAA -- Chennai', terminal: 'International', lounges: ['Chennai International Lounge'] },
  { airport: 'CCU -- Kolkata', terminal: 'International', lounges: ['Netaji Subhash Lounge'] },
];

interface CardLounge {
  cardId: string;
  cardName: string;
  bank: string;
  domesticAccess: string;
  internationalAccess: string;
  network: string;
  quarterlyLimit: number | null;
  visitsUsed: number;
  visitsRemaining: number | null;
  spendRequired: number | null;
  annualFee: number;
}

export default function LoungeTrackerPage() {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [visitLog, setVisitLog] = useState<Record<string, number>>({});
  const [quarterlySpend, setQuarterlySpend] = useState<Record<string, string>>({});

  const loungeCards: CardLounge[] = SEED_CARDS
    .filter(c => {
      const card = c as any;
      return card.lounges && card.lounges.length > 0;
    })
    .map(c => {
      const card = c as any;
      const lounges = card.lounges ?? [];
      const domestic = lounges.find((l: any) => l.type === 'domestic');
      const international = lounges.find((l: any) => l.type === 'international');
      const quarterlyLimit = card.lounge_visits_quarterly ?? (lounges[0]?.notes === 'Unlimited' ? null : 4);

      return {
        cardId: c.id,
        cardName: c.name,
        bank: c.bank,
        domesticAccess: domestic ? (domestic.notes || `${domestic.network} access`) : 'None',
        internationalAccess: international ? (international.notes || `${international.network} access`) : 'None',
        network: lounges[0]?.network ?? 'DreamFolks',
        quarterlyLimit,
        visitsUsed: visitLog[c.id] ?? 0,
        visitsRemaining: quarterlyLimit !== null ? Math.max(0, quarterlyLimit - (visitLog[c.id] ?? 0)) : null,
        spendRequired: card.lounge_spend_requirement_quarterly ?? null,
        annualFee: card.annual_fee_inr ?? 0,
      };
    })
    .filter(c => c.domesticAccess !== 'None' || c.internationalAccess !== 'None');

  const myCards = loungeCards.filter(c => selectedCards.includes(c.cardId));

  const logVisit = (cardId: string) => {
    setVisitLog(prev => ({ ...prev, [cardId]: (prev[cardId] ?? 0) + 1 }));
  };

  const removeVisit = (cardId: string) => {
    setVisitLog(prev => ({ ...prev, [cardId]: Math.max(0, (prev[cardId] ?? 0) - 1) }));
  };

  const totalRemainingVisits = myCards.reduce((sum, c) => {
    return sum + (c.visitsRemaining ?? 8);
  }, 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Header />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-block', backgroundColor: '#1B3A5C', borderRadius: 100,
            padding: '5px 18px', marginBottom: 16,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.5 }}>
              Lounge Access Tracker
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1B3A5C', margin: '0 0 10px', lineHeight: 1.2 }}>
            How many free lounge visits do you have left?
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Track lounge visits across all your cards. Know exactly where you can walk in free before your next flight.
          </p>
        </div>

        {/* Card selector */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '24px', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C', marginBottom: 4 }}>Select your cards</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Pick all cards you own with lounge access</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {loungeCards.map(card => (
              <button
                key={card.cardId}
                onClick={() => setSelectedCards(prev =>
                  prev.includes(card.cardId) ? prev.filter(id => id !== card.cardId) : [...prev, card.cardId]
                )}
                style={{
                  padding: '12px 14px', borderRadius: 12, textAlign: 'left' as const,
                  border: selectedCards.includes(card.cardId) ? '2px solid #1B3A5C' : '1px solid #e2e8f0',
                  backgroundColor: selectedCards.includes(card.cardId) ? '#eff6ff' : '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{card.cardName}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {card.quarterlyLimit === null ? 'Unlimited' : `${card.quarterlyLimit} visits/quarter`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* My cards tracker */}
        {myCards.length > 0 && (
          <>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Cards with lounge', value: myCards.length },
                { label: 'Visits remaining', value: totalRemainingVisits },
                { label: 'Visits used this Q', value: Object.values(visitLog).reduce((a, b) => a + b, 0) },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#1B3A5C' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Per card tracker */}
            {myCards.map(card => {
              const pct = card.quarterlyLimit ? ((card.visitsUsed / card.quarterlyLimit) * 100) : 0;
              const isUnlimited = card.visitsRemaining === null;
              return (
                <div key={card.cardId} style={{
                  backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
                  padding: '20px 24px', marginBottom: 14,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{card.cardName}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{card.bank} &nbsp;&bull;&nbsp; {card.network}</div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: isUnlimited ? '#16a34a' : (card.visitsRemaining! > 0 ? '#1B3A5C' : '#dc2626') }}>
                        {isUnlimited ? '' : card.visitsRemaining}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {isUnlimited ? 'unlimited' : 'visits left'}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!isUnlimited && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                        <span>{card.visitsUsed} used</span>
                        <span>{card.quarterlyLimit} total this quarter</span>
                      </div>
                      <div style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 8,
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: pct >= 100 ? '#dc2626' : pct >= 75 ? '#f59e0b' : '#16a34a',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Access details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: 10, padding: '12px' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Domestic lounges</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{card.domesticAccess}</div>
                    </div>
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: 10, padding: '12px' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>International lounges</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>
                        {card.internationalAccess === 'None' ? <span style={{ color: '#dc2626' }}>Not included</span> : card.internationalAccess}
                      </div>
                    </div>
                  </div>

                  {card.spendRequired && (
                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: '#92400e' }}>
                        (!!) Requires Rs.{card.spendRequired.toLocaleString('en-IN')} quarterly spend to unlock lounge access
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <label style={{ fontSize: 11, color: '#92400e' }}>My Q spend: Rs.</label>
                        <input
                          type="number"
                          value={quarterlySpend[card.cardId] || ''}
                          onChange={e => setQuarterlySpend(prev => ({ ...prev, [card.cardId]: e.target.value }))}
                          placeholder="0"
                          style={{ marginLeft: 4, width: 80, padding: '3px 8px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 12, outline: 'none' }}
                        />
                        {quarterlySpend[card.cardId] && (
                          <span style={{ marginLeft: 8, fontSize: 12, color: parseInt(quarterlySpend[card.cardId]) >= card.spendRequired! ? '#16a34a' : '#dc2626' }}>
                            {parseInt(quarterlySpend[card.cardId]) >= card.spendRequired! ? '(ok) Lounge unlocked' : `Need Rs.${(card.spendRequired! - parseInt(quarterlySpend[card.cardId])).toLocaleString('en-IN')} more`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Log visit buttons */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: '#64748b', flex: 1 }}>Track a visit:</div>
                    <button onClick={() => removeVisit(card.cardId)} style={{
                      width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc', fontSize: 18, cursor: 'pointer', color: '#64748b',
                    }}>-</button>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C', minWidth: 20, textAlign: 'center' as const }}>
                      {card.visitsUsed}
                    </span>
                    <button onClick={() => logVisit(card.cardId)} style={{
                      width: 36, height: 36, borderRadius: 8, border: 'none',
                      backgroundColor: '#1B3A5C', fontSize: 18, cursor: 'pointer', color: '#fff',
                    }}>+</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Lounge directory */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: 20 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#1B3A5C' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Major airport lounges in India</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Quick reference for your next trip</div>
          </div>
          {LOUNGES_BY_AIRPORT.map((airport, i) => (
            <div key={airport.airport} style={{
              padding: '16px 24px',
              borderBottom: i < LOUNGES_BY_AIRPORT.length - 1 ? '1px solid #f8fafc' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B3A5C', marginBottom: 2 }}>{airport.airport}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{airport.terminal}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    {airport.lounges.map((l, j) => (
                      <span key={j} style={{
                        fontSize: 11, backgroundColor: '#f1f5f9', color: '#475569',
                        padding: '3px 10px', borderRadius: 100, fontWeight: 500,
                      }}>{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ backgroundColor: '#1B3A5C', borderRadius: 16, padding: '24px', textAlign: 'center' as const, marginTop: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Want more lounge visits?
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
            HDFC Infinia and Axis Magnus offer unlimited Priority Pass lounge access globally.
          </div>
          <Link href="/best-cards/travel" style={{
            display: 'inline-block', padding: '11px 24px', backgroundColor: '#C9972E',
            color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none',
          }}>
            See best travel cards &rarr;
          </Link>
        </div>

      </main>
    </div>
  );
}
