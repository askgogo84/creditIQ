'use client';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  'Best card for Swiggy?',
  'Which card for Zara?',
  'Best card for Amazon?',
  'Best forex card for travel?',
];


function renderMarkdown(text: string) {
  // Convert **bold** to <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function CreditIQAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || 'Sorry, I could not get a response. Please try again.',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Chat bubble */}
      <div style={{ position: 'fixed', bottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 80px))', right: 16, zIndex: 1000 }}>
        {/* Tooltip */}
        {!open && pulse && (
          <div style={{
            position: 'absolute', bottom: 64, right: 0,
            background: '#1B3A5C', color: '#fff',
            padding: '8px 14px', borderRadius: 12,
            fontSize: 13, fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            Ask me anything about cards!
            <div style={{
              position: 'absolute', bottom: -6, right: 20,
              width: 12, height: 12,
              background: '#1B3A5C',
              transform: 'rotate(45deg)',
            }} />
          </div>
        )}

        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close chat assistant' : 'Open chat assistant'}
          aria-expanded={open}
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1B3A5C, #C9972E)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(201,151,46,0.4)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 'max(92px, calc(env(safe-area-inset-bottom, 0px) + 148px))', right: 16, zIndex: 999,
          width: 360, maxWidth: 'calc(100vw - 48px)',
          borderRadius: 20,
          background: 'var(--surface, #fff)',
          border: '1px solid var(--line, rgba(20,41,80,0.1))',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 520,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #1B3A5C, #0d2240)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(201,151,46,0.2)',
              border: '2px solid #C9972E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9972E" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>CreditIQ Assistant</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Powered by AI . Zero bank bias</div>
            </div>
            <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {messages.length === 0 && (
              <div>
                <div style={{ fontSize: 13, color: 'var(--ink-3, #5A6A8A)', marginBottom: 12, lineHeight: 1.5 }}>
                  Hi! Ask me which credit card works best for any merchant, category, or spend pattern.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      style={{
                        textAlign: 'left', padding: '8px 12px',
                        background: 'var(--surface-2, #f8f9fc)',
                        border: '1px solid var(--line, rgba(20,41,80,0.08))',
                        borderRadius: 10, fontSize: 13,
                        color: 'var(--ink, #142950)',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#EFE7D8')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2, #f8f9fc)')}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 14,
                  fontSize: 13, lineHeight: 1.55,
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #1B3A5C, #0d2240)'
                    : 'var(--surface-2, #f8f9fc)',
                  color: msg.role === 'user' ? '#fff' : 'var(--ink, #142950)',
                  border: msg.role === 'assistant' ? '1px solid var(--line, rgba(20,41,80,0.08))' : 'none',
                }}>
                  {renderMarkdown(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 4px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#C9972E',
                    animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--line, rgba(20,41,80,0.08))',
            display: 'flex', gap: 8,
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about any card or merchant..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                border: '1px solid var(--line, rgba(20,41,80,0.12))',
                background: 'var(--surface-2, #f8f9fc)',
                fontSize: 13, color: 'var(--ink, #142950)',
                outline: 'none',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: input.trim() ? '#C9972E' : 'var(--surface-2, #f0f0f0)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={input.trim() ? '#fff' : '#999'} strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>

          {/* WhatsApp CTA */}
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--line, rgba(20,41,80,0.06))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'rgba(37,211,102,0.04)',
          }}>
            <a href="https://wa.me/15797006612?text=Hi%20AskGogo%2C%20I%20need%20help%20with%20my%20credit%20card"
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, color: '#25D366', fontWeight: 600,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.131.558 4.13 1.535 5.864L.057 23.5l5.805-1.524A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.647-.52-5.148-1.422l-.369-.219-3.818 1.002 1.02-3.72-.24-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Continue on WhatsApp
            </a>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </>
  );
}

