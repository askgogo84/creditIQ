'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import { CardTile } from '@/components/design/CardTile';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { matchCards, approvalProbability } from '@/lib/engine';
import { motion } from 'framer-motion';
import { Sliders } from 'lucide-react';
import type { UserSpendProfile } from '@/lib/types';
import { formatINR } from '@/lib/utils';

const VARIANT_ROTATION = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint'] as const;
const NETWORK_BY_BANK: Record<string, string> = { HDFC: 'VISA', AXIS: 'MASTERCARD', ICICI: 'AMEX', SBI: 'VISA', AMEX: 'AMEX', IDFC: 'VISA' };

function toTileCard(c: any, i: number) {
  const bank = (c.bank || '').toUpperCase();
  return {
    bank,
    name: (c.name || '').replace(/^HDFC\s+|^AXIS\s+|^ICICI\s+|^SBI\s+/i, '').replace(/ Credit Card$/i, ''),
    tagline: c.tier || 'Standard',
    tier: (c.tier || 'CARD').toUpperCase().replace(/-/g, ' '),
    network: NETWORK_BY_BANK[bank.split(' ')[0]] || 'VISA',
    variant: VARIANT_ROTATION[i % VARIANT_ROTATION.length],
    tags: (c.category || []).slice(0, 2).map((s: string) => s.replace(/-/g, ' ')),
    fee: c.annual_fee_inr || 0,
    iqScore: Math.round((c.expert_rating ?? 8) * 10),
  };
}

function SliderField({ label, value, onChange, min, max, step, format, compact }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string; compact?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: compact ? 8 : 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: compact ? 9 : 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', fontWeight: 600 }}>{label}</label>
        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 12, fontWeight: 700, color: 'var(--copper-3,#D89B2A)' }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--copper-3,#D89B2A)', height: 4, background: `linear-gradient(to right, var(--copper-3,#D89B2A) 0%, var(--copper-3,#D89B2A) ${pct}%, rgba(20,41,80,0.10) ${pct}%, rgba(20,41,80,0.10) 100%)`, borderRadius: 2, appearance: 'none' as any, cursor: 'pointer' }}
      />
    </div>
  );
}

export default function SmartMatchPage() {
  const [monthlyTotal, setMonthlyTotal] = useState(50000);
  const [onlineShare, setOnlineShare] = useState(40);
  const [diningShare, setDiningShare] = useState(15);
  const [fuelShare, setFuelShare] = useState(8);
  const [travelShare, setTravelShare] = useState(10);
  const [maxFee, setMaxFee] = useState(5000);
  const [creditScore, setCreditScore] = useState(750);
  const [income, setIncome] = useState(100000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const spend: UserSpendProfile = useMemo(() => ({
    monthly_total_inr: monthlyTotal,
    online_inr: (monthlyTotal * onlineShare) / 100,
    dining_inr: (monthlyTotal * diningShare) / 100,
    fuel_inr: (monthlyTotal * fuelShare) / 100,
    travel_inr: (monthlyTotal * travelShare) / 100,
  }), [monthlyTotal, onlineShare, diningShare, fuelShare, travelShare]);

  const results = useMemo(() => {
    const matches = matchCards(SEED_CARDS, spend, {
      max_fee: maxFee,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    });
    return matches.slice(0, 12).map((m) => ({
      ...m,
      approval_prob: approvalProbability(m.card, income, creditScore),
    }));
  }, [spend, maxFee, selectedCategories, income, creditScore]);

  const toggleCategory = (c: string) => {
    setSelectedCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  return (
    <main className="page-fade">
      <Header />

      {/* Hero */}
      <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
        <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
        <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
          <Reveal>
            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', fontWeight: 700, marginBottom: 16 }}>Smart Match</div>
            <h1 style={{ fontSize: 'clamp(36px,6vw,80px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.0, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
              Tell us how you{' '}
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>spend</span>.
            </h1>
            <p style={{ fontSize: 'clamp(15px,1.4vw,18px)', color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65, margin: 0, maxWidth: 480 }}>
              Results update live as you adjust. No submit button. No email gate. No bullshit.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Main content */}
      <section style={{ paddingBottom: 80 }}>
        <div className="shell">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,340px) minmax(0,1fr)', gap: 24, alignItems: 'start' }} className="grid-1-mobile">

            {/* Config panel */}
            <div style={{ position: 'sticky', top: 96, background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 20, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Sliders style={{ width: 16, height: 16, color: 'var(--copper,#8C5F12)' }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', letterSpacing: '-0.01em' }}>Your profile</span>
              </div>

              <SliderField label="Monthly spend" value={monthlyTotal} onChange={setMonthlyTotal} min={5000} max={500000} step={5000} format={formatINR} />

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 10 }}>Spend allocation</div>
                <SliderField label="Online shopping" value={onlineShare} onChange={setOnlineShare} min={0} max={80} step={5} format={(v) => `${v}%`} compact />
                <SliderField label="Dining & food" value={diningShare} onChange={setDiningShare} min={0} max={50} step={5} format={(v) => `${v}%`} compact />
                <SliderField label="Fuel" value={fuelShare} onChange={setFuelShare} min={0} max={30} step={2} format={(v) => `${v}%`} compact />
                <SliderField label="Travel" value={travelShare} onChange={setTravelShare} min={0} max={50} step={5} format={(v) => `${v}%`} compact />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 10 }}>Constraints</div>
                <SliderField label="Max annual fee" value={maxFee} onChange={setMaxFee} min={0} max={20000} step={500} format={formatINR} compact />
                <SliderField label="Monthly income" value={income} onChange={setIncome} min={20000} max={500000} step={10000} format={formatINR} compact />
                <SliderField label="Credit score (CIBIL)" value={creditScore} onChange={setCreditScore} min={650} max={850} step={10} format={(v) => v.toString()} compact />
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 10 }}>Card type focus</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['cashback', 'travel', 'premium', 'zero-fee', 'rewards'].map((c) => (
                    <button key={c} onClick={() => toggleCategory(c)} style={{
                      fontSize: 10, padding: '5px 12px', borderRadius: 100, border: '1.5px solid',
                      borderColor: selectedCategories.includes(c) ? 'var(--copper-3,#D89B2A)' : 'var(--line,rgba(20,41,80,0.12))',
                      background: selectedCategories.includes(c) ? 'rgba(212,163,115,0.12)' : 'var(--surface,#fff)',
                      color: selectedCategories.includes(c) ? 'var(--copper,#8C5F12)' : 'var(--ink-3,#5A6A8A)',
                      cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-mono,monospace)', letterSpacing: '0.06em',
                    }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', fontWeight: 700 }}>
                  {results.length} matches — live
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {results.map((r, i) => (
                  <motion.div key={r.card.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ position: 'relative' }}>
                    <CardTile card={toTileCard(r.card, i)} href={`/card/${r.card.slug}`} rank={i + 1} />
                    {r.approval_prob > 0 && (
                      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.12))', borderRadius: 8, padding: '3px 8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: 'var(--ink-3,#5A6A8A)' }}>approval </span>
                        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, color: r.approval_prob >= 70 ? '#2d7a56' : r.approval_prob >= 40 ? 'var(--copper,#8C5F12)' : '#B84230' }}>
                          {r.approval_prob}%
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <DesignFooter />
    </main>
  );
}
