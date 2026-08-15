// components/ciq/CardRow.tsx
'use client';

import { useState } from 'react';

/**
 * A single held card row (bank monogram · name · verified/self-entered badge · points).
 *
 * `variant` (wallet migration): 'light' = white/copper light system (the migrated
 * wallet). 'gold' (default) = the retired [data-ciq] gold tokens/classes, kept
 * UNCHANGED so my-cards (still a gold [data-ciq] surface) renders pixel-identical.
 * When my-cards migrates, flip callers to 'light' and delete the gold branch
 * (see docs/wallet/06-Implementation-Plan Follow-on task).
 */
export function CardRow({
  bank, cardName, last4, points, currency, source, monogram, onClick, variant = 'gold',
  selfEntered, onSavePoints, onDelete,
}: {
  bank: string; cardName: string; last4?: string; points: number;
  currency?: string; source: 'statement' | 'manual'; monogram?: string;
  onClick?: () => void; variant?: 'light' | 'gold';
  selfEntered?: boolean; onSavePoints?: (points: number) => Promise<boolean>; onDelete?: () => void;
}) {
  const verified = source === 'statement' && !selfEntered;
  const mono = monogram || bank.slice(0, 2).toUpperCase();
  const light = variant === 'light';

  // Inline points editor — rendered ONLY when a parent passes onSavePoints (the
  // dashboard does; read-only surfaces like my-cards do not). Save in place, no modal.
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(false);
  const beginEdit = () => { setVal(String(points)); setErr(false); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setErr(false); };
  const saveEdit = async () => {
    const n = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(n) || n < 0) { setErr(true); return; }
    setSaving(true); setErr(false);
    const ok = onSavePoints ? await onSavePoints(n) : false;
    setSaving(false);
    if (ok) setEditing(false); else setErr(true);
  };

  // token set per variant — 'gold' reproduces the pre-migration values exactly.
  const t = light
    ? {
        panel: 'var(--surface)', line: 'var(--line)', ink: 'var(--ink)', ink2: 'var(--ink-2)', ink3: 'var(--ink-3)',
        monoInk: 'var(--copper)', monoBg: 'color-mix(in srgb,var(--copper-3) 9%, var(--surface))',
        monoLine: 'color-mix(in srgb,var(--copper-3) 28%, transparent)',
        verified: 'var(--prov-verified)', verifiedBg: 'color-mix(in srgb,var(--prov-verified) 13%,transparent)',
        displayCls: 'w-display', monoCls: 'mono',
      }
    : {
        panel: 'var(--ciq-panel)', line: 'var(--ciq-line)', ink: 'var(--ciq-ink)', ink2: 'var(--ciq-ink-2)', ink3: 'var(--ciq-ink-3)',
        monoInk: 'var(--ciq-gold-2)', monoBg: 'var(--ciq-card-metal)',
        monoLine: 'var(--ciq-gold-line)',
        verified: 'var(--ciq-verified)', verifiedBg: 'color-mix(in srgb,var(--ciq-verified) 13%,transparent)',
        displayCls: 'ciq-display', monoCls: 'ciq-mono',
      };

  return (
    <div onClick={onClick} style={{
      borderRadius: 18, padding: '15px 16px', background: t.panel,
      border: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', gap: 13,
      transition: 'transform .18s cubic-bezier(.34,1.56,.64,1)', cursor: onClick ? 'pointer' : 'default',
    }}
    onMouseDown={e => (e.currentTarget.style.transform = 'scale(.98)')}
    onMouseUp={e => (e.currentTarget.style.transform = 'none')}
    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flex: '0 0 auto', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: t.monoInk,
        fontWeight: 700, fontSize: 12, background: t.monoBg, border: `1px solid ${t.monoLine}`,
      }}>{mono}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: '-.01em', color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cardName}
        </div>
        <div className={t.monoCls} style={{ fontSize: 10, color: t.ink3, marginTop: 3, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            fontSize: 8.5, fontWeight: 700, letterSpacing: '.04em', padding: '2px 6px', borderRadius: 5,
            color: verified ? t.verified : t.ink2,
            background: verified ? t.verifiedBg : t.line,
          }}>{verified ? 'Verified' : 'Self-entered'}</span>
          {last4 ? `·${last4}` : ''} {source === 'statement' ? '/ statement' : '/ manual'}
        </div>
      </div>

      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8 }}
           onClick={editing ? (e) => e.stopPropagation() : undefined}>
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              autoFocus
              inputMode="numeric"
              value={val}
              disabled={saving}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
              aria-label="Points balance"
              style={{
                width: 94, textAlign: 'right', fontSize: 16, fontWeight: 600, padding: '5px 8px', borderRadius: 8,
                border: `1px solid ${err ? 'var(--red, #E8806E)' : t.line}`, background: t.panel, color: t.ink, outline: 'none',
              }}
            />
            <button type="button" onClick={saveEdit} disabled={saving} aria-label="Save points"
              style={{ border: 'none', borderRadius: 8, padding: '6px 9px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                       background: t.monoInk, color: t.panel, opacity: saving ? 0.6 : 1 }}>
              {saving ? '…' : '✓'}
            </button>
            <button type="button" onClick={cancelEdit} disabled={saving} aria-label="Cancel edit"
              style={{ border: `1px solid ${t.line}`, borderRadius: 8, padding: '6px 9px', fontSize: 13, cursor: 'pointer',
                       background: 'transparent', color: t.ink3 }}>
              ✕
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'right' }}>
              <div className={t.displayCls} style={{ fontWeight: 600, fontSize: 18, color: t.ink }}>{points.toLocaleString('en-IN')}</div>
              <div className={t.monoCls} style={{ fontSize: 9, color: t.ink3, marginTop: 1 }}>{currency || 'Reward Pts'}</div>
            </div>
            {(onSavePoints || onDelete) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: '0 0 auto' }}>
                {onSavePoints && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); beginEdit(); }} aria-label="Edit points"
                    style={{ border: 'none', background: 'transparent', padding: 4, cursor: 'pointer', lineHeight: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="m14.5 5.5 4 4M4 20l1-4L16 5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" stroke={t.ink3} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label="Delete card"
                    style={{ border: 'none', background: 'transparent', padding: 4, cursor: 'pointer', lineHeight: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 8l1 12a1 1 0 0 0 1 .92h8a1 1 0 0 0 1-.92l1-12" stroke={t.ink3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
