with open('app/card/[slug]/CardDetailClient.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
# Only fix the background of breakdown rows - safe string replace
s = s.replace('bg-ink-950 border border-white/5 rounded"', 'rounded" style={{ background: "var(--surface,#fff)", border: "1px solid var(--line,rgba(20,41,80,0.08))" }}')
s = s.replace('text-sm text-ink-200"', 'text-sm" style={{ color: "var(--ink,#142950)" }}')
with open('app/card/[slug]/CardDetailClient.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
