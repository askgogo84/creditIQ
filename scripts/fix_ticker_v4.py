filepath = r'app/api/ticker/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Fix corrupted em dash
content = content.replace('â€"', '-')
content = content.replace('\u00e2\u0080\u0094', '-')

# Fix: filter out nulls from items array
old = "    return NextResponse.json({ items })"
new = "    const filtered = (items as (string|null)[]).filter((x): x is string => x !== null)\n    return NextResponse.json({ items: filtered.length ? filtered : [] })"
content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK: em dash fixed + nulls filtered")
