'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Upload, FileText, CheckCircle, AlertCircle, Zap, ArrowRight, Lock, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const BANKS = [
  { id: 'HDFC', name: 'HDFC Bank', color: '#004C8F', pwdHint: 'First 4 letters of name + DOB DDMM → e.g. GOVE0305' },
  { id: 'Axis', name: 'Axis Bank', color: '#97144D', pwdHint: 'PAN card number → e.g. ABCDE1234F' },
  { id: 'AmEx', name: 'American Express', color: '#006FCF', pwdHint: 'Date of birth DDMMYYYY → e.g. 03051985' },
  { id: 'ICICI', name: 'ICICI Bank', color: '#F58220', pwdHint: 'Date of birth DDMMYYYY → e.g. 03051985' },
  { id: 'SBI', name: 'SBI Card', color: '#2C4C9C', pwdHint: 'Date of birth DDMMYYYY → e.g. 03051985' },
  { id: 'Kotak', name: 'Kotak Bank', color: '#EF3E23', pwdHint: 'Date of birth DDMMYYYY → e.g. 03051985' },
  { id: 'IDFC', name: 'IDFC FIRST Bank', color: '#9B0C2C', pwdHint: 'Registered mobile number' },
  { id: 'Yes', name: 'YES Bank', color: '#0C2461', pwdHint: 'Date of birth DDMMYYYY → e.g. 03051985' },
];

export default function UploadStatementPage() {
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[0] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pwdHint, setPwdHint] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) { setError('File too large — max 10MB'); return; }
    setFile(f); setError(''); setResult(null); setNeedsPassword(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleParse = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bank', selectedBank?.id || 'Unknown');

      const res = await fetch('/api/parse-statement', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.needsPassword) {
        setNeedsPassword(true);
        setPwdHint(data.hint || selectedBank?.pwdHint || '');
      } else if (!res.ok || data.error) {
        setError(data.error || 'Failed to parse statement');
      } else {
        setResult(data.data);
      }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />
      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }}>
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>AI reads your points in 3 seconds</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl mb-4 leading-tight" style={{ color: 'var(--text)' }}>
            Upload your <em className="text-copper-400 not-italic display-italic">statement</em>
          </h1>
          <p className="text-lg mb-10" style={{ color: 'var(--text-muted)' }}>
            Download your monthly PDF from your bank app. Upload here. We extract your points balance instantly.
          </p>

          {!result && !needsPassword && (
            <div className="space-y-5">
              {/* Bank selector */}
              <div>
                <label className="text-xs font-mono uppercase tracking-widest mb-3 block" style={{ color: 'var(--text-dim)' }}>1. Select your bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {BANKS.map(bank => (
                    <button key={bank.id} onClick={() => setSelectedBank(bank)}
                      className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                      style={{ borderColor: selectedBank?.id === bank.id ? bank.color : 'var(--border)', background: selectedBank?.id === bank.id ? `${bank.color}15` : 'var(--bg-elevated)' }}>
                      <div className="w-8 h-8 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: bank.color }}>{bank.id.slice(0, 2)}</div>
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File drop */}
              <div>
                <label className="text-xs font-mono uppercase tracking-widest mb-3 block" style={{ color: 'var(--text-dim)' }}>2. Upload PDF statement</label>
                <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all"
                  style={{ borderColor: dragging ? 'var(--accent)' : file ? 'var(--emerald)' : 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-5 h-5" style={{ color: 'var(--emerald)' }} />
                      <div className="text-left">
                        <div className="font-medium text-sm truncate max-w-xs" style={{ color: 'var(--text)' }}>{file.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{(file.size / 1024).toFixed(0)} KB</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }}><X className="w-4 h-4" style={{ color: 'var(--text-dim)' }} /></button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 mx-auto mb-3" style={{ color: 'var(--text-dim)' }} />
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Drop PDF here or tap to browse</p>
                      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>PDF only · Max 10MB · Must be unlocked (no password)</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-xl p-3 text-sm flex items-center gap-2" style={{ background: 'color-mix(in srgb, #ef4444 10%, transparent)', color: '#ef4444', border: '1px solid color-mix(in srgb, #ef4444 25%, transparent)' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <button onClick={handleParse} disabled={!file || loading}
                className="btn-primary w-full text-base flex items-center justify-center gap-2"
                style={{ opacity: !file || loading ? 0.6 : 1 }}>
                <Zap className="w-5 h-5" />
                {loading ? 'Reading your statement...' : 'Extract my points'}
              </button>

              <div className="rounded-xl p-4 border flex items-start gap-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--emerald)' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text)' }}>Your data is private.</strong> PDF is processed and immediately discarded. Only points balance is saved. Never stored or shared.
                </p>
              </div>
            </div>
          )}

          {/* Password protected — show unlock flow */}
          {needsPassword && !result && (
            <div className="space-y-4">
              <div className="rounded-2xl border p-6" style={{ borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                    <Lock className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl mb-1" style={{ color: 'var(--text)' }}>PDF is password protected</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All Indian bank statements are password protected. Remove the password first, then re-upload.</p>
                  </div>
                </div>

                {/* Password format info */}
                <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
                    {selectedBank?.name || 'Your bank'} password format
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{pwdHint || selectedBank?.pwdHint}</p>
                </div>

                {/* Step by step */}
                <div className="space-y-3">
                  <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>How to remove password (30 seconds)</div>
                  {[
                    { n: '1', text: 'Open your statement PDF and note the password (format above)' },
                    { n: '2', text: 'Go to ilovepdf.com/unlock_pdf — free, no account needed' },
                    { n: '3', text: 'Upload your PDF, enter the password, click Unlock' },
                    { n: '4', text: 'Download the unlocked PDF and upload it here' },
                  ].map(s => (
                    <div key={s.n} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--accent)', color: 'white' }}>{s.n}</div>
                      {s.text}
                    </div>
                  ))}
                </div>

                <a href="https://www.ilovepdf.com/unlock_pdf" target="_blank" rel="noopener noreferrer"
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-sm">
                  Open ilovepdf.com/unlock_pdf <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <button onClick={() => { setNeedsPassword(false); setFile(null); }}
                className="btn-ghost w-full text-sm">
                ← Upload a different file
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="rounded-2xl p-6 border" style={{ borderColor: 'color-mix(in srgb, var(--emerald) 30%, transparent)', background: 'color-mix(in srgb, var(--emerald) 6%, transparent)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <CheckCircle className="w-6 h-6" style={{ color: 'var(--emerald)' }} />
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text)' }}>{result.customer_name ? `${result.customer_name}'s ` : ''}{result.bank || selectedBank?.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{result.card_name}{result.card_last4 ? ` · ••••${result.card_last4}` : ''} · {result.confidence} confidence</div>
                  </div>
                </div>
                {result.points_balance != null && (
                  <div className="p-4 rounded-xl mb-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>{result.points_currency || 'Points'} balance</div>
                    <div className="font-display text-4xl tabular" style={{ color: 'var(--accent)' }}>{result.points_balance.toLocaleString('en-IN')}</div>
                    {result.points_expiry && <div className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Expires: {result.points_expiry}</div>}
                  </div>
                )}
                {result.points_earned_this_month != null && (
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Earned this month</div>
                    <div className="font-display text-xl" style={{ color: 'var(--text)' }}>+{result.points_earned_this_month.toLocaleString('en-IN')}</div>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => { setResult(null); setFile(null); }} className="btn-ghost flex-1 text-sm">Upload another</button>
                <Link href={`/optimize?bank=${result.bank}&points=${result.points_balance}`} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" /> Optimize these points
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
