with open('app/statement-truth/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
s = s.replace(
    "maxWidth: 720, margin: '0 auto', padding: '32px 16px 80px'",
    "maxWidth: 800, margin: '0 auto', padding: 'clamp(100px,14vw,140px) clamp(20px,5vw,40px) 80px'"
)
with open('app/statement-truth/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
