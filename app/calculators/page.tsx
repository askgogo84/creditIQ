'use client';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import { formatINR } from '@/lib/utils';
import { Calculator, CreditCard, TrendingDown, IndianRupee } from 'lucide-react';

function SliderRow({ label, val, set, min, max, step, fmt }: { label: string; val: number; set: (v: number) => void; min: number; max: number; step: number; fmt: (v: number) => string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 13, fontWeight: 700, color: 'var(--copper-3,#D89B2A)' }}>{fmt(val)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--copper-3,#D89B2A)', height: 4 }} />
    </div>
  );
}

function ResultRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid var(--line,rgba(20,41,80,0.06))' }}>
      <span style={{ fontSize: 13, color: 'var(--ink-2,#2A3F6B)' }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 800, color: color ?? 'var(--ink,#142950)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

export default function CalculatorsPage() {
  const [loanAmt, setLoanAmt] = useState(50000);
  const [emiMonths, setEmiMonths] = useState(6);
  const [emiRate, setEmiRate] = useState(14);
  const emiMonthly = loanAmt * (emiRate/1200) * Math.pow(1 + emiRate/1200, emiMonths) / (Math.pow(1 + emiRate/1200, emiMonths) - 1);
  const emiTotal = emiMonthly * emiMonths;
  const emiInterest = emiTotal - loanAmt;

  const [balance, setBalance] = useState(25000);
  const [apr, setApr] = useState(42);
  const [months, setMonths] = useState(3);
  const monthlyInterest = balance * (apr / 12 / 100);
  const totalInterest = monthlyInterest * months;

  const [spend, setSpend] = useState(50000);
  const [rewardRate, setRewardRate] = useState(1);
  const [pointValue, setPointValue] = useState(0.25);
  const annualReward = spend * 12 * (rewardRate / 100) * pointValue;

  const [forexAmt, setForexAmt] = useState(100000);
  const [markup, setMarkup] = useState(3.5);
  const forexCharge = forexAmt * markup / 100;
  const forexSaving = forexAmt * markup / 100 - forexAmt * 1.5 / 100;

  const CALCS = [
    {
      icon: <Calculator style={{ width: 18, height: 18, color: 'var(--copper,#8C5F12)' }} />,
      title: 'EMI Calculator',
      desc: 'Convert a large purchase to monthly EMIs.',
      sliders: [
        { label: 'Purchase amount', val: loanAmt, set: setLoanAmt, min: 5000, max: 500000, step: 5000, fmt: formatINR },
        { label: 'Tenure (months)', val: emiMonths, set: setEmiMonths, min: 3, max: 24, step: 3, fmt: (v: number) => `${v} months` },
        { label: 'Interest rate (annual)', val: emiRate, set: setEmiRate, min: 10, max: 36, step: 0.5, fmt: (v: number) => `${v}%` },
      ],
      results: [
        { label: 'Monthly EMI', value: `Rs.${Math.round(emiMonthly).toLocaleString('en-IN')}`, color: 'var(--copper,#8C5F12)' },
        { label: 'Total payment', value: `Rs.${Math.round(emiTotal).toLocaleString('en-IN')}` },
        { label: 'Total interest', value: `Rs.${Math.round(emiInterest).toLocaleString('en-IN')}`, color: '#B84230' },
      ],
    },
    {
      icon: <TrendingDown style={{ width: 18, height: 18, color: '#B84230' }} />,
      title: 'Revolving Interest',
      desc: 'Cost of carrying an unpaid balance month-to-month.',
      sliders: [
        { label: 'Outstanding balance', val: balance, set: setBalance, min: 1000, max: 200000, step: 1000, fmt: formatINR },
        { label: 'Your card APR', val: apr, set: setApr, min: 24, max: 54, step: 0.5, fmt: (v: number) => `${v}%` },
        { label: 'Months unpaid', val: months, set: setMonths, min: 1, max: 12, step: 1, fmt: (v: number) => `${v} month${v > 1 ? 's' : ''}` },
      ],
      results: [
        { label: 'Monthly interest', value: `Rs.${Math.round(monthlyInterest).toLocaleString('en-IN')}`, color: '#B84230' },
        { label: `Total interest (${months} months)`, value: `Rs.${Math.round(totalInterest).toLocaleString('en-IN')}`, color: '#B84230' },
      ],
      note: 'Always pay in full. This is what the bank earns from you.',
    },
    {
      icon: <IndianRupee style={{ width: 18, height: 18, color: '#2d7a56' }} />,
      title: 'Reward Calculator',
      desc: 'Annual reward value from your card spend.',
      sliders: [
        { label: 'Monthly spend', val: spend, set: setSpend, min: 5000, max: 300000, step: 5000, fmt: formatINR },
        { label: 'Reward rate', val: rewardRate, set: setRewardRate, min: 0.25, max: 10, step: 0.25, fmt: (v: number) => `${v}%` },
        { label: 'Value per point (Rs.)', val: pointValue, set: setPointValue, min: 0.10, max: 2.0, step: 0.05, fmt: (v: number) => `Rs.${v.toFixed(2)}` },
      ],
      results: [
        { label: 'Monthly reward', value: `Rs.${Math.round(annualReward/12).toLocaleString('en-IN')}` },
        { label: 'Annual reward value', value: `Rs.${Math.round(annualReward).toLocaleString('en-IN')}`, color: '#2d7a56' },
      ],
    },
    {
      icon: <CreditCard style={{ width: 18, height: 18, color: 'var(--copper,#8C5F12)' }} />,
      title: 'Forex Markup Calculator',
      desc: 'How much you pay extra on international transactions.',
      sliders: [
        { label: 'International spend (Rs.)', val: forexAmt, set: setForexAmt, min: 10000, max: 1000000, step: 10000, fmt: formatINR },
        { label: "Your card's markup", val: markup, set: setMarkup, min: 0, max: 4, step: 0.5, fmt: (v: number) => `${v}%` },
      ],
      results: [
        { label: 'Forex charge paid', value: `Rs.${Math.round(forexCharge).toLocaleString('en-IN')}`, color: '#B84230' },
        { label: 'Savings vs 1.5% card', value: `Rs.${Math.round(forexSaving).toLocaleString('en-IN')}`, color: markup > 1.5 ? '#2d7a56' : 'var(--ink-3,#5A6A8A)' },
      ],
      note: 'YES Marquee and IDFC Wealth have 0% forex markup.',
    },
  ];

  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', fontWeight: 700, marginBottom: 16 }}>4 calculators</div>
              <h1 style={{ fontSize: 'clamp(36px,6vw,80px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
                Credit card{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>calculators</span>
              </h1>
              <p style={{ fontSize: 'clamp(15px,1.4vw,18px)', color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65, margin: 0, maxWidth: 480 }}>
                Know exactly what you pay and what you earn before you swipe.
              </p>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 80 }}>
          <div className="shell">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
              {CALCS.map((calc, i) => (
                <Reveal key={calc.title} style={{ animationDelay: `${i * 80}ms` }}>
                  <div style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 20, padding: 'clamp(20px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        {calc.icon}
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink,#142950)', margin: 0, letterSpacing: '-0.01em' }}>{calc.title}</h2>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', margin: 0 }}>{calc.desc}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {calc.sliders.map(s => (
                        <SliderRow key={s.label} {...s} />
                      ))}
                    </div>

                    <div style={{ background: 'var(--surface,#fff)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                      {calc.results.map(r => (
                        <ResultRow key={r.label} {...r} />
                      ))}
                      {calc.note && (
                        <p style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)', margin: '10px 0 0', letterSpacing: '0.05em' }}>{calc.note}</p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  );
}
