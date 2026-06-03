filepath = r'app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Fix all remaining mojibake - these are the raw bytes that appear after utf8 misread
fixes = [
    ('\u00f0\u009f\u0094\u008d Scrape All Banks', '[SCRAPE] Scrape All Banks'),
    ('\u00f0\u009f\u0086\u0095 Discover New Cards', '[NEW] Discover New Cards'),
    ('\u00e2\u00a4\u00ef\u00bf\u00bd', 'Tr.'),
    ('\u00f0\u009f\u0092\u00a1 {insight', '{insight'),
    ('View post \u00e2\u0086\u0097', 'View source'),
    ('\u00f0\u009f\u0093\u00b1', 'IG'),
    ('\u00f0\u009f\u00a4\u0096', 'BOT'),
    ('\u00f0\u009f\u00a7\u00a0', 'AI'),
    ('\u00f0\u009f\u0093\u008a', 'VEC'),
    ('\u00f0\u009f\u0092\u00a1', 'CIRA'),
    ('\u00f0\u009f\u008e\u00a5', 'YT'),
    ('\u00f0\u009f\u0093\u00ba', 'YT'),
    ('\u00f0\u009f\u008e\u00a7', 'POD'),
    ('\u00f0\u009f\u0092\u00ac', 'RDT'),
    ('\u00f0\u009f\u0093\u0084', 'PDF'),
    ('\u00f0\u009f\u008e\u00af', '\u2605'),
    ('\u2696\u00ef\u00b8\u008f', '='),
    ('\u00f0\u009f\u0094\u0084', '\u21c4'),
]

count = 0
for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        count += 1
        print(f"Fixed: {repr(old[:15])} -> {new}")

print(f"Total fixes: {count}")

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("done")
