filepath = r'app/api/ticker/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Use content field since title is NULL on all migrated IG rows
old = "      const body = (row.title && row.title.trim()) ? row.title : (row.content ? row.content.slice(0, 80) : null)\n      if (!body) return null"
new = "      const body = (row.title && row.title.trim()) ? row.title.slice(0, 90) : (row.content ? row.content.slice(0, 90) : null)\n      if (!body) return null"
content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK")
