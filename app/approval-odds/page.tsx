'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { getApplyUrl } from '@/lib/affiliate';

interface OddsResult {
  cardId: string;
  cardName: string;
  bank: string;
  annualFee: number;
  approvalProbability: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Low';
  gradeColor: string;
  reasons: string[];
  improvements: string[];
  minCibil: number;
  minIncome: number;
  recommended: boolean;
}

const EMPLOYMENT_TYPES = ['Salaried', 'Self-employed', 'Business owner', 'Freelancer', 'Student'];

export default function ApprovalOddsPage() {
  const [cibil, setCibil] = useState('750');
  const [income, setIncome] = useState('100000');
  const [employment, setEmployment] = useState('Salaried');
  const [existing, setExisting] = useState('1');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OddsResult[]>([]);
  const [calculated, setCalculated] = useState(false);

  const calculate = () => {
    setLoading(true);
    const cibilScore = parseInt(cibil) || 0;
    const monthlyIncome = parseInt(income) || 0;
    const existingCards = parseInt(existing) || 0;

    // Calculate approval odds for each card
    const cardResults: OddsResult[] = (SEED_CARDS as any[])
      .filter(c => c.active)
      .map(card => {
        const minCibil = card.min_cibil_score || 700;
        const minIncome = card.min_income_inr_monthly || 25000;
        const annualFee = card.annual_fee_inr || 0;

        let probability = 50;

        // CIBIL scoring
        if (cibilScore >= 800) probability += 30;
        else if (cibilScore >= 750) probability += 20;
        else if (cibilScore >= 700) probability += 5;
        else if (cibilScore >= 650) probability -= 15;
        else probability -= 35;

        // Income scoring
        const incomeRatio = monthlyIncome / (minIncome || 25000);
        if (incomeRatio >= 3) probability += 20;
        else if (incomeRatio >= 2) probability += 12;
        else if (incomeRatio >= 1.5) probability += 5;
        else if (incomeRatio >= 1) probability -= 5;
        else probability -= 30;

        // Employment type
        if (employment === 'Salaried') probability += 8;
        else if (employment === 'Business owner') probability += 5;
        else if (employment === 'Self-employed') probability += 3;
        else if (employment === 'Student') probability -= 20;

        // Existing cards
        if (existingCards >= 1 && existingCards <= 3) probability += 5;
        else if (existingCards > 5) probability -= 5;

        // CIBIL below minimum
        if (cibilScore < minCibil) probability -= 40;

        // Income below minimum
        if (monthlyIncome < minIncome) probability -= 35;

        probability = Math.max(5, Math.min(95, probability));

        let grade: OddsResult['grade'];
        let gradeColor: string;
        if (probability >= 75) { grade = 'Excellent'; gradeColor = '#22c55e'; }
        else if (probability >= 55) { grade = 'Good'; gradeColor = '#C9972E'; }
        else if (probability >= 35) { grade = 'Fair'; gradeColor = '#f59e0b'; }
        else { grade = 'Low'; gradeColor = '#ef4444'; }

        const reasons: string[] = [];
        const improvements: string[] = [];

        if (cibilScore >= 750) reasons.push(`Strong CIBIL score of ${cibilScore}`);
        else if (cibilScore < minCibil) {
          reasons.push(`CIBIL ${cibilScore} is below required ${minCibil}`);
          improvements.push(`Improve CIBIL to ${minCibil}+ by paying dues on time`);
        }

        if (monthlyIncome >= minIncome * 2) reasons.push('Income well above requirement');
        else if (monthlyIncome < minIncome) {
          reasons.push(`Income Rs.${monthlyIncome.toLocaleString('en-IN')}/mo below Rs.${minIncome.toLocaleString('en-IN')}/mo required`);
          improvements.push('Apply for a lower-fee card first to build credit history');
        }

        if (employment === 'Salaried') reasons.push('Salaried employment preferred by banks');
        if (existingCards === 0) improvements.push('Having 1 existing card improves approval chances');

        return {
          cardId: card.id,
          cardName: card.name,
          bank: card.bank,
          annualFee,
          approvalProbability: Math.round(probability),
          grade,
          gradeColor,
          reasons,
          improvements,
          minCibil,
          minIncome,
          recommended: probability >= 65,
        };
      })
      .sort((a, b) => b.approvalProbability - a.approvalProbability)
      .slice(0, 12);

    setTimeout(() => {
      setResults(cardResults);
      setCalculated(true);
      setLoading(false);
    }, 800);
  };

  const topCards = results.filter(r => r.recommended).slice(0, 6);
  const otherCards = results.filter(r => !r.recommended).slice(0, 4);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #08080E)' }}>
      <Header />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
            Approval Odds
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, color: 'var(--text, #0f172a)', margin: '0 0 10px', letterSpacing: -0.5 }}>
            Know before you apply.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted, #8888AA)', margin: 0, lineHeight: 1.6 }}>
            Hard inquiries hurt your CIBIL score. Check your approval odds first — only apply when you're likely to get it.
          </p>
        </div>

        {/* Input form */}
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                CIBIL Score
              </label>
              <input type="number" value={cibil} onChange={e => setCibil(e.target.value)}
                min="300" max="900" placeholder="e.g. 750"
                style={{ width: '100%', height: 44, padding: '0 14px', background: 'var(--bg-input, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 10, fontSize: 15, color: 'var(--text, #0f172a)', outline: 'none', boxSizing: 'border-box' as const }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)', marginTop: 4 }}>
                {parseInt(cibil) >= 750 ? '✓ Excellent' : parseInt(cibil) >= 700 ? '~ Good' : '✗ Needs work'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                Monthly Income (Rs.)
              </label>
              <input type="number" value={income} onChange={e => setIncome(e.target.value)}
                placeholder="e.g. 100000"
                style={{ width: '100%', height: 44, padding: '0 14px', background: 'var(--bg-input, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 10, fontSize: 15, color: 'var(--text, #0f172a)', outline: 'none', boxSizing: 'border-box' as const }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)', marginTop: 4 }}>
                Rs.{(parseInt(income) || 0).toLocaleString('en-IN')}/month
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                Employment Type
              </label>
              <select value={employment} onChange={e => setEmployment(e.target.value)}
                style={{ width: '100%', height: 44, padding: '0 14px', background: 'var(--bg-input, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 10, fontSize: 14, color: 'var(--text, #0f172a)', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const }}>
                {EMPLOYMENT_TYPES.map(e => <option key={e} value={e} style={{ background: 'var(--bg-input, #f8fafc)', color: 'var(--text, #0f172a)' }}>{e}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                Existing Credit Cards
              </label>
              <select value={existing} onChange={e => setExisting(e.target.value)}
                style={{ width: '100%', height: 44, padding: '0 14px', background: 'var(--bg-input, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 10, fontSize: 14, color: 'var(--text, #0f172a)', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const }}>
                {['0', '1', '2', '3', '4', '5+'].map(n => <option key={n} value={n} style={{ background: 'var(--bg-input, #f8fafc)', color: 'var(--text, #0f172a)' }}>{n} card{n !== '1' ? 's' : ''}</option>)}
              </select>
            </div>
          </div>

          <button onClick={calculate} disabled={loading} style={{
            width: '100%', height: 52,
            background: loading ? 'rgba(201,151,46,0.3)' : 'linear-gradient(135deg, #C9972E, #E8B84B)',
            color: loading ? 'rgba(255,255,255,0.4)' : '#0a0a0a',
            border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Calculating odds...' : 'Check My Approval Odds →'}
          </button>
        </div>

        {/* Results */}
        {calculated && results.length > 0 && (
          <>
            {/* Summary */}
            <div style={{ background: 'linear-gradient(135deg, #1B3A5C, #0d2240)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, border: '1px solid rgba(201,151,46,0.2)' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Based on CIBIL {cibil} · Rs.{parseInt(income).toLocaleString('en-IN')}/mo · {employment}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                {topCards.length} cards with {'>'}65% approval odds
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                Sorted by approval probability — apply to top cards only to protect your CIBIL score
              </div>
            </div>

            {/* Top recommended */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Recommended — high approval odds
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {topCards.map((card, i) => {
                const { url, label } = getApplyUrl(card.cardId);
                return (
                  <div key={card.cardId} style={{
                    background: 'var(--bg-card, #fff)',
                    border: i === 0 ? '1px solid rgba(201,151,46,0.3)' : '1px solid var(--border, #e2e8f0)',
                    borderRadius: 16, padding: '18px 20px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <div style={{
                            width: 52, height: 28, borderRadius: 6,
                            background: `conic-gradient(${card.gradeColor} ${card.approvalProbability}%, var(--border, #e2e8f0) 0)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, color: card.gradeColor,
                          }}>
                            {card.approvalProbability}%
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #0f172a)' }}>{card.cardName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted, #8888AA)' }}>{card.bank} · {card.annualFee === 0 ? 'Free' : `Rs.${card.annualFee.toLocaleString('en-IN')}/yr`}</div>
                          </div>
                        </div>
                        {card.reasons.slice(0, 2).map((r, j) => (
                          <div key={j} style={{ fontSize: 12, color: card.gradeColor, marginBottom: 2 }}>✓ {r}</div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{
                          padding: '4px 12px', borderRadius: 100,
                          background: `${card.gradeColor}20`,
                          border: `1px solid ${card.gradeColor}40`,
                          fontSize: 12, fontWeight: 700, color: card.gradeColor,
                          textAlign: 'center' as const,
                        }}>{card.grade}</div>
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{
                          display: 'block', textAlign: 'center' as const, padding: '10px 20px',
                          background: 'linear-gradient(135deg, #C9972E, #E8B84B)',
                          color: '#0a0a0a', borderRadius: 10, fontSize: 13, fontWeight: 700,
                          textDecoration: 'none', whiteSpace: 'nowrap' as const,
                        }}>{label}</a>
                        <Link href={`/cards/${card.cardId}`} style={{
                          display: 'block', textAlign: 'center' as const, padding: '8px',
                          color: 'var(--text-muted, #8888AA)', fontSize: 12, textDecoration: 'none',
                        }}>View full review →</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
