'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { authedFetch } from '@/lib/authed-fetch';
import { PageHeader } from '@/components/ciq/PageHeader';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function parseMarkdown(text: string): string {
  // SECURITY: this string is injected via dangerouslySetInnerHTML, and the model reply
  // is influenced by third-party content pulled into the system prompt (Instagram-scraped
  // igInsights + Seats.aero award data via the RAG context in /api/travel-ai), so treat
  // it as untrusted. Escape HTML FIRST so any raw tags in the reply (e.g.
  // <img src=x onerror=...>) render as inert text; every tag emitted below is our own
  // trusted template markup applied to the already-escaped text.
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;color:var(--ink,#142950);margin:14px 0 4px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:700;color:var(--ink,#142950);margin:16px 0 6px;padding-bottom:4px;border-bottom:1px solid var(--line,rgba(20,41,80,0.08))">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:800;color:var(--ink,#142950);margin:0 0 12px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:var(--ink,#142950)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic">$1</em>')
    // Links: ONLY http/https become live anchors. Any other scheme (javascript:, data:,
    // vbscript:, etc.) is left as its literal [label](url) source — i.e. inert text, not
    // a live link. The url can't contain " or < > (escaped above), so it can't break out
    // of the href attribute or inject an event handler.
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) =>
      /^https?:\/\//i.test(url)
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow" style="color:var(--copper-3,#D89B2A);text-decoration:underline">${label}</a>`
        : m)
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:5px 0;align-items:flex-start"><span style="color:var(--copper-3,#D89B2A);font-weight:900;font-size:14px;line-height:1.5;flex-shrink:0">&rarr;</span><span style="line-height:1.65;color:var(--ink-2,#2A3F6B)">$1</span></div>')
    .replace(/\n{2,}/g, '<div style="height:8px"></div>')
    .replace(/\n/g, ' ');
}

const SUGGESTIONS = [
  'Best way to use 52,000 HDFC points for Singapore?',
  'Axis Magnus lounge access \u2014 how many visits per year?',
  'Which card gives best forex rates for international travel?',
  'Transfer HDFC points to KrisFlyer or Avios \u2014 which is better?',
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
      const res = await authedFetch('/api/travel-ai', {
        method: 'POST',
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
    <div className="ciq-product-page" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Section name + SectionTabs live in the (travelgrp) layout above this panel;
          this panel owns the display headline + subtitle (eyebrow dropped as redundant
          with the section name). The chat FILLS the remaining height under the header —
          the layout is a 100dvh flex column and this column's flex:1 fills it (100dvh on
          the page itself would overflow past the header). It keeps its own 720 reading
          measure, left-aligned (no margin:0 auto); gutters come from the layout. */}
      <PageHeader
        eyebrow="CIRA travel concierge"
        title={<>Ask a better question. Get a <span style={{ color: 'var(--copper)' }}>bookable answer.</span></>}
        subtitle="Plan flights, hotels, lounge access and transfers with recommendations grounded in your wallet and clearly labelled sources."
        maxWidth={1100}
        showTabs={false}
      />

      {/* Chat column — fills remaining height, its own 720 measure, left-aligned */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 980, width: '100%', paddingTop: 28, paddingBottom: 26, position: 'relative', zIndex: 1 }}>

        {/* Suggested prompts - only when empty */}
        {empty && (
          <div style={{ marginBottom: 32 }}>
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
                backgroundColor: msg.role === 'user' ? 'var(--copper-3,#D89B2A)' : 'var(--navy,#142950)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#fff',
                fontFamily: 'var(--font-mono,monospace)',
              }}>
                {msg.role === 'user' ? 'G' : '\u2708'}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '82%',
                backgroundColor: msg.role === 'user' ? 'var(--navy,#142950)' : 'var(--surface,#fff)',
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
                <span style={{ color: 'var(--copper-3,#D89B2A)', fontSize: 14 }}>&#9992;</span>
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

      {/* Composer stays inside the travel workspace so it never overlaps the app rail. */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 20, width: '100%', maxWidth: 980,
        backgroundColor: 'color-mix(in srgb, var(--bg) 92%, transparent)',
        border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 18,
        padding: '12px 14px 10px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 -8px 34px color-mix(in srgb, var(--ink) 6%, transparent)',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
            &uarr;
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
