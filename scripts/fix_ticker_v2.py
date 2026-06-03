filepath = r'app/api/ticker/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# The issue: title field exists but may be empty string, not null
# Also need to use content as primary fallback
old = "      const body = row.title || row.content?.slice(0, 80) || 'New insight'"
new = "      const body = (row.title && row.title.trim()) ? row.title : (row.content ? row.content.slice(0, 80) : null)\n      if (!body) return null"
content = content.replace(old, new)

# Filter nulls from map result
old2 = "      return NextResponse.json({ items })"
new2 = "      const filtered = items.filter(Boolean) as string[]\n      return NextResponse.json({ items: filtered.length ? filtered : [] })"
content = content.replace(old2, new2)

# Also fix the filter line
old3 = "      const items = data.filter((row: any) => row.title || row.content).map((row: any) => {"
new3 = "      const items = data.map((row: any) => {"
content = content.replace(old3, new3)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK")
