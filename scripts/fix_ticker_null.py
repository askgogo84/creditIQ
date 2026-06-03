filepath = r'app/api/ticker/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

old = "      const items = data.map((row: any) => {"
new = "      const items = data.filter((row: any) => row.title || row.content).map((row: any) => {"

content = content.replace(old, new)

old2 = "      return cards ? `${prefix} — ${cards}: ${row.title}` : `${prefix} — ${row.title}`"
new2 = "      const body = row.title || row.content?.slice(0, 80) || 'New insight'\n      return cards ? `${prefix} — ${cards}: ${body}` : `${prefix} — ${body}`"

content = content.replace(old2, new2)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK: ticker null fix")
