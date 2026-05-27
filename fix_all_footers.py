import os, glob

files = glob.glob('app/**/*.tsx', recursive=True)
count = 0
for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    if "from '@/components/Footer'" in s:
        s = s.replace("import { Footer } from '@/components/Footer';", "import { DesignFooter } from '@/components/design/Footer';")
        s = s.replace("import { Footer } from \"@/components/Footer\";", "import { DesignFooter } from '@/components/design/Footer';")
        s = s.replace('<Footer />', '<DesignFooter />')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(s)
        count += 1
        print(f'Fixed: {path}')
print(f'\nTotal fixed: {count}')
