content = open('fix_category_page.txt', 'r', encoding='utf-8').read()
import os
os.makedirs('app/best-cards/[category]', exist_ok=True)
with open('app/best-cards/[category]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
