'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, Smartphone, CheckCircle, CreditCard, ArrowRight, Lock, Zap, ChevronRight, AlertCircle, Phone } from 'lucide-react';
import Link from 'next/link';

const SUPPORTED_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', color: '#004C8F', fipId: 'HDFC', cards: 12 },
  { id: 'axis', name: 'Axis Bank', color: '#97144D', fipId: 'AXIS', cards: 8 },
  { id: 'icici', name: 'ICICI Bank', color: '#F58220', fipId: 'ICICI', cards: 7 },
  { id: 'sbi', name: 'SBI Card', color: '#2C4C9C', fipId: 'SBI', cards: 9 },
  { id: 'kotak', name: 'Kotak Mahindra', color: '#EF3E23', fipId: 'KOTAK', cards: 5 },
  { id: 'amex', name: 'American Express', color: '#006FCF', fipId: 'AMEX', cards: 4 },
  { id: 'idfc', name: 'IDFC FIRST Bank', color: '#9B0C2C', fipId: 'IDFC', cards: 6 },
  { id: 'yes', name: 'YES Bank', color: '#0C2461', fipId: 'YES', cards: 3 },
];

type Step = 'select-bank' | 'mobile' | 'consent' | 'waiting' | 'success' | 'error';

export default function LinkCardPage() {
  const [step, setStep] = useState<Step>('select-bank');
  const [selectedBank, setSelectedBank] = useState<typeof SUPPORTED_BANKS[0] | null>(null);
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentHandle, setConsentHandle] = useState('');
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  const handleBankSelect = (bank: typeof SUPPORTED_BANKS[0]) => {
    setSelectedBank(bank);
    setStep('mobile');
  };

  const handleMobileSubmit = async () => {
    if (mobile.length !== 10) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/aa/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-' + Date.now(), mobile }),
      });
      const data = await res.json();

      if (data.demo) {
        setIsDemo(true);
        setConsentHandle(data.consentHandle);
        setStep('consent');
      } else if (data.redirectUrl) {
        setConsentHandle(data.consentHandle);
        setStep('consent');
        // In real mode, open Finvu redirect in same tab
        // window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.error || 'Failed to create consent');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleConsent = async () => {
    setLoading(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 2000));
      setStep('success');
    } else {
      // Redirect to Finvu consent page
      setStep('waiting');
    }
    setLoading(false);
  };

  const STEPS = ['Select bank', 'Mobile number', 'Authorise', 'Done'];
  const stepIndex = { 'select-bank': 0, 'mobile': 1, 'consent': 2, 'waiting': 2, 'success': 3, 'error': 0 }[step];

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />
      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* Progress steps */}
          <div className="flex items-center gap-1 mb-10">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all" style={{ background: i < stepIndex ? 'var(--emerald)' : i === stepIndex ? 'var(--accent)' : 'var(--border)', color: i <= stepIndex ? 'white' : 'var(--text-dim)' }}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span className="text-xs hidden sm:block" style={{ color: i === stepIndex ? 'var(--text)' : 'var(--text-dim)' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-px mx-1" style={{ background: i < stepIndex ? 'var(--emerald)' : 'var(--border)' }} />}
              </div>
            ))}
          </div>

          {/* STEP 1: Select bank */}
          {step === 'select-bank' && (
            <div>
              <h1 className="font-display text-3xl sm:text-4xl mb-3" style={{ color: 'var(--text)' }}>Link your credit card</h1>
              <p className="mb-2" style={{ color: 'var(--text-muted)' }}>Select your bank to securely connect via the RBI Account Aggregator framework.</p>
              <div className="flex items-center gap-2 mb-8 text-sm" style={{ color: 'var(--emerald)' }}>
                <Shield className="w-4 h-4 shrink-0" />
                <span>Bank-grade security · Read-only access · Revoke anytime from your bank app</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {SUPPORTED_BANKS.map(bank => (
                  <button key={bank.id} onClick={() => handleBankSelect(bank)} className="flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.01]" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: bank.color }}>
                      {bank.id.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{bank.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{bank.cards} cards tracked</div>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 ml-auto" style={{ color: 'var(--text-dim)' }} />
                  </button>
                ))}
              </div>
              <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-dim)' }} />
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text)' }}>Powered by RBI Account Aggregator (AA).</strong> Your bank sends data directly to CreditIQ — we never see your credentials, OTPs, or passwords. You authorise once from your bank app. Revoke access anytime.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Mobile number */}
          {step === 'mobile' && selectedBank && (
            <div>
              <button onClick={() => setStep('select-bank')} className="text-sm mb-6 flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>← Back</button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: selectedBank.color }}>{selectedBank.id.slice(0, 2).toUpperCase()}</div>
                <div>
                  <h1 className="font-display text-2xl" style={{ color: 'var(--text)' }}>{selectedBank.name}</h1>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter mobile number registered with this bank</p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-dim)' }}>Mobile number</label>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-3 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>+91</div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      style={{ flex: 1, padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15, color: 'var(--text)', outline: 'none', fontFamily: 'monospace' }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>Must be the number registered with {selectedBank.name}</p>
                </div>
              </div>
              {error && <div className="rounded-lg p-3 mb-4 text-sm" style={{ background: 'color-mix(in srgb, var(--crimson) 10%, transparent)', color: 'var(--crimson)', border: '1px solid color-mix(in srgb, var(--crimson) 25%, transparent)' }}>{error}</div>}
              <button onClick={handleMobileSubmit} disabled={mobile.length !== 10 || loading} className="btn-primary w-full flex items-center justify-center gap-2" style={{ opacity: mobile.length !== 10 || loading ? 0.6 : 1 }}>
                <Phone className="w-4 h-4" />
                {loading ? 'Creating consent request...' : 'Continue'}
              </button>
            </div>
          )}

          {/* STEP 3: Consent */}
          {step === 'consent' && selectedBank && (
            <div>
              <button onClick={() => setStep('mobile')} className="text-sm mb-6 flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>← Back</button>
              <h1 className="font-display text-3xl mb-3" style={{ color: 'var(--text)' }}>Authorise {selectedBank.name}</h1>
              {isDemo && (
                <div className="rounded-lg p-3 mb-4 text-xs" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', color: 'var(--accent)' }}>
                  Demo mode — using simulated data. Finvu API keys not yet configured.
                </div>
              )}
              <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
                {isDemo ? 'This simulates the consent flow. In production, you\'ll be redirected to your bank\'s secure consent page.' : 'You\'ll be redirected to complete consent on Finvu\'s secure page. Takes 30 seconds.'}
              </p>
              <div className="rounded-xl border p-6 mb-6 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <div className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>CreditIQ will only access:</div>
                {[['✅', 'Reward points balance'], ['✅', 'Card names and last 4 digits'], ['✅', 'Points expiry dates'], ['❌', 'Card credentials or PINs'], ['❌', 'Transaction history'], ['❌', 'Ability to make payments']].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}><span>{icon}</span><span>{text}</span></div>
                ))}
              </div>
              <div className="rounded-xl p-4 mb-6 flex items-center gap-3" style={{ background: 'color-mix(in srgb, var(--emerald) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--emerald) 20%, transparent)' }}>
                <Lock className="w-4 h-4 shrink-0" style={{ color: 'var(--emerald)' }} />
                <p className="text-xs" style={{ color: 'var(--emerald)' }}><strong>RBI-licensed framework.</strong> Account Aggregators are regulated by Reserve Bank of India. End-to-end encrypted.</p>
              </div>
              <button onClick={handleConsent} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Connecting...' : <>{isDemo ? 'Simulate consent' : `Authorise ${selectedBank.name}`} <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-center text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
                {isDemo ? 'Demo flow' : `You'll complete authorisation on ${selectedBank.name}'s secure page`}
              </p>
            </div>
          )}

          {/* Waiting for callback */}
          {step === 'waiting' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                <Smartphone className="w-8 h-8" style={{ color: 'var(--accent)' }} />
              </div>
              <h2 className="font-display text-2xl mb-3" style={{ color: 'var(--text)' }}>Complete on your bank app</h2>
              <p style={{ color: 'var(--text-muted)' }}>Check your phone for the consent notification from {selectedBank?.name}. Approve it to continue.</p>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && selectedBank && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'color-mix(in srgb, var(--emerald) 15%, transparent)' }}>
                <CheckCircle className="w-10 h-10" style={{ color: 'var(--emerald)' }} />
              </div>
              <h1 className="font-display text-3xl mb-3" style={{ color: 'var(--text)' }}>{selectedBank.name} connected!</h1>
              <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Your card points are syncing now. Check your dashboard in 30 seconds.</p>
              <div className="rounded-xl border p-5 mb-6 text-left space-y-2.5" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                {['Points balance synced', 'Redemption paths calculated', 'Portfolio optimizer updated', 'Devaluation alerts configured'].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--emerald)' }} />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => { setStep('select-bank'); setSelectedBank(null); setMobile(''); }} className="btn-ghost flex-1 text-sm">Link another card</button>
                <Link href="/dashboard" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  <Zap className="w-4 h-4" /> Go to dashboard
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
