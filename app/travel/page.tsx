'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;color:var(--ink,#142950);margin:14px 0 4px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:700;color:var(--ink,#142950);margin:16px 0 6px;padding-bottom:4px;border-bottom:1px solid var(--line,rgba(20,41,80,0.08))">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:800;color:var(--ink,#142950);margin:0 0 12px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:var(--ink,#142950)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic">$1</em>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:5px 0;align-items:flex-start"><span style="color:var(--copper-3,#D89B2A);font-weight:900;font-size:14px;line-height:1.5;flex-shrink:0">→</span><span style="line-height:1.65;color:var(--ink-2,#2A3F6B)">$1</span></div>')
    .replace(/\n{2,}/g, '<div style="height:8px"></div>')
    .replace(/\n/g, ' ');
}

const SUGGESTIONS = [
  'Best way to use 52,000 HDFC points for Singapore?',
  'Axis Magnus lounge access — how many visits per year?',
  'Which card gives best forex rates for international travel?',
  'Transfer HDFC points to KrisFlyer or Avios — which is better?',
];

function TravelPageInner() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSent, setAutoSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-send ?q= param from CIRA handoff
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !autoSent && !loading) {
      setAutoSent(true);
      send(decodeURIComponent(q));
    }
  }, [searchParams, autoSent]);

  const send = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput('');
    const updated: Message[] = [...messages, { role: 'user', content: query }];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await fetch('/api/travel-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      if (!res.ok) throw new Error('api error');
      const data = await res.json();
      const reply =
        data?.reply ?? data?.message ?? data?.content?.[0]?.text ??
        (typeof data === 'string' ? data : null);
      if (!reply) throw new Error('no reply');
      setMessages([...updated, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Sorry, I could not connect right now. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const empty = messages.length === 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg,#F5EFE6)', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Aurora background */}
      <div className="aurora" style={{ position: 'fixed', top: -80, right: -120, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 720, width: '100%', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)', paddingTop: 'clamp(80px,12vw,100px)', paddingBottom: 120, position: 'relative', zIndex: 1 }}>

        {/* Hero — only when empty */}
        {empty && (
          <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 18px', borderRadius: 999, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.28)', marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--copper,#8C5F12)', textTransform: 'uppercase', fontWeight: 700 }}>
                Travel AI &bull; Powered by Claude
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 14px', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              Your AI{' '}
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>travel advisor</span>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--ink-2,#2A3F6B)', margin: '0 0 32px', lineHeight: 1.7, maxWidth: 460, marginInline: 'auto' }}>
              Ask anything about flights, hotels, lounge access, points transfers, and award redemptions.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="grid-1-mobile">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  padding: '13px 16px', background: 'var(--surface,#fff)',
                  border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 14,
                  fontSize: 13, color: 'var(--ink-2,#2A3F6B)', cursor: 'pointer',
                  textAlign: 'left', lineHeight: 1.5, fontWeight: 500,
                  boxShadow: '0 1px 3px rgba(20,41,80,0.06)',
                  transition: 'box-shadow 0.15s',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 10, marginBottom: 16, alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                backgroundColor: msg.role === 'user' ? 'var(--copper-3,#D89B2A)' : 'var(--ink,#142950)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#fff',
                fontFamily: 'var(--font-mono,monospace)',
              }}>
                {msg.role === 'user' ? 'G' : '✈'}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '82%',
                backgroundColor: msg.role === 'user' ? 'var(--ink,#142950)' : 'var(--surface,#fff)',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                padding: '13px 18px',
                fontSize: 14,
                lineHeight: 1.75,
                border: msg.role === 'assistant' ? '1px solid var(--line,rgba(20,41,80,0.08))' : 'none',
                boxShadow: msg.role === 'assistant' ? '0 1px 4px rgba(20,41,80,0.06)' : 'none',
                color: msg.role === 'user' ? 'rgba(255,255,255,0.90)' : 'var(--ink-2,#2A3F6B)',
              }}>
                {msg.role === 'assistant'
                  ? <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                  : msg.content
                }
              </div>
            </div>
          ))}

          {/* Typing dots */}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--ink,#142950)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'var(--copper-3,#D89B2A)', fontSize: 14 }}>✈</span>
              </div>
              <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: '4px 16px 16px 16px', padding: '14px 18px', display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--copper-3,#D89B2A)', animation: `dot-bounce 1.2s ${j * 0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Fixed input bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: 'var(--bg,#F5EFE6)',
        borderTop: '1px solid var(--line,rgba(20,41,80,0.08))',
        padding: '12px 16px 18px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about flights, hotels, lounge access..."
            style={{
              flex: 1, padding: '12px 18px', borderRadius: 14,
              border: '1.5px solid var(--line,rgba(20,41,80,0.12))',
              fontSize: 14, color: 'var(--ink,#142950)',
              backgroundColor: 'var(--surface,#fff)',
              outline: 'none',
              boxShadow: '0 1px 4px rgba(20,41,80,0.06)',
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: 46, height: 46, borderRadius: 12, border: 'none',
              backgroundColor: input.trim() && !loading ? 'var(--copper-3,#D89B2A)' : 'var(--line,rgba(20,41,80,0.10))',
              color: '#fff', fontSize: 18, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)', margin: '6px 0 0', letterSpacing: '0.05em' }}>
          AI advice only &nbsp;&bull;&nbsp; Verify prices before booking
        </p>
      </div>

      <style>{`
        @keyframes dot-bounce {
          0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-5px); }
        }
        @media (max-width: 640px) {
          .grid-1-mobile { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function TravelPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg,#F5EFE6)' }} />}>
      <TravelPageInner />
    </Suspense>
  );
}
