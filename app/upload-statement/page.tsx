'use client';

import { useState, useRef, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { authedFetch } from '@/lib/authed-fetch';
import { CiqTheme } from '@/components/ciq/ThemeProvider';
import { TabBar } from '@/components/ciq/TabBar';
import { Upload, FileText, CheckCircle, AlertCircle, Zap, ArrowRight, Lock, X, ExternalLink, LogIn, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// App-shell page: matches /dashboard (CiqTheme + TabBar). No marketing Header/Footer,
// no .btn-primary/.btn-ghost classes (globals.css double-definition fights inline styles).
// All parse/save logic identical to previous version.

const GOLD_BTN: React.CSSProperties = {
  background: 'linear-gradient(180deg, #E4C169, #C9A24B)',
  color: '#141105',
  fontWeight: 600,
  border: 'none',
  borderRadius: 14,
  padding: '13px 18px',
  cursor: 'pointer',
};

const GHOST_BTN: React.CSSProperties = {
  background: 'var(--ciq-line)',
  color: 'var(--ciq-ink-2)',
  fontWeight: 500,
  border: '1px solid var(--ciq-line-2)',
  borderRadius: 14,
  padding: '12px 16px',
  cursor: 'pointer',
};

const BANKS = [
  { id: 'HDFC',  name: 'HDFC Bank',        color: '#004C8F', pwdHint: 'First 4 letters of name + DOB DDMM -> e.g. GOVE0305' },
  { id: 'Axis',  name: 'Axis Bank',         color: '#97144D', pwdHint: 'PAN card number -> e.g. ABCDE1234F' },
  { id: 'AmEx',  name: 'American Express',  color: '#006FCF', pwdHint: 'Date of birth DDMMYYYY -> e.g. 03051985' },
  { id: 'ICICI', name: 'ICICI Bank',        color: '#F58220', pwdHint: 'Date of birth DDMMYYYY -> e.g. 03051985' },
  { id: 'SBI',   name: 'SBI Card',          color: '#2C4C9C', pwdHint: 'Date of birth DDMMYYYY -> e.g. 03051985' },
  { id: 'Kotak', name: 'Kotak Bank',        color: '#EF3E23', pwdHint: 'Date of birth DDMMYYYY -> e.g. 03051985' },
  { id: 'IDFC',  name: 'IDFC FIRST Bank',   color: '#9B0C2C', pwdHint: 'Registered mobile number' },
  { id: 'Yes',   name: 'YES Bank',          color: '#0C2461', pwdHint: 'Date of birth DDMMYYYY -> e.g. 03051985' },
  { id: 'RBL',   name: 'RBL Bank',          color: '#1D4ED8', pwdHint: 'Date of birth DDMMYYYY -> e.g. 03051985' },
  { id: 'IndusInd', name: 'IndusInd Bank',  color: '#312E81', pwdHint: 'Date of birth DDMMYYYY -> e.g. 03051985' },
  { id: 'SC',    name: 'Standard Chartered',color: '#0473EA', pwdHint: 'Date of birth DDMMYYYY -> e.g. 03051985' },
  { id: 'AU',    name: 'AU Small Finance',  color: '#7C2D12', pwdHint: 'Date of birth DDMMYYYY -> e.g. 03051985' },
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
  const [userId, setUserId] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [manualPoints, setManualPoints] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    sb.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        authedFetch('/api/user-cards')
          .then(r => r.json())
          .then(d => setSavedCount(d.cards?.length || 0));
      }
    });
  }, []);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) { setError('File too large -- max 10MB'); return; }
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
      if (userId) formData.append('userId', userId);

      const res = await fetch('/api/parse-statement', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.needsPassword) {
        setNeedsPassword(true);
        setPwdHint(data.hint || selectedBank?.pwdHint || '');
      } else if (!res.ok || data.error) {
        setError(data.error || 'Failed to parse statement');
      } else {
        setResult(data.data);
        if (userId) setSavedCount(c => c + 1);
      }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleSaveManualPoints = async () => {
    const val = parseInt(manualPoints || '0');
    if (!val || val <= 0) return;
    if (userId) {
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      await sb.from('statement_imports').upsert({
        user_id: userId,
        bank: result?.bank || selectedBank?.id,
        card_name: result?.card_name,
        card_last4: result?.card_last4,
        points_balance: val,
        points_currency: result?.points_currency || 'Reward Points',
        confidence: 'manual',
        imported_at: new Date().toISOString(),
      });
      setSavedCount(c => c + 1);
    }
    setResult({ ...result, points_balance: val });
    setManualPoints('');
  };

  const resetForAnother = () => {
    setResult(null); setFile(null);
    setNeedsPassword(false); setError('');
    setSelectedBank(null); setManualPoints('');
  };

  return (
    <CiqTheme>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingBottom: 104, position: 'relative' }}>

        {/* masthead */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 8px' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ciq-ink-2)', textDecoration: 'none' }}>
            <ArrowLeft size={15} /> Wallet
          </Link>
          <div className="ciq-display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-.02em' }}>
            Credit<span style={{ color: 'var(--ciq-gold-2)' }}>IQ</span>
          </div>
        </div>

        <div style={{ padding: '10px 20px 0' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, letterSpacing: '.06em',
            textTransform: 'uppercase', color: 'var(--ciq-gold-2)',
            background: 'color-mix(in srgb, var(--ciq-gold-2) 9%, transparent)',
            border: '1px solid var(--ciq-gold-line)', padding: '5px 10px', borderRadius: 999,
            fontFamily: "'Space Mono',monospace",
          }}>
            <Zap size={11} /> AI reads your points in 3 seconds
          </div>

          <h1 className="ciq-display" style={{ fontWeight: 600, fontSize: 28, letterSpacing: '-.02em', marginTop: 12, lineHeight: 1.05 }}>
            Upload your <span style={{ color: 'var(--ciq-gold-2)' }}>statement</span>
          </h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ciq-ink-2)', marginTop: 8 }}>
            Download your monthly PDF from your bank app. Upload here. Points saved to your account -- never upload again.
          </p>
        </div>

        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {!userId && (
            <div style={{
              borderRadius: 16, padding: '13px 15px', display: 'flex', gap: 10, alignItems: 'flex-start',
              background: 'color-mix(in srgb, var(--ciq-gold-2) 7%, transparent)',
              border: '1px solid var(--ciq-gold-line)',
            }}>
              <LogIn size={15} style={{ color: 'var(--ciq-gold-2)', marginTop: 1, flex: '0 0 auto' }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Sign in to save your points</p>
                <p style={{ fontSize: 12, color: 'var(--ciq-ink-2)', marginTop: 2 }}>You can upload without signing in but points won&apos;t be saved to your dashboard.</p>
                <Link href="/login" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ciq-gold-2)', textDecoration: 'none' }}>Sign in with Google &rarr;</Link>
              </div>
            </div>
          )}

          {userId && savedCount > 0 && !result && (
            <div style={{
              borderRadius: 16, padding: '11px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'color-mix(in srgb, var(--ciq-verified) 7%, transparent)',
              border: '1px solid color-mix(in srgb, var(--ciq-verified) 18%, transparent)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={15} style={{ color: 'var(--ciq-verified)' }} />
                <span style={{ fontSize: 12.5 }}>{savedCount} card{savedCount !== 1 ? 's' : ''} already saved</span>
              </div>
              <Link href="/dashboard" style={{ fontSize: 12, color: 'var(--ciq-gold-2)', textDecoration: 'none' }}>View wallet &rarr;</Link>
            </div>
          )}

          {!result && !needsPassword && (
            <>
              <div>
                <div className="ciq-mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ciq-ink-3)', marginBottom: 10 }}>
                  1. Select your bank
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {BANKS.map(bank => (
                    <button key={bank.id} onClick={() => setSelectedBank(bank)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9, padding: 11, textAlign: 'left',
                        borderRadius: 14, cursor: 'pointer',
                        border: `1px solid ${selectedBank?.id === bank.id ? bank.color : 'var(--ciq-line-2)'}`,
                        background: selectedBank?.id === bank.id ? `${bank.color}26` : 'var(--ciq-line)',
                        color: 'inherit',
                      }}>
                      <span style={{
                        width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: bank.color, color: '#fff', fontSize: 10, fontWeight: 700, flex: '0 0 auto',
                      }}>{bank.id.slice(0, 2)}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="ciq-mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ciq-ink-3)', marginBottom: 10 }}>
                  2. Upload PDF statement (unlocked)
                </div>
                <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    borderRadius: 18, padding: 28, textAlign: 'center', cursor: 'pointer',
                    border: `1.5px dashed ${dragging ? 'var(--ciq-gold-2)' : file ? 'var(--ciq-verified)' : 'var(--ciq-line-2)'}`,
                    background: 'var(--ciq-line)',
                  }}>
                  <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <FileText size={18} style={{ color: 'var(--ciq-verified)', flex: '0 0 auto' }} />
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ciq-ink-3)' }}>{(file.size / 1024).toFixed(0)} KB</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <X size={15} style={{ color: 'var(--ciq-ink-3)' }} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={20} style={{ color: 'var(--ciq-ink-3)', margin: '0 auto 10px' }} />
                      <p style={{ fontSize: 13, fontWeight: 600 }}>Drop PDF here or tap to browse</p>
                      <p style={{ fontSize: 11.5, color: 'var(--ciq-ink-3)', marginTop: 3 }}>Must be unlocked (password removed) . Max 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div style={{
                  borderRadius: 14, padding: '11px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8,
                  background: 'color-mix(in srgb, #ef4444 10%, transparent)',
                  border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)', color: '#ef8a80',
                }}>
                  <AlertCircle size={15} style={{ flex: '0 0 auto' }} /> {error}
                </div>
              )}

              <button onClick={handleParse} disabled={!file || loading}
                style={{ ...GOLD_BTN, width: '100%', fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !file || loading ? 0.55 : 1 }}>
                <Zap size={17} />
                {loading ? 'Reading your statement...' : 'Extract my points'}
              </button>

              <div style={{
                borderRadius: 16, padding: '13px 15px', display: 'flex', gap: 10, alignItems: 'flex-start',
                background: 'var(--ciq-line)', border: '1px solid var(--ciq-line-2)',
              }}>
                <Lock size={15} style={{ color: 'var(--ciq-verified)', marginTop: 1, flex: '0 0 auto' }} />
                <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ciq-ink-2)' }}>
                  <b style={{ color: 'var(--ciq-verified)' }}>Your data is private.</b> PDF is processed and immediately discarded. Only points balance is saved to your account.
                </p>
              </div>
            </>
          )}

          {needsPassword && !result && (
            <>
              <div style={{
                borderRadius: 18, padding: 20,
                background: 'color-mix(in srgb, var(--ciq-gold-2) 6%, transparent)',
                border: '1px solid var(--ciq-gold-line)',
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
                    background: 'color-mix(in srgb, var(--ciq-gold-2) 14%, transparent)',
                  }}>
                    <Lock size={17} style={{ color: 'var(--ciq-gold-2)' }} />
                  </div>
                  <div>
                    <h3 className="ciq-display" style={{ fontSize: 17, fontWeight: 600 }}>PDF is password protected</h3>
                    <p style={{ fontSize: 12.5, color: 'var(--ciq-ink-2)', marginTop: 2 }}>Remove the password first using ilovepdf -- takes 30 seconds.</p>
                  </div>
                </div>
                <div style={{ borderRadius: 14, padding: 14, marginBottom: 14, background: 'var(--ciq-line)', border: '1px solid var(--ciq-line-2)' }}>
                  <div className="ciq-mono" style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ciq-ink-3)', marginBottom: 4 }}>
                    {selectedBank?.name || 'Your bank'} password format
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{pwdHint || selectedBank?.pwdHint}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {[
                    'Open your statement PDF and note the password (format above)',
                    'Go to ilovepdf.com/unlock_pdf -- free, no account needed',
                    'Upload your PDF, enter the password, click Unlock PDF',
                    'Download the unlocked PDF and upload it here',
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--ciq-ink-2)' }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, flex: '0 0 auto', marginTop: 1,
                        background: 'var(--ciq-gold-2)', color: '#141105',
                      }}>{i + 1}</span>
                      {s}
                    </div>
                  ))}
                </div>
                <a href="https://www.ilovepdf.com/unlock_pdf" target="_blank" rel="noopener noreferrer"
                  style={{ ...GOLD_BTN, width: '100%', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', boxSizing: 'border-box' }}>
                  Open ilovepdf.com/unlock_pdf <ExternalLink size={15} />
                </a>
              </div>
              <button onClick={() => { setNeedsPassword(false); setFile(null); }} style={{ ...GHOST_BTN, width: '100%', fontSize: 13 }}>
                &larr; Upload a different file
              </button>
            </>
          )}

          {result && (
            <>
              <div style={{
                borderRadius: 18, padding: 20,
                background: 'color-mix(in srgb, var(--ciq-verified) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--ciq-verified) 22%, transparent)',
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <CheckCircle size={22} style={{ color: 'var(--ciq-verified)', flex: '0 0 auto' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {result.customer_name ? `${result.customer_name}'s ` : ''}{result.bank || selectedBank?.name}
                      {userId && (
                        <span style={{
                          fontSize: 10.5, marginLeft: 8, padding: '2px 8px', borderRadius: 999,
                          background: 'color-mix(in srgb, var(--ciq-verified) 14%, transparent)', color: 'var(--ciq-verified)',
                        }}>Saved</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ciq-ink-3)', marginTop: 2 }}>
                      {result.card_name}{result.card_last4 ? ` . ${result.card_last4}` : ''} . {result.confidence} confidence
                    </div>
                  </div>
                </div>

                {result.points_balance != null ? (
                  <div style={{ borderRadius: 14, padding: 14, background: 'var(--ciq-line)', border: '1px solid var(--ciq-line-2)' }}>
                    <div className="ciq-mono" style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ciq-ink-3)', marginBottom: 4 }}>
                      {result.points_currency || 'Reward Points'} balance
                    </div>
                    <div className="ciq-display" style={{ fontSize: 34, fontWeight: 600, color: 'var(--ciq-gold-2)', fontVariantNumeric: 'tabular-nums' }}>
                      {result.points_balance.toLocaleString('en-IN')}
                    </div>
                    {result.points_expiry && <div style={{ fontSize: 11.5, color: 'var(--ciq-ink-3)', marginTop: 3 }}>Expires: {result.points_expiry}</div>}
                  </div>
                ) : (
                  <div style={{
                    borderRadius: 14, padding: 14,
                    background: 'color-mix(in srgb, var(--ciq-gold-2) 6%, transparent)',
                    border: '1px solid var(--ciq-gold-line)',
                  }}>
                    <div className="ciq-mono" style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ciq-ink-3)', marginBottom: 6 }}>
                      Points not found &mdash; enter manually
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ciq-ink-2)', marginBottom: 10 }}>
                      Check your bank app or net banking for your current {result.points_currency || 'reward points'} balance.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        placeholder="e.g. 12500"
                        value={manualPoints}
                        onChange={e => setManualPoints(e.target.value)}
                        style={{
                          flex: 1, padding: '10px 12px', borderRadius: 12, fontSize: 13,
                          background: 'var(--ciq-line)', border: '1px solid var(--ciq-line-2)', color: 'inherit', outline: 'none',
                        }}
                      />
                      <button
                        onClick={handleSaveManualPoints}
                        disabled={!manualPoints || parseInt(manualPoints) <= 0}
                        style={{ ...GOLD_BTN, fontSize: 13, padding: '10px 16px', opacity: !manualPoints || parseInt(manualPoints) <= 0 ? 0.5 : 1 }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                <button onClick={resetForAnother} style={{ ...GHOST_BTN, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Upload size={15} /> Add another card
                </button>
                <Link href="/dashboard" style={{ ...GHOST_BTN, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', boxSizing: 'border-box' }}>
                  View wallet <ArrowRight size={15} />
                </Link>
                <Link href={`/optimize?bank=${result.bank}&points=${result.points_balance}`}
                  style={{ ...GOLD_BTN, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', boxSizing: 'border-box' }}>
                  <Zap size={15} /> Optimize points
                </Link>
              </div>

              {!userId && (
                <div style={{
                  borderRadius: 16, padding: 15, textAlign: 'center',
                  background: 'color-mix(in srgb, var(--ciq-gold-2) 6%, transparent)',
                  border: '1px solid var(--ciq-gold-line)',
                }}>
                  <p style={{ fontSize: 13, marginBottom: 10 }}>Sign in to save these points to your dashboard</p>
                  <Link href="/login" style={{ ...GOLD_BTN, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', boxSizing: 'border-box' }}>
                    <LogIn size={15} /> Sign in with Google
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <TabBar />
    </CiqTheme>
  );
}
