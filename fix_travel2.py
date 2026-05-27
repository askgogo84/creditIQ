with open('app/travel/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
s = s.replace("backgroundColor: '#f1f5f9'", "backgroundColor: 'var(--bg,#F5EFE6)'")
s = s.replace("backgroundColor: '#f8fafc'", "backgroundColor: 'var(--bg,#F5EFE6)'")
with open('app/travel/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
