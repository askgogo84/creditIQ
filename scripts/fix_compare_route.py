import os, shutil

# Move file to correct folder name
old_dir = r'app/compare/[slug1]-vs-[slug2]'
new_dir = r'app/compare/[comparison]'

os.makedirs(new_dir, exist_ok=True)
shutil.copy(
    os.path.join(old_dir, 'page.tsx'),
    os.path.join(new_dir, 'page.tsx')
)

# Rewrite the page with correct param name
with open(os.path.join(new_dir, 'page.tsx'), 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Fix param references
content = content.replace(
    "params: { 'slug1-vs-slug2': string }",
    "params: { comparison: string }"
)
content = content.replace(
    "const raw = params['slug1-vs-slug2']",
    "const raw = params.comparison"
)

with open(os.path.join(new_dir, 'page.tsx'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("OK: compare page moved to app/compare/[comparison]/page.tsx")
print("Next: delete old folder manually or via git")
