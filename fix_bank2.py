with open('app/bank/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()

# Add CardVariant import and toTileCard adapter after existing imports
old = "from '@/components/design/CardTile'"
new = """from '@/components/design/CardTile'
import { type CardVariant } from '@/components/design/CreditCard3D'
import type { CreditCard } from '@/lib/types'

const VARIANT_ROTATION: CardVariant[] = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint']
const NETWORK_BY_BANK: Record<string, string> = { HDFC: 'VISA', AXIS: 'MASTERCARD', ICICI: 'AMEX', SBI: 'VISA', AMEX: 'AMEX', IDFC: 'VISA', RBL: 'MASTERCARD' }
function toTileCard(c: CreditCard, i: number) {
  const bank = c.bank.toUpperCase()
  return { bank, name: c.name.replace(/^HDFC\\s+|^AXIS\\s+|^ICICI\\s+|^SBI\\s+|^AMEX\\s+/i, '').replace(/ Credit Card$/i, ''), tagline: c.tier || 'Standard', tier: (c.tier || 'CARD').toUpperCase().replace(/-/g, ' '), network: NETWORK_BY_BANK[bank.split(' ')[0]] || 'VISA', variant: VARIANT_ROTATION[i % VARIANT_ROTATION.length], tags: (c.category || []).slice(0, 2).map((s: string) => s.replace(/-/g, ' ')), fee: c.annual_fee_inr, iqScore: Math.round((c.expert_rating ?? 8) * 10) }
}"""

s = s.replace(old, new)

# Fix the CardTile usage
s = s.replace('<CardTile key={card.id} card={card} rank={i + 1} />', '<CardTile key={card.id} card={toTileCard(card, i)} rank={i + 1} />')

with open('app/bank/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
