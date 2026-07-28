// "What you get today" — honest LIVE vs coming-soon. No promised dates (PRD §4.1).
const LIVE = [
  { name: 'Wallet', desc: 'Add your cards, see what each actually earns.' },
  { name: 'Optimize', desc: 'Deterministic best-card math for your spend — no guessing.' },
  { name: 'Travel', desc: 'Points-vs-cash trip planning with real cached fares.' },
  { name: 'CIRA', desc: 'Ask anything about Indian cards, points and sweet spots.' },
];

const SOON = [
  'Statement upload → values verified from your real spend',
  'Devaluation alerts when a card quietly nerfs a benefit',
  'Award-seat watch',
];

export function WhatsLive() {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3, #5A6A8A)', marginBottom: 8 }}>
        The whole picture, honestly
      </div>
      <h2 style={{ fontFamily: 'var(--font-clash), system-ui, sans-serif', fontSize: 'clamp(28px,5vw,44px)', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 28px', color: 'var(--ink, #142950)' }}>
        What you get today.
      </h2>

      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--prov-verified)', marginBottom: 14 }}>
        ● Live — usable the moment you're in
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 32 }}>
        {LIVE.map((t) => (
          <div key={t.name} style={{ background: 'var(--surface, #fff)', border: '1px solid var(--line, rgba(20,41,80,0.08))', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink, #142950)', marginBottom: 6 }}>{t.name}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2, #2A3F6B)' }}>{t.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3, #5A6A8A)', marginBottom: 12 }}>
        ○ Coming soon — named honestly, no dates promised
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SOON.map((s) => (
          <li key={s} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--ink-2, #2A3F6B)' }}>
            <span style={{ color: 'var(--ink-4, #8A95AE)', flexShrink: 0 }}>○</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
