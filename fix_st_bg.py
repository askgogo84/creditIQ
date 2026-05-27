with open('app/statement-truth/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
s = s.replace("backgroundColor: '#f1f5f9'", "backgroundColor: 'var(--bg,#F5EFE6)'")
s = s.replace("background: '#f1f5f9'", "background: 'var(--bg,#F5EFE6)'")
s = s.replace("bg-slate-100", "")
s = s.replace("bg-gray-50", "")
with open('app/statement-truth/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
