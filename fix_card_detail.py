import re

for path in ['app/card/[slug]/page.tsx', 'app/card/[slug]/CardDetailClient.tsx']:
    with open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    s = s.replace("import { Footer } from '@/components/Footer';", "import { DesignFooter } from '@/components/design/Footer';")
    s = s.replace('<Footer />', '<DesignFooter />')
    s = s.replace('className="min-h-screen"', 'className="page-fade"')
    s = s.replace('className="max-w-5xl mx-auto"', 'className="shell"')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(s)
    print(f'Done: {path}')
