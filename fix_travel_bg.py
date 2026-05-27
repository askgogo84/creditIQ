with open('app/travel/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
s = s.replace("'#0f172a'", "'var(--bg,#F5EFE6)'")
s = s.replace('"#0f172a"', '"var(--bg,#F5EFE6)"')
s = s.replace("'#1e293b'", "'var(--surface,#fff)'")
s = s.replace("background: '#f8fafc'", "background: 'var(--bg,#F5EFE6)'")
with open('app/travel/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
