'use client';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { CompareTray } from '@/components/CompareTray';
import { formatINR } from '@/lib/utils';
import { Calculator, CreditCard, TrendingDown, IndianRupee } from 'lucide-react';

export default function CalculatorsPage() {
  // EMI Calculator
  const [loanAmt, setLoanAmt] = useState(50000);
  const [emiMonths, setEmiMonths] = useState(6);
  const [emiRate, setEmiRate] = useState(14);
  const emiMonthly = loanAmt * (emiRate/1200) * Math.pow(1 + emiRate/1200, emiMonths) / (Math.pow(1 + emiRate/1200, emiMonths) - 1);
  const emiTotal = emiMonthly * emiMonths;
  const emiInterest = emiTotal - loanAmt;

  // Interest Calculator (revolving)
  const [balance, setBalance] = useState(25000);
  const [apr, setApr] = useState(42);
  const [months, setMonths] = useState(3);
  const dailyRate = apr / 365 / 100;
  const monthlyInterest = balance * (apr / 12 / 100);
  const totalInterest = monthlyInterest * months;

  // Reward Calculator
  const [spend, setSpend] = useState(50000);
  const [rewardRate, setRewardRate] = useState(1);
  const [pointValue, setPointValue] = useState(0.25);
  const annualReward = spend * 12 * (rewardRate / 100) * pointValue;

  // Forex Calculator
  const [forexAmt, setForexAmt] = useState(100000);
  const [markup, setMarkup] = useState(3.5);
  const forexCharge = forexAmt * markup / 100;
  const forexSaving = forexAmt * markup / 100 - forexAmt * 1.5 / 100;

  const sliderStyle = (val: number, min: number, max: number) => ({
    width: '100%', background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((val-min)/(max-min))*100}%, rgba(255,255,255,0.1) ${((val-min)/(max-min))*100}%, rgba(255,255,255,0.1) 100%)`, height: 4, borderRadius: 2, appearance: 'none' as any, outline: 'none', cursor: 'pointer'
  });

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-12 px-4 sm:px-6 grain">
        <div className="max-w-5xl mx-auto">
          <div className="divider-rule mb-6 max-w-xs">Calculators</div>
          <h1 className="font-display text-4xl sm:text-5xl text-ink-50 mb-4">Credit card calculators</h1>
          <p className="text-ink-300 text-lg font-display leading-relaxed">Know exactly what you pay and what you earn before you swipe.</p>
        </div>
      </section>

      <section className="pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-6">

          {/* EMI Calculator */}
          <div className="bg-ink-900/40 border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-copper-400" />
              <h2 className="font-display text-xl text-ink-50">EMI Calculator</h2>
            </div>
            <p className="text-sm text-ink-400">Convert a large purchase to monthly EMIs.</p>
            {[
              { label: 'Purchase amount', val: loanAmt, set: setLoanAmt, min: 5000, max: 500000, step: 5000, fmt: formatINR },
              { label: 'Tenure (months)', val: emiMonths, set: setEmiMonths, min: 3, max: 24, step: 3, fmt: (v: number) => `${v}mo` },
              { label: 'Interest rate (annual %)', val: emiRate, set: setEmiRate, min: 10, max: 36, step: 0.5, fmt: (v: number) => `${v}%` },
            ].map(f => (
              <div key={f.label}>
                <div className="flex justify-between text-xs mb-1"><span className="text-ink-400">{f.label}</span><span className="font-mono text-copper-400">{f.fmt(f.val)}</span></div>
                <input type="range" min={f.min} max={f.max} step={f.step} value={f.val} onChange={e => f.set(Number(e.target.value))} style={sliderStyle(f.val, f.min, f.max)} />
              </div>
            ))}
            <div className="bg-ink-950 rounded-lg p-4 space-y-2 border border-white/5">
              <div className="flex justify-between text-sm"><span className="text-ink-400">Monthly EMI</span><span className="font-display text-lg text-copper-400 tabular">Rs.{Math.round(emiMonthly).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-400">Total payment</span><span className="font-mono tabular text-ink-100">Rs.{Math.round(emiTotal).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-400">Total interest</span><span className="font-mono tabular text-crimson-400">Rs.{Math.round(emiInterest).toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          {/* Interest Calculator */}
          <div className="bg-ink-900/40 border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-crimson-400" />
              <h2 className="font-display text-xl text-ink-50">Revolving Interest</h2>
            </div>
            <p className="text-sm text-ink-400">Cost of carrying an unpaid balance month-to-month.</p>
            {[
              { label: 'Outstanding balance', val: balance, set: setBalance, min: 1000, max: 200000, step: 1000, fmt: formatINR },
              { label: 'Your card APR', val: apr, set: setApr, min: 24, max: 54, step: 0.5, fmt: (v: number) => `${v}%` },
              { label: 'Months unpaid', val: months, set: setMonths, min: 1, max: 12, step: 1, fmt: (v: number) => `${v} month${v > 1 ? 's' : ''}` },
            ].map(f => (
              <div key={f.label}>
                <div className="flex justify-between text-xs mb-1"><span className="text-ink-400">{f.label}</span><span className="font-mono text-copper-400">{f.fmt(f.val)}</span></div>
                <input type="range" min={f.min} max={f.max} step={f.step} value={f.val} onChange={e => f.set(Number(e.target.value))} style={sliderStyle(f.val, f.min, f.max)} />
              </div>
            ))}
            <div className="bg-ink-950 rounded-lg p-4 space-y-2 border border-white/5">
              <div className="flex justify-between text-sm"><span className="text-ink-400">Monthly interest</span><span className="font-display text-lg text-crimson-400 tabular">Rs.{Math.round(monthlyInterest).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-400">Total interest ({months}mo)</span><span className="font-mono tabular text-crimson-400">Rs.{Math.round(totalInterest).toLocaleString('en-IN')}</span></div>
              <div className="text-xs text-ink-500 mt-2">Always pay in full. This is what the bank earns from you.</div>
            </div>
          </div>

          {/* Reward Calculator */}
          <div className="bg-ink-900/40 border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
              <h2 className="font-display text-xl text-ink-50">Reward Calculator</h2>
            </div>
            <p className="text-sm text-ink-400">Annual reward value from your card.</p>
            {[
              { label: 'Monthly spend', val: spend, set: setSpend, min: 5000, max: 300000, step: 5000, fmt: formatINR },
              { label: 'Reward rate', val: rewardRate, set: setRewardRate, min: 0.25, max: 10, step: 0.25, fmt: (v: number) => `${v}%` },
              { label: 'Value per point (Rs.)', val: pointValue, set: setPointValue, min: 0.10, max: 2.0, step: 0.05, fmt: (v: number) => `Rs.${v.toFixed(2)}` },
            ].map(f => (
              <div key={f.label}>
                <div className="flex justify-between text-xs mb-1"><span className="text-ink-400">{f.label}</span><span className="font-mono text-copper-400">{f.fmt(f.val)}</span></div>
                <input type="range" min={f.min} max={f.max} step={f.step} value={f.val} onChange={e => f.set(Number(e.target.value))} style={sliderStyle(f.val, f.min, f.max)} />
              </div>
            ))}
            <div className="bg-ink-950 rounded-lg p-4 space-y-2 border border-white/5">
              <div className="flex justify-between text-sm"><span className="text-ink-400">Monthly reward</span><span className="font-mono tabular text-ink-100">Rs.{Math.round(annualReward/12).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-400">Annual reward value</span><span className="font-display text-lg text-emerald-400 tabular">Rs.{Math.round(annualReward).toLocaleString('en-IN')}</span></div>
              <div className="text-xs text-ink-500 mt-2">Use Smart Match for personalised card recommendations.</div>
            </div>
          </div>

          {/* Forex Calculator */}
          <div className="bg-ink-900/40 border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-copper-400" />
              <h2 className="font-display text-xl text-ink-50">Forex Markup Calculator</h2>
            </div>
            <p className="text-sm text-ink-400">How much you pay extra on international transactions.</p>
            {[
              { label: 'International spend (Rs.)', val: forexAmt, set: setForexAmt, min: 10000, max: 1000000, step: 10000, fmt: formatINR },
              { label: 'Your card\'s markup', val: markup, set: setMarkup, min: 0, max: 4, step: 0.5, fmt: (v: number) => `${v}%` },
            ].map(f => (
              <div key={f.label}>
                <div className="flex justify-between text-xs mb-1"><span className="text-ink-400">{f.label}</span><span className="font-mono text-copper-400">{f.fmt(f.val)}</span></div>
                <input type="range" min={f.min} max={f.max} step={f.step} value={f.val} onChange={e => f.set(Number(e.target.value))} style={sliderStyle(f.val, f.min, f.max)} />
              </div>
            ))}
            <div className="bg-ink-950 rounded-lg p-4 space-y-2 border border-white/5">
              <div className="flex justify-between text-sm"><span className="text-ink-400">Forex charge paid</span><span className="font-display text-lg text-crimson-400 tabular">Rs.{Math.round(forexCharge).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-400">Savings vs 1.5% card</span><span className="font-mono tabular text-emerald-400">Rs.{Math.round(forexSaving).toLocaleString('en-IN')}</span></div>
              <div className="text-xs text-ink-500 mt-2">YES Marquee and IDFC Wealth have 0% forex markup.</div>
            </div>
          </div>

        </div>
      </section>
      <DesignFooter />
      <CompareTray />
    </main>
  );
}
