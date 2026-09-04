'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Clock3, Plus, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { authedFetch } from '@/lib/authed-fetch'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Plan a Bengaluru–Singapore trip with my points',
  'Which card should I use for my next purchase?',
  'Find benefits that may expire this month',
  'Explain what my wallet is really worth',
]

const RECENT = [
  { title: 'Plan Singapore with points', time: 'Just now' },
  { title: 'Best card for ₹2L tax payment', time: 'Yesterday' },
  { title: 'Review Axis statement', time: '28 Aug' },
]

function renderMarkdown(text: string) {
  const parts = text.split(/(→\s*\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    const link = part.match(/^(→\s*)?\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/i)
    if (link) {
      return <a key={index} href={link[3]} target="_blank" rel="noopener noreferrer nofollow">{link[2]} →</a>
    }
    return <span key={index}>{part}</span>
  })
}

export default function CiraPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    const question = new URLSearchParams(window.location.search).get('q')
    if (question) setInput(question)
  }, [])

  const send = async (text = input) => {
    const question = text.trim()
    if (!question || loading) return

    const history = messages.map(message => ({ role: message.role, content: message.content }))
    setMessages(previous => [...previous, { role: 'user', content: question }])
    setInput('')
    setLoading(true)

    try {
      const response = await authedFetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history }),
      })
      const data = await response.json()
      setMessages(previous => [...previous, {
        role: 'assistant',
        content: data.message || 'Sorry, I could not get a response. Please try again.',
      }])
    } catch {
      setMessages(previous => [...previous, {
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const empty = messages.length === 0 && !loading

  return (
    <main className="ciq-cira-page">
      <div className="ciq-cira-shell">
        <aside className="ciq-cira-history" aria-label="CIRA conversations">
          <div className="ciq-cira-history-head">
            <div>
              <span>CIRA</span>
              <h1>Concierge</h1>
            </div>
            <button type="button" aria-label="New conversation" onClick={() => setMessages([])}>
              <Plus size={17} />
            </button>
          </div>

          <button type="button" className="ciq-cira-new" onClick={() => setMessages([])}>
            <Sparkles size={15} /> New conversation
          </button>

          <div className="ciq-cira-history-label">Recent</div>
          <div className="ciq-cira-history-list">
            {RECENT.map((item, index) => (
              <button key={item.title} type="button" className={index === 0 ? 'active' : undefined}>
                <span>{item.title}</span>
                <small><Clock3 size={11} /> {item.time}</small>
              </button>
            ))}
          </div>

          <div className="ciq-cira-safety">
            <ShieldCheck size={20} />
            <span>
              <strong>Approval-first</strong>
              <small>CIRA never transfers points or pays without you.</small>
            </span>
          </div>
        </aside>

        <section className="ciq-cira-chat" aria-label="Chat with CIRA">
          <header className="ciq-cira-chat-head">
            <span className="ciq-cira-avatar"><Sparkles size={19} /></span>
            <span>
              <strong>CIRA</strong>
              <small><i /> CreditIQ rewards concierge</small>
            </span>
          </header>

          <div className="ciq-cira-messages" aria-live="polite">
            {empty ? (
              <div className="ciq-cira-intro">
                <span className="ciq-cira-hero-mark"><Sparkles size={30} /></span>
                <div className="ciq-editorial-kicker">Your rewards copilot</div>
                <h2>How can I help you use your rewards?</h2>
                <p>I can compare cards, plan a points trip, or explain any recommendation using your wallet.</p>
                <div className="ciq-cira-prompts">
                  {SUGGESTIONS.map(suggestion => (
                    <button key={suggestion} type="button" onClick={() => send(suggestion)}>
                      <span>{suggestion}</span><ArrowRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ciq-cira-thread">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`ciq-cira-message ${message.role}`}>
                    {message.role === 'assistant' && <span className="ciq-cira-message-avatar"><Sparkles size={14} /></span>}
                    <div>{renderMarkdown(message.content)}</div>
                  </div>
                ))}
                {loading && (
                  <div className="ciq-cira-message assistant">
                    <span className="ciq-cira-message-avatar"><Sparkles size={14} /></span>
                    <div className="ciq-cira-typing" aria-label="CIRA is thinking"><i /><i /><i /></div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <form className="ciq-cira-composer" onSubmit={event => { event.preventDefault(); send() }}>
            <div>
              <textarea
                ref={inputRef}
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    send()
                  }
                }}
                rows={1}
                placeholder="Ask about cards, points, flights or hotels…"
                aria-label="Message CIRA"
              />
              <button type="submit" disabled={!input.trim() || loading} aria-label="Send message">
                <Send size={18} />
              </button>
            </div>
            <p>CIRA prepares recommendations. You approve every irreversible action.</p>
          </form>
        </section>
      </div>
    </main>
  )
}
