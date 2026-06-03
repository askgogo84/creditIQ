import os

os.makedirs(r'app/compare', exist_ok=True)

# Read existing compare/page.tsx to preserve it
with open(r'app/compare/page.tsx', 'r', encoding='utf-8-sig') as f:
    existing = f.read()

# Only add compare index if it does not already have popular pairs section
if 'popular-pairs' not in existing and 'HDFC Infinia' not in existing:
    print("SKIP: compare page already has content - not overwriting")
else:
    print("INFO: compare page is the interactive picker - adding SEO index as separate route")

# Create a static SEO page at /compare/index that lists popular pairs
# Actually we add popular pairs to the existing compare page bottom section
# Find insertion point - before DesignFooter
new_section = """
          {/* Popular Comparisons - SEO section */}
          <div style={{ marginTop: 48 }}>
            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 16 }}>Popular Comparisons</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
              {[
                { slug: 'hdfc-infinia-vs-axis-magnus-burgundy', label: 'HDFC Infinia vs Axis Magnus' },
                { slug: 'hdfc-regalia-gold-vs-axis-magnus-burgundy', label: 'HDFC Regalia Gold vs Axis Magnus' },
                { slug: 'hdfc-infinia-vs-icici-emeralde-private-metal', label: 'HDFC Infinia vs ICICI Emeralde' },
                { slug: 'axis-magnus-burgundy-vs-hdfc-diners-club-black', label: 'Axis Magnus vs HDFC Diners Black' },
                { slug: 'sbi-cashback-vs-amazon-pay-icici', label: 'SBI Cashback vs Amazon Pay ICICI' },
                { slug: 'hdfc-millennia-vs-axis-ace-credit-card', label: 'HDFC Millennia vs Axis ACE' },
                { slug: 'amazon-pay-icici-vs-flipkart-axis-bank-credit-card', label: 'Amazon Pay ICICI vs Flipkart Axis' },
                { slug: 'scapia-federal-bank-credit-card-vs-niyo-global', label: 'Scapia vs Niyo Global' },
              ].map(({ slug, label }) => (
                <Link key={slug} href={`/compare/${slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 12, textDecoration: 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink,#142950)' }}>{label}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)' }}>&rarr;</span>
                </Link>
              ))}
            </div>
          </div>"""

if '<DesignFooter />' in existing and 'Popular Comparisons' not in existing:
    updated = existing.replace('<DesignFooter />', new_section + '\n\n<DesignFooter />')
    with open(r'app/compare/page.tsx', 'w', encoding='utf-8', newline='\n') as f:
        f.write(updated)
    print("OK: popular comparisons section added to compare page")
else:
    print("SKIP: already has popular comparisons or DesignFooter not found")
