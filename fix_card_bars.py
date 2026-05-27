with open('app/card/[slug]/CardDetailClient.tsx', 'r', encoding='utf-8') as f:
    s = f.read()

# Fix black breakdown bars
s = s.replace(
    'className="flex justify-between items-center px-4 py-3 bg-ink-950 border border-white/5 rounded"',
    'style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"var(--bg-2,#EFE7D8)", border:"1px solid var(--line,rgba(20,41,80,0.08))", borderRadius:10 }}'
)
# Fix text colors in breakdown
s = s.replace('className="text-sm text-ink-200"', 'style={{ fontSize:14, color:"var(--ink,#142950)" }}')
s = s.replace(
    'className={`font-display text-base tabular ${',
    'style={{ fontSize:15, fontWeight:700, color:'
)

with open('app/card/[slug]/CardDetailClient.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
