'use client';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;color:#1B3A5C;margin:16px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;color:#1B3A5C;margin:20px 0 8px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:800;color:#1B3A5C;margin:0 0 16px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#0f172a">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:10px;margin:5px 0;align-items:flex-start"><span style="color:#C9972E;font-weight:700;flex-shrink:0;margin-top:1px">&#x2022;</span><span>$1</span></div>')
    .replace(/\n{2,}/g, '<div style="height:10px"></div>')
    .replace(/\n/g, '<br/>');
}

export default function TravelPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch('/api/travel-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text ?? data.reply ?? data.message ?? 'Sorry, something went wrong.';
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Best card for SIN trip in 3 months using HDFC points?',
    'How to redeem Axis Magnus miles for business class?',
    'Compare Amex vs HDFC for international travel rewards',
    'Lounge access cards for frequent flyers in India',
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, maxWidth: 760, width: '100%', margin: '0 auto', padding: '24px 16px 120px', display: 'flex', flexDirection: 'column' }}>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              backgroundColor: '#1B3A5C', borderRadius: 100, padding: '6px 18px', marginBottom: 20,
            }}>
              <span style={{ fontSize: 14, color: '#C9972E' }}>&#9992;</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>Travel AI</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1B3A5C', margin: '0 0 12px', lineHeight: 1.2 }}>
              Your AI travel advisor
            </h1>
            <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 32px', lineHeight: 1.7 }}>
              Ask anything about using your credit card points for travel &mdash;<br />
              flights, hotels, transfers, lounge access, and more.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 560, margin: '0 auto' }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); }} style={{
                  padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: 12, fontSize: 13, color: '#374151', cursor: 'pointer',
                  textAlign: 'left', lineHeight: 1.4, fontWeight: 500,
                  transition: 'border-color 0.15s',
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
              display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 16,
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10, backgroundColor: '#1B3A5C',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginRight: 10, marginTop: 4, fontSize: 14, color: '#C9972E',
                }}>&#9992;</div>
              )}
              <div style={{
                maxWidth: '78%',
                backgroundColor: msg.role === 'user' ? '#C9972E' : '#ffffff',
                color: msg.role === 'user' ? '#ffffff' : '#1e293b',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                padding: '14px 18px',
                fontSize: 14,
                lineHeight: 1.7,
                border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, backgroundColor: '#1B3A5C',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#C9972E',
              }}>&#9992;</div>
              <div style={{
                backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px 18px 18px 18px',
                padding: '14px 20px', display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{
                    width: 7, height: 7, borderRadius: '50%', backgroundColor: '#C9972E',
                    animation: 'pulse 1.2s ease-in-out infinite',
                    animationDelay: `${j * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input bar — fixed bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0',
        padding: '12px 16px 20px',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about flights, hotels, transfer partners, award availability..."
            style={{
              flex: 1, padding: '12px 18px', borderRadius: 14, fontSize: 14,
              border: '1.5px solid #e2e8f0', outline: 'none', color: '#1e293b',
              backgroundColor: '#f8fafc',
            }}
          />
          <button onClick={send} disabled={loading || !input.trim()} style={{
            width: 46, height: 46, borderRadius: 12, backgroundColor: '#C9972E',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: loading || !input.trim() ? 0.5 : 1,
            fontSize: 18, color: '#fff',
          }}>&#8593;</button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>
          AI advice only &nbsp;&bull;&nbsp; Always verify prices on airline/hotel websites before booking
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
