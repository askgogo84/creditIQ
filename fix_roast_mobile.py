with open('app/card-roast/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()

s = s.replace(
    "gridTemplateColumns: '1.1fr 1fr', gap: 'clamp(32px,5vw,64px)', alignItems: 'center', marginBottom: 'clamp(48px,7vw,80px)' }}",
    "gridTemplateColumns: '1.1fr 1fr', gap: 'clamp(32px,5vw,64px)', alignItems: 'center', marginBottom: 'clamp(48px,7vw,80px)' }} className=\"grid-1-mobile\""
)
s = s.replace(
    "gridTemplateColumns: '130px 1fr 1fr', gap: 20, paddingBottom: 14",
    "gridTemplateColumns: '130px 1fr 1fr', gap: 20, paddingBottom: 14"
)

with open('app/card-roast/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
