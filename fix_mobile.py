import glob, re

files = [
    'app/card-roast/page.tsx',
    'app/points-optimizer/page.tsx',
    'app/statement-truth/page.tsx',
    'app/lounge-tracker/page.tsx',
    'app/best-cards/[category]/page.tsx',
]

patterns = [
    # 3-col grids
    (r"gridTemplateColumns: 'repeat\(3,1fr\)'([^}]*)\}", lambda m: m.group(0)),
    # 4-col grids  
    (r"gridTemplateColumns: 'repeat\(4,1fr\)'([^}]*)\}", lambda m: m.group(0)),
    # 2-col grids
    (r"gridTemplateColumns: '1fr 1fr'([^}]*)\}", lambda m: m.group(0)),
]

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    orig = s
    
    # Add grid-1-mobile to all multi-col grids that dont have it
    s = re.sub(
        r"(display: 'grid', gridTemplateColumns: 'repeat\(3,1fr\)'[^}]*\})\s*(?!className)",
        r'\1 className="grid-1-mobile"',
        s
    )
    s = re.sub(
        r"(display: 'grid', gridTemplateColumns: 'repeat\(4,1fr\)'[^}]*\})\s*(?!className)",
        r'\1 className="grid-2-mobile"',
        s
    )
    s = re.sub(
        r"(<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr'[^}]*\}\})(?!\s*className)",
        r'\1 className="grid-1-mobile"',
        s
    )
    s = re.sub(
        r"(<div style=\{\{ display: 'grid', gridTemplateColumns: '0\.9fr 1\.2fr'[^}]*\}\})(?!\s*className)",
        r'\1 className="grid-1-mobile"',
        s
    )
    s = re.sub(
        r"(<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1\.4fr'[^}]*\}\})(?!\s*className)",
        r'\1 className="grid-1-mobile"',
        s
    )
    s = re.sub(
        r"(<div style=\{\{ display: 'grid', gridTemplateColumns: '1\.1fr 1fr'[^}]*\}\})(?!\s*className)",
        r'\1 className="grid-1-mobile"',
        s
    )
    s = re.sub(
        r"(<div style=\{\{ display: 'grid', gridTemplateColumns: '1\.2fr 1fr'[^}]*\}\})(?!\s*className)",
        r'\1 className="grid-1-mobile"',
        s
    )
    
    if s != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(s)
        print(f'Fixed: {path}')
    else:
        print(f'No change: {path}')
