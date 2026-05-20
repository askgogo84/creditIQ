'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, Smartphone, CheckCircle, CreditCard, ArrowRight, Lock, Zap, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const SUPPORTED_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', color: '#004C8F', cards: ['Infinia', 'Regalia Gold', 'Millennia', 'Diners Black', 'MoneyBack+', 'Swiggy', 'Freedom'] },
  { id: 'axis', name: 'Axis Bank', color: '#97144D', cards: ['Magnus', 'Atlas', 'ACE', 'Flipkart', 'Vistara', 'MyZone', 'Reserve'] },
  { id: 'icici', name: 'ICICI Bank', color: '#F58220', cards: ['Amazon Pay', 'Sapphiro', 'Emeralde', 'Coral', 'Rubyx'] },
  { id: 'sbi', name: 'SBI Card', color: '#2C4C9C', cards: ['Cashback', 'Elite', 'AURUM', 'SimplyCLICK', 'PRIME'] },
  { id: 'kotak', name: 'Kotak Mahindra', color: '#EF3E23', cards: ['811', 'League', 'Royale', 'White'] },
  { id: 'amex', name: 'American Express', color: '#006FCF', cards: ['Platinum Travel', 'Gold', 'MRCC', 'SmartEarn'] },
  { id: 'idfc', name: 'IDFC FIRST Bank', color: '#9B0C2C', cards: ['Wealth', 'Select', 'Classic', 'WOW', 'Millennia'] },
  { id: 'yes', name: 'YES Bank', color: '#0C2461', cards: ['Marquee', 'First Preferred'] },
];

const STEPS = [
  { icon: CreditCard, title: 'Select your bank', desc: 'Choose from 8 supported banks' },
  { icon: Smartphone, title: 'Authorise via AA', desc: 'One-time consent on your bank\'s app' },
  { icon: CheckCircle, title: 'Points synced', desc: 'Live balance in your dashboard' },
];

type Step = 'select-bank' | 'consent' | 'success';

export default function LinkCardPage() {
  const [step, setStep] = useState<Step>('select-bank');
  const [selectedBank, setSelectedBank] = useState<typeof SUPPORTED_BANKS[0] | null>(null);
  const [consenting, setConsenting] = useState(false);

  const handleBankSelect = (bank: typeof SUPPORTED_BANKS[0]) => {
    setSelectedBank(bank);
    setStep('consent');
  };

  const handleConsent = async () => {
    setConsenting(true);
    // In production: redirect to AA consent flow (Finvu/Perfios)
    await new Promise(r => setTimeout(r, 2500));
    setConsenting(false);
    setStep('success');
  };

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />
      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* Progress */}
          <div className="flex items-center gap-2 mb-10">
            {STEPS.map((s, i) => {
              const stepNum = ['select-bank', 'consent', 'success'].indexOf(step);
              const done = i < stepNum;
              const active = i === stepNum;
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all" style={{ background: done ? 'var(--emerald)' : active ? 'var(--accent)' : 'var(--border)', color: (done || active) ? 'white' : 'var(--text-dim)' }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className="text-xs font-medium hidden sm:block" style={{ color: active ? 'var(--text)' : 'var(--text-dim)' }}>{s.title}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: done ? 'var(--emerald)' : 'var(--border)' }} />}
                </div>
              );
            })}
          </div>

          {/* Step 1 — Select bank */}
          {step === 'select-bank' && (
            <div>
              <h1 className="font-display text-3xl sm:text-4xl mb-3" style={{ color: 'var(--text)' }}>Link your credit card</h1>
              <p className="mb-2" style={{ color: 'var(--text-muted)' }}>
                Select your bank to connect via India's RBI-approved Account Aggregator framework.
              </p>
              <div className="flex items-center gap-2 mb-8 text-sm" style={{ color: 'var(--emerald)' }}>
                <Shield className="w-4 h-4 shrink-0" />
                <span>Bank-grade security · We never see your credentials · Revoke anytime</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {SUPPORTED_BANKS.map(bank => (
                  <button
                    key={bank.id}
                    onClick={() => handleBankSelect(bank)}
                    className="flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.02]"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: bank.color }}>
                      {bank.id.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{bank.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{bank.cards.length} cards</div>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 ml-auto" style={{ color: 'var(--text-dim)' }} />
                  </button>
                ))}
              </div>

              <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-dim)' }} />
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text)' }}>How it works:</strong> We use India's RBI-mandated Account Aggregator (AA) framework. Your bank sends your points balance directly to CreditIQ — we never see your login credentials, OTPs, or account passwords. You can revoke access from your bank's app at any time.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Consent */}
          {step === 'consent' && selectedBank && (
            <div>
              <button onClick={() => setStep('select-bank')} className="text-sm mb-6 flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                ← Back
              </button>
              <h1 className="font-display text-3xl mb-3" style={{ color: 'var(--text)' }}>Authorise {selectedBank.name}</h1>
              <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
                You'll be redirected to give one-time consent. This allows CreditIQ to read your card points balance only.
              </p>

              <div className="rounded-xl border p-6 mb-6 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <div className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>What CreditIQ will access:</div>
                {[
                  ['✅', 'Reward points balance on your cards'],
                  ['✅', 'Card names and last 4 digits'],
                  ['✅', 'Points expiry dates'],
                  ['❌', 'Card credentials, PINs, or passwords'],
                  ['❌', 'Transaction history or spending data'],
                  ['❌', 'Ability to make any transactions'],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4 mb-6 flex items-center gap-3" style={{ background: 'color-mix(in srgb, var(--emerald) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--emerald) 20%, transparent)' }}>
                <Lock className="w-4 h-4 shrink-0" style={{ color: 'var(--emerald)' }} />
                <div className="text-xs" style={{ color: 'var(--emerald)' }}>
                  <strong>RBI-approved framework.</strong> Account Aggregators are licensed by the Reserve Bank of India. Your data is encrypted end-to-end.
                </div>
              </div>

              <button
                onClick={handleConsent}
                disabled={consenting}
                className="btn-primary w-full text-base flex items-center justify-center gap-2"
                style={{ opacity: consenting ? 0.7 : 1 }}
              >
                {consenting ? (
                  <>Connecting to {selectedBank.name}...</>
                ) : (
                  <>Authorise {selectedBank.name} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <div className="text-center text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
                You'll complete consent on {selectedBank.name}'s secure page
              </div>
            </div>
          )}

          {/* Step 3 — Success */}
          {step === 'success' && selectedBank && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'color-mix(in srgb, var(--emerald) 15%, transparent)' }}>
                <CheckCircle className="w-10 h-10" style={{ color: 'var(--emerald)' }} />
              </div>
              <h1 className="font-display text-3xl mb-3" style={{ color: 'var(--text)' }}>{selectedBank.name} connected!</h1>
              <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
                Your card points are syncing now. This takes about 30 seconds.
              </p>

              <div className="rounded-xl border p-6 mb-6 text-left space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                {['Points balance synced', 'Redemption paths calculated', 'Portfolio optimizer updated', 'Alerts configured'].map((item, i) => (
                  <div key={item} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--emerald) 15%, transparent)' }}>
                      <CheckCircle className="w-3 h-3" style={{ color: 'var(--emerald)' }} />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/link-card" onClick={() => { setStep('select-bank'); setSelectedBank(null); }} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                  Link another card
                </Link>
                <Link href="/dashboard" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  <Zap className="w-4 h-4" />
                  Go to dashboard
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>
      <Footer />
    </main>
  );
}
