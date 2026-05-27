files = [
    'app/card/[slug]/CardDetailClient.tsx',
    'app/card/[slug]/page.tsx',
    'app/optimize/page.tsx',
]
for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    # CardMockup doesnt exist in design - remove or replace with CreditCard3D
    s = s.replace("import { CardMockup } from '@/components/design/CardTile';", "import { CreditCard3D } from '@/components/design/CreditCard3D';")
    s = s.replace("import { CardMockup } from '@/components/design/CardTile'", "import { CreditCard3D } from '@/components/design/CreditCard3D'")
    s = s.replace("<CardMockup ", "<CreditCard3D variant='obsidian' name='CARD' bank='BANK' tagline='' network='VISA' ")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(s)
    print(f'Fixed CardMockup: {path}')

# Fix smart-match TileCard adapter
with open('app/smart-match/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()

# Add toTileCard adapter if not present
if 'toTileCard' not in s:
    adapter = """
const VARIANT_ROTATION = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint'] as const
const NETWORK_BY_BANK: Record<string, string> = { HDFC: 'VISA', AXIS: 'MASTERCARD', ICICI: 'AMEX', SBI: 'VISA', AMEX: 'AMEX', IDFC: 'VISA' }
function toTileCard(c: any, i: number) {
  const bank = (c.bank || '').toUpperCase()
  return { bank, name: (c.name || '').replace(/^HDFC\\s+|^AXIS\\s+|^ICICI\\s+|^SBI\\s+/i, '').replace(/ Credit Card$/i, ''), tagline: c.tier || 'Standard', tier: (c.tier || 'CARD').toUpperCase().replace(/-/g, ' '), network: NETWORK_BY_BANK[bank.split(' ')[0]] || 'VISA', variant: VARIANT_ROTATION[i % VARIANT_ROTATION.length], tags: (c.category || []).slice(0, 2).map((s: string) => s.replace(/-/g, ' ')), fee: c.annual_fee_inr || 0, iqScore: Math.round((c.expert_rating ?? 8) * 10) }
}
"""
    # Insert after last import
    import re
    last_import = list(re.finditer(r'^import .+$', s, re.MULTILINE))[-1]
    pos = last_import.end()
    s = s[:pos] + '\n' + adapter + s[pos:]

# Fix card={r.card} usage
s = s.replace('card={r.card}', 'card={toTileCard(r.card, 0)}')

with open('app/smart-match/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Fixed smart-match')
