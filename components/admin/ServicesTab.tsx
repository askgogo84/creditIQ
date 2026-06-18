'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

// Scraper sources: liveness comes from intelligence_kb freshness, NOT cron_logs (which is unreliable).
const SOURCES = [
  { key: 'instagram', label: 'Instagram', expectHrs: 26 },
  { key: 'reddit',    label: 'Reddit',    expectHrs: 28 },
  { key: 'youtube',   label: 'YouTube',   expectHrs: 30 },
];

interface ServiceRow {
  id: string; name: string; category: string; check_type: string;
  status: string; detail: any; renews_on: string | null;
  notes: string | null; last_checked: string | null; updated_at: string | null;
}

const C = {
  green: '#2d7a56', amber: '#8C5F12', red: '#B84230',
  ink: 'var(--ink,#142950)', ink3: 'var(--ink-3,#5A6A8A)',
  paper: 'var(--paper,#FAF5EB)', surface: 'var(--surface,#fff)', line: 'var(--line,rgba(20,41,80,0.08))',
};

function relTime(iso: string | null): string {
  if (!iso) return 'never';
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 48) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function ServicesTab() {
  const [freshness, setFreshness] = useState<Record<string, { count: number; newest: string | null }>>({});
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [probeMsg, setProbeMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const sKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!sUrl || !sKey) { setLoading(false); return; }
      const { createBrowserClient } = await import('@supabase/ssr');
      const sb = createBrowserClient(sUrl, sKey);

      // Per-source pipeline freshness from intelligence_kb
      const fr: Record<string, { count: number; newest: string | null }> = {};
      for (const s of SOURCES) {
        const { data, count } = await sb
          .from('intelligence_kb')
          .select('scraped_at', { count: 'exact' })
          .eq('source', s.key)
          .order('scraped_at', { ascending: false })
          .limit(1);
        fr[s.key] = { count: count ?? 0, newest: data?.[0]?.scraped_at ?? null };
      }
      setFreshness(fr);

      const { data: svc } = await sb
        .from('service_monitors')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      setServices((svc as ServiceRow[]) || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runChecks = async () => {
    setProbeMsg('Running liveness checks...');
    try {
      const res = await fetch('/api/admin/check-services');
      const data = await res.json();
      setProbeMsg(data.message || `Checked ${data.checked ?? 0} services`);
      setTimeout(load, 1500);
    } catch (e: any) { setProbeMsg('Error: ' + e.message); }
  };

  const freshColor = (expectHrs: number, newest: string | null) => {
    if (!newest) return C.red;
    const h = (Date.now() - new Date(newest).getTime()) / 3600000;
    if (h <= expectHrs) return C.green;
    if (h <= expectHrs * 3) return C.amber;
    return C.red;
  };

  const statusColor = (s: string) => {
    const v = (s || '').toLowerCase();
    if (['up', 'ok', 'healthy', 'active', 'configured'].includes(v)) return C.green;
    if (['warn', 'warning', 'degraded', 'unknown', 'manual'].includes(v)) return C.amber;
    if (['down', 'error', 'paused', 'expired', 'missing'].includes(v)) return C.red;
    return C.ink3;
  };

  const renewDays = (d: string | null) => (d == null ? null : Math.round((new Date(d).getTime() - Date.now()) / 86400000));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* SCRAPER PIPELINE — live freshness */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink3, marginBottom: 12 }}>
          Scraper pipeline · live freshness (from intelligence_kb)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
          {SOURCES.map(s => {
            const f = freshness[s.key];
            const color = freshColor(s.expectHrs, f?.newest ?? null);
            const stale = color === C.red;
            return (
              <div key={s.key} style={{ background: C.surface, border: `1px solid ${color}40`, borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{s.label}</span>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: color, flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{relTime(f?.newest ?? null)}</div>
                <div style={{ fontSize: 11, color: C.ink3, marginTop: 4 }}>{f?.count ?? 0} rows{stale ? ' · STALE' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VENDORS & INFRASTRUCTURE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink3 }}>
            Vendors &amp; infrastructure
          </div>
          <button onClick={runChecks} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--ink,#142950)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Run checks
          </button>
        </div>
        {probeMsg && (
          <div style={{ padding: '10px 14px', background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, fontFamily: 'var(--font-mono,monospace)', fontSize: 12, color: C.ink3, marginBottom: 12 }}>{probeMsg}</div>
        )}
        {services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16 }}>
            <AlertTriangle style={{ width: 28, height: 28, color: C.amber, margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>No services tracked yet</div>
            <div style={{ fontSize: 12, color: C.ink3, marginTop: 4 }}>Hit "Run checks" to probe and populate the table.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {services.map(s => {
              const days = renewDays(s.renews_on);
              return (
                <div key={s.id} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: statusColor(s.status), flexShrink: 0 }} />
                  <div style={{ minWidth: 150 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{s.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: C.ink3, textTransform: 'uppercase' }}>{s.category} · {s.check_type}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: statusColor(s.status), textTransform: 'uppercase', minWidth: 76 }}>{s.status || 'unknown'}</div>
                  <div style={{ fontSize: 11, color: C.ink3 }}>checked {relTime(s.last_checked)}</div>
                  {s.renews_on && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: days != null && days <= 14 ? C.red : C.ink3, marginLeft: 'auto' }}>
                      renews {new Date(s.renews_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{days != null ? ` (${days}d)` : ''}
                    </div>
                  )}
                  {s.notes && <div style={{ fontSize: 11, color: C.ink3, width: '100%' }}>{s.notes}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
