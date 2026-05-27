with open('app/card/[slug]/CardDetailClient.tsx', 'r', encoding='utf-8') as f:
    s = f.read()

# Update dark bg to use design tokens
s = s.replace('className="bg-ink-950 border border-white/10 rounded-xl p-6 space-y-6"',
              'style={{ background: "var(--paper,#FAF5EB)", border: "1px solid var(--line,rgba(20,41,80,0.08))", borderRadius: 16, padding: 24 }}')
s = s.replace('className="text-xs font-mono uppercase tracking-widest text-ink-400"',
              'style={{ fontSize: 10, fontFamily: "var(--font-mono,monospace)", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--ink-3,#5A6A8A)" }}')
s = s.replace('className="font-display text-2xl text-copper-300 tabular"',
              'style={{ fontSize: 24, fontWeight: 800, color: "var(--copper-3,#D89B2A)", fontVariantNumeric: "tabular-nums" }}')
s = s.replace('className="w-full accent-copper-400"',
              'style={{ width: "100%", accentColor: "var(--copper-3,#D89B2A)" }}')
s = s.replace('className="pt-4 border-t border-white/5 space-y-3"',
              'style={{ paddingTop: 16, borderTop: "1px solid var(--line,rgba(20,41,80,0.08))", display: "flex", flexDirection: "column", gap: 12 }}')
s = s.replace('className="text-sm text-ink-300"', 'style={{ fontSize: 14, color: "var(--ink-2,#2A3F6B)" }}')
s = s.replace('className="font-display text-xl text-ink-50 tabular"',
              'style={{ fontSize: 20, fontWeight: 700, color: "var(--ink,#142950)" }}')
s = s.replace('className="font-display text-xl text-crimson-400 tabular"',
              'style={{ fontSize: 20, fontWeight: 700, color: "#B84230" }}')
s = s.replace('className="pt-3 border-t border-white/5 flex justify-between items-baseline"',
              'style={{ paddingTop: 12, borderTop: "1px solid var(--line,rgba(20,41,80,0.08))", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}')
s = s.replace('className="text-sm text-ink-200 font-medium"',
              'style={{ fontSize: 14, color: "var(--ink,#142950)", fontWeight: 600 }}')

# Update page wrapper
s = s.replace('className="min-h-screen bg-bg-950"', 'className="page-fade"')
s = s.replace('className="min-h-screen"', 'className="page-fade"')

with open('app/card/[slug]/CardDetailClient.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
