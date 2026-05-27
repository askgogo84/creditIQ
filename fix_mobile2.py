import re

files = [
    'app/card-roast/page.tsx',
    'app/best-cards/[category]/page.tsx',
    'app/points-optimizer/page.tsx',
    'app/lounge-tracker/page.tsx',
]

# Fix broken pattern: "} className="grid-X-mobile"} className="grid-X-mobile""
# Should be: "}} className="grid-X-mobile""
for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    orig = s
    # Fix double className and broken style closing
    s = re.sub(r'\} className="(grid-[12]-mobile)"\} className="\1"', r'}} className="\1"', s)
    if s != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(s)
        print(f'Fixed: {path}')
    else:
        print(f'No change needed: {path}')
