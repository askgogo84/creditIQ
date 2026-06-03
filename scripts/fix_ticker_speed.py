filepath = r'app/globals.css'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Slow down marquee and increase gap between items
content = content.replace(
    'animation: marquee 48s linear infinite;',
    'animation: marquee 90s linear infinite;'
)
content = content.replace(
    '.marquee__track {\ndisplay: flex;\ngap: 56px;',
    '.marquee__track {\ndisplay: flex;\ngap: 120px;'
)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK")
