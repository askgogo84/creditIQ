'use client';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;color:#1B3A5C;margin:14px 0 4px 0">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:700;color:#1B3A5C;margin:18px 0 6px 0;padding-bottom:4px;border-bottom:1px solid #e2e8f0">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:800;color:#1B3A5C;margin:0 0 14px 0">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#0f172a">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic">$1</em>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;align-items:flex-start"><span style="color:#C9972E;font-weight:900;font-size:16px;line-height:1.4;flex-shrink:0">&bull;</span><span style="line-height:1.6">$1</span></div>')
    .replace(/\n{2,}/g, '<div style="height:8px"></div>')
    .replace(/\n/g, ' ');
}

const SUGGESTIONS = [
  'Best way to use 52,164 HDFC points for Singapore?',
  'Axis Magnus lounge access -- how many visits per year?',
  'Which card gives best forex rates for international travel?',
  'Transfer HDFC points to KrisFlyer or Avios -- which is better?',
];

export default function TravelPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
        data?.reply ??
        data?.message ??
        data?.content?.[0]?.text ??
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

      {/* Page wrapper */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 700, width: '100%', margin: '0 auto', padding: '0 16px' }}>

        {/* Hero -- only when empty */}
        {empty && (
          <div style={{ padding: '36px 0 24px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-block', backgroundColor: '#1B3A5C', borderRadius: 100,
              padding: '5px 18px', marginBottom: 18,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Travel AI &nbsp;&bull;&nbsp; Powered by Claude
              </span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1B3A5C', margin: '0 0 10px', lineHeight: 1.2 }}>
              Your AI travel advisor
            </h1>
            <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
              Ask anything about flights, hotels, lounge access,<br />points transfers, and award redemptions.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  padding: '11px 14px', backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0', borderRadius: 12,
                  fontSize: 13, color: '#374151', cursor: 'pointer',
                  textAlign: 'left', lineHeight: 1.4, fontWeight: 500,
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, paddingBottom: 100 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 10, marginBottom: 14, alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                backgroundColor: msg.role === 'user' ? '#C9972E' : '#1B3A5C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, color: '#fff', fontWeight: 700,
              }}>
                {msg.role === 'user' ? 'G' : <span style={{ color: '#C9972E' }}>&#9992;</span>}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '82%',
                backgroundColor: msg.role === 'user' ? '#1B3A5C' : '#ffffff',
                color: msg.role === 'user' ? '#f1f5f9' : 'var(--surface,#fff)',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                padding: '13px 16px',
                fontSize: 14,
                lineHeight: 1.7,
                border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
              }}>
                {msg.role === 'assistant'
                  ? <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                  : msg.content
                }
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, backgroundColor: '#1B3A5C',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: '#C9972E', fontSize: 15 }}>&#9992;</span>
              </div>
              <div style={{
                backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                borderRadius: '4px 16px 16px 16px', padding: '14px 18px',
                display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    backgroundColor: '#C9972E',
                    opacity: 0.4,
                    animation: `dot-bounce 1.2s ${j * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Fixed input bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0',
        padding: '12px 16px 16px',
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about flights, hotels, lounge access..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12,
              border: '1.5px solid #e2e8f0', fontSize: 14,
              color: 'var(--surface,#fff)', backgroundColor: 'var(--bg,#F5EFE6)', outline: 'none',
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12, border: 'none',
              backgroundColor: input.trim() && !loading ? '#C9972E' : '#e2e8f0',
              color: '#fff', fontSize: 18, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            &#8593;
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>
          AI advice only &nbsp;&bull;&nbsp; Verify prices before booking
        </p>
      </div>

      <style>{`
        @keyframes dot-bounce {
          0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}


