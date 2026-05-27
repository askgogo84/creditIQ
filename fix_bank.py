with open('app/bank/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
s = s.replace("from '@/components/CardTile'", "from '@/components/design/CardTile'")
s = s.replace("from '@/components/cards/", "from '@/components/design/")
with open('app/bank/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
