import glob

files = [
    'app/card/[slug]/CardDetailClient.tsx',
    'app/card/[slug]/page.tsx',
    'app/optimize/page.tsx',
    'app/smart-match/page.tsx',
]

for path in files:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            s = f.read()
        s = s.replace("from '@/components/Footer'", "from '@/components/design/Footer'")
        s = s.replace("from '@/components/CardTile'", "from '@/components/design/CardTile'")
        s = s.replace("from '@/components/cards/CardMockup'", "from '@/components/design/CardTile'")
        s = s.replace("from '@/components/cards/", "from '@/components/design/")
        s = s.replace("{ Footer }", "{ DesignFooter }")
        s = s.replace("<Footer />", "<DesignFooter />")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(s)
        print(f'Fixed: {path}')
    except Exception as e:
        print(f'Error {path}: {e}')
