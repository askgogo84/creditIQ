# Fix statement-truth - revert the broken wrapper
with open('app/statement-truth/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()

# The regex added a broken fragment - find and fix
# Replace the broken opening
s = s.replace(
    "<>`\n      <Header />\n      <main style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(100px,14vw,140px) clamp(20px,5vw,80px) 80px' }}>",
    "<>\n      <Header />\n      <main style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(100px,14vw,140px) clamp(20px,5vw,80px) 80px' }}>"
)

# Fix the closing
s = s.replace(
    "</main>\n      <DesignFooter />\n    </>\n  );",
    "</main>\n      <DesignFooter />\n    </>"
)

# Check if Header is already being used in return
if '<Header />' not in s:
    s = s.replace('<div style={{ minHeight:', '<>\n      <Header />\n      <div style={{ minHeight:')
    s = s.replace('</div>\n  );', '</div>\n      <DesignFooter />\n    </>\n  );')

# Fix background color
s = s.replace("backgroundColor: '#f1f5f9'", "backgroundColor: 'var(--bg,#F5EFE6)'")

with open('app/statement-truth/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Fixed statement-truth')

# Fix CardDetailClient - revert broken fix_card_bars changes
with open('app/card/[slug]/CardDetailClient.tsx', 'r', encoding='utf-8') as f:
    s = f.read()

# Fix the broken style replacement that corrupted JSX
import re
# The issue is className={`...`} got split - restore dark bars but with proper syntax
# Just fix the background of the breakdown rows
s = s.replace(
    'style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"var(--bg-2,#EFE7D8)", border:"1px solid var(--line,rgba(20,41,80,0.08))", borderRadius:10 }}',
    'style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"var(--surface,#fff)", border:"1px solid var(--line,rgba(20,41,80,0.08))", borderRadius:10 }}'
)

with open('app/card/[slug]/CardDetailClient.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Fixed CardDetailClient')
