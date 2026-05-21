'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Plane, Send, Zap, MapPin, Calendar, CreditCard, ArrowRight, Loader, LogIn, Sparkles } from 'lucide-react';
import Link from 'next/link';

const POPULAR_ROUTES = [
  { from: 'BOM', to: 'SIN', label: 'Mumbai → Singapore', flag: '🇸🇬' },
  { from: 'DEL', to: 'DXB', label: 'Delhi → Dubai', flag: '🇦🇪' },
  { from: 'BLR', to: 'LHR', label: 'Bengaluru → London', flag: '🇬🇧' },
  { from: 'BOM', to: 'BKK', label: 'Mumbai → Bangkok', flag: '🇹🇭' },
  { from: 'DEL', to: 'NYC', label: 'Delhi → New York', flag: '🇺🇸' },
  { from: 'BLR', to: 'SYD', label: 'Bengaluru → Sydney', flag: '🇦🇺' },
];

const SAMPLE_QUERIES = [
  "I'm travelling to Singapore in 3 months. When is the best time to book and what's the cheapest way using my HDFC points?",
  "I have 52,000 HDFC Regalia points. Can I fly business class to Dubai? What's the best way?",
  "Compare flying to Bangkok vs Singapore with my Axis EDGE miles. Which gives better value?",
  "When do KrisFlyer award seats open for BOM-SIN business class?",
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function TravelPlannerPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    sb.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetch(`/api/user-cards?userId=${user.id}`)
          .then(r => r.json())
          .then(d => {
            const cards = d.cards || [];
            setUserCards(cards);
            setTotalPoints(cards.reduce((s: number, c: any) => s + (c.points_balance || 0), 0));
          });
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const q = text || input.trim();
    if (!q) return;
    setInput('');
    setLoading(true);

    const newMessages: Message[] = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/travel-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userCards,
          totalPoints,
          userId,
        }),
      });

      if (!res.ok) throw new Error('AI service unavailable');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          aiResponse += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: aiResponse };
            return updated;
          });
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ overflowX: 'hidden' }}>
      <Header />
      <section className="flex-1 pt-20 pb-4 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto h-full flex flex-col">

          {/* Hero */}
          {messages.length === 0 && (
            <div className="py-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>AI Travel Planner · Beta</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl mb-3" style={{ color: 'var(--text)' }}>
                Plan trips with your <em className="not-italic" style={{ color: 'var(--accent)' }}>points</em>
              </h1>
              <p className="text-base mb-6" style={{ color: 'var(--text-muted)' }}>
                Ask anything about using your credit card points for travel. Best dates, cheapest routes, transfer partners, award availability.
              </p>

              {/* User points context */}
              {totalPoints > 0 && (
                <div className="rounded-xl p-4 border mb-6 flex items-center gap-3" style={{ borderColor: 'color-mix(in srgb, var(--emerald) 25%, transparent)', background: 'color-mix(in srgb, var(--emerald) 6%, transparent)' }}>
                  <CreditCard className="w-5 h-5 shrink-0" style={{ color: 'var(--emerald)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      Using your {totalPoints.toLocaleString('en-IN')} points across {userCards.length} card{userCards.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      {userCards.map(c => `${c.bank} (${(c.points_balance || 0).toLocaleString('en-IN')})`).join(' · ')}
                    </p>
                  </div>
                </div>
              )}

              {!userId && (
                <div className="rounded-xl p-4 border mb-6 flex items-start gap-3" style={{ borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
                  <LogIn className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Sign in for personalized advice</p>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Link your cards and the AI will use your actual points balance.</p>
                    <Link href="/login" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Sign in with Google →</Link>
                  </div>
                </div>
              )}

              {/* Popular routes */}
              <div className="mb-5">
                <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>Popular routes</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POPULAR_ROUTES.map(route => (
                    <button key={route.from + route.to}
                      onClick={() => sendMessage(`I want to travel ${route.label}. I have ${totalPoints > 0 ? totalPoints.toLocaleString('en-IN') + ' points' : 'credit card reward points'}. What's the best way to use my points for this route?`)}
                      className="flex items-center gap-2 p-3 rounded-xl border text-left transition-all hover:border-accent"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                      <span className="text-lg">{route.flag}</span>
                      <span className="text-xs" style={{ color: 'var(--text)' }}>{route.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample queries */}
              <div>
                <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>Ask something like</p>
                <div className="space-y-2">
                  {SAMPLE_QUERIES.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      className="w-full text-left p-3 rounded-xl border text-sm transition-all"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.length > 0 && (
            <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5" style={{ background: 'var(--accent)' }}>
                      <Plane className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                    style={{
                      background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: msg.role === 'user' ? 'white' : 'var(--text)',
                      border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                      whiteSpace: 'pre-wrap',
                    }}>
                    {msg.content || (loading && i === messages.length - 1 ? (
                      <span style={{ color: 'var(--text-dim)' }}>Thinking...</span>
                    ) : '')}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input bar */}
          <div className="pt-4 pb-2" style={{ borderTop: messages.length > 0 ? '1px solid var(--border)' : 'none' }}>
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about flights, hotels, transfer partners, award availability..."
                rows={2}
                style={{
                  flex: 1, padding: '12px 14px', borderRadius: 12,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 14, outline: 'none',
                  resize: 'none', lineHeight: 1.5,
                }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
                style={{ background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)', color: 'white' }}>
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-dim)' }}>
              AI advice only · Always verify prices on airline/hotel websites before booking
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}
