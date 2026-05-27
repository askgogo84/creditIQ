# Fix 1: CardDetailClient - remove card prop from CreditCard3D
with open('app/card/[slug]/CardDetailClient.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
s = s.replace("<CreditCard3D variant='obsidian' name='CARD' bank='BANK' tagline='' network='VISA' card={card} size=\"lg\" />",
              "<CreditCard3D variant='obsidian' name={(card.name || 'CARD').toUpperCase()} bank={(card.bank || 'BANK').toUpperCase()} tagline={card.tier || ''} network='VISA' />")
with open('app/card/[slug]/CardDetailClient.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Fixed CardDetailClient')

# Fix 2: optimize - remove card prop from CreditCard3D
with open('app/optimize/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
s = s.replace("<CreditCard3D variant='obsidian' name='CARD' bank='BANK' tagline='' network='VISA' card={card} size=\"md\" />",
              "<CreditCard3D variant='obsidian' name='CARD' bank='BANK' tagline='' network='VISA' />")
with open('app/optimize/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Fixed optimize')

# Fix 3: smart-match - remove annualValue prop, add href
with open('app/smart-match/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
import re
# Remove annualValue and reasoning props, add href
s = re.sub(r'annualValue=\{r\.annual_value_inr\}\s*', '', s)
s = re.sub(r'reasoning=\{r\.reasoning\}\s*', '', s)
# Add href if missing
s = s.replace('card={toTileCard(r.card, 0)}', 'card={toTileCard(r.card, 0)} href={`/card/${r.card.slug}`}')
with open('app/smart-match/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Fixed smart-match')
