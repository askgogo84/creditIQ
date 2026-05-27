with open('app/bank/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
s = s.replace(
    '<CardTile key={card.id} card={toTileCard(card, i)} rank={i + 1} />',
    '<CardTile key={card.id} card={toTileCard(card, i)} rank={i + 1} href={`/card/${card.slug}`} />'
)
with open('app/bank/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
