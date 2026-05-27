import glob, re

files = glob.glob('app/**/*.tsx', recursive=True)
count = 0
for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    orig = s
    s = s.replace("import { Footer } from '@/components/Footer';", "import { DesignFooter } from '@/components/design/Footer';")
    s = s.replace("import { Footer } from \"@/components/Footer\";", "import { DesignFooter } from '@/components/design/Footer';")
    s = s.replace("{ Footer }", "{ DesignFooter }")
    s = s.replace("<Footer />", "<DesignFooter />")
    # Remove CompareTray import and usage (not in new design)
    s = re.sub(r"import \{ CompareTray \}.*;\n", "", s)
    s = re.sub(r"<CompareTray[^/]*/?>", "", s)
    s = re.sub(r"<CompareTray[^>]*>[^<]*</CompareTray>", "", s)
    if s != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(s)
        count += 1
        print(f'Fixed: {path}')
print(f'Total: {count}')
