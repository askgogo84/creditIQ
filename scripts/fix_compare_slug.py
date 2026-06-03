import os, shutil

# Read the comparison page we built
with open(r'app/compare/[comparison]/page.tsx', 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Fix param to use 'slug' to match existing [slug] folder convention  
content = content.replace(
    "params: { comparison: string }",
    "params: { slug: string }"
)
content = content.replace(
    "const raw = params.comparison",
    "const raw = params.slug"
)

# Write to the [slug] folder
os.makedirs(r'app/compare/[slug]', exist_ok=True)
with open(r'app/compare/[slug]/page.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("OK: compare page written to app/compare/[slug]/page.tsx")
