"use client";
import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";

interface Message { role: "user" | "assistant"; content: string; }

const SUGGESTIONS = [
  { icon: "\u2708\ufe0f", text: "Best way to fly to Europe on points?" },
  { icon: "\ud83d\uded2", text: "Best card for my Amazon spends?" },
  { icon: "\u23f1\ufe0f", text: "Is Axis Magnus worth keeping after Jul 1?" },
  { icon: "\ud83d\udd25", text: "Roast my HDFC Regalia Gold" },
];

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

export default function CiraPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message || "Sorry, I could not get a response. Please try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }]);
    }
    setLoading(false);
  };

  const empty = messages.length === 0 && !loading;

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", background: "var(--bg, #F5EFE6)", paddingTop: 72, paddingBottom: 140 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px" }}>

          {/* Hero / empty state */}
          {empty && (
            <div style={{ textAlign: "center", paddingTop: 32 }}>
              <div style={{
                width: 96, height: 96, borderRadius: "50%", margin: "0 auto 20px",
                background: "linear-gradient(135deg, #D89B2A, #B5811E)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 12px 32px rgba(216,155,42,0.45)",
              }}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                </svg>
              </div>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#8C5F12", fontWeight: 600 }}>Meet CIRA</div>
              <h1 style={{ fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 800, letterSpacing: -1, color: "#142950", margin: "8px 0 12px", lineHeight: 1.05 }}>
                Ask CIRA anything
              </h1>
              <p style={{ fontSize: 15, color: "#5A6A8A", maxWidth: 440, margin: "0 auto", lineHeight: 1.5 }}>
                India&rsquo;s most honest credit card advisor. Zero bank bias, grounded in live intelligence from top creators &mdash; surfacing transfer hacks and sweet spots most people miss.
              </p>

              <div style={{ display: "grid", gap: 10, marginTop: 28, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
                {SUGGESTIONS.map(s => (
                  <button key={s.text} onClick={() => send(s.text)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                      background: "#fff", border: "1px solid rgba(20,41,80,0.10)", borderRadius: 16,
                      padding: "14px 16px", cursor: "pointer", fontSize: 14.5, fontWeight: 500, color: "#142950",
                      transition: "border-color 0.15s, transform 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#D89B2A"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(20,41,80,0.10)"; e.currentTarget.style.transform = "none"; }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <span style={{ flex: 1 }}>{s.text}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A95AE" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation */}
          {!empty && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 20 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                  <div style={{
                    padding: "13px 16px", borderRadius: 18,
                    borderBottomRightRadius: m.role === "user" ? 5 : 18,
                    borderBottomLeftRadius: m.role === "user" ? 18 : 5,
                    background: m.role === "user" ? "#142950" : "#fff",
                    color: m.role === "user" ? "#F5EFE6" : "#142950",
                    border: m.role === "assistant" ? "1px solid rgba(20,41,80,0.10)" : "none",
                    fontSize: 15, lineHeight: 1.55,
                  }}>
                    {renderMarkdown(m.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: "flex-start" }}>
                  <div style={{ padding: "14px 18px", borderRadius: 18, borderBottomLeftRadius: 5, background: "#fff", border: "1px solid rgba(20,41,80,0.10)", display: "flex", gap: 5 }}>
                    <span className="ciq-dot" style={{ animationDelay: "0ms" }} />
                    <span className="ciq-dot" style={{ animationDelay: "150ms" }} />
                    <span className="ciq-dot" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Composer (fixed bottom) */}
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0,
          background: "linear-gradient(to top, var(--bg,#F5EFE6) 70%, transparent)",
          padding: "16px", paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Message CIRA…"
              rows={1}
              style={{
                flex: 1, resize: "none", maxHeight: 120,
                border: "1px solid rgba(20,41,80,0.14)", borderRadius: 22,
                padding: "12px 18px", fontSize: 15, lineHeight: 1.4,
                background: "#fff", color: "#142950", outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              style={{
                width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #D89B2A, #B5811E)",
                border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                opacity: input.trim() && !loading ? 1 : 0.4,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(216,155,42,0.4)",
              }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </button>
          </div>
        </div>
      </main>

      <style>{`
        .ciq-dot { width: 7px; height: 7px; border-radius: 50%; background: #8A95AE; display: inline-block; animation: ciqBounce 1s infinite; }
        @keyframes ciqBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .ciq-dot { animation: none; } }
      `}</style>
    </>
  );
}
