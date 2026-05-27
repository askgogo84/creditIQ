with open('app/card-roast/page.tsx', 'r', encoding='utf-8') as f:
    s = f.read()
s = s.replace(' className="grid-1-mobile" className="grid-1-mobile"', ' className="grid-1-mobile"')
s = s.replace(' className="grid-2-mobile" className="grid-2-mobile"', ' className="grid-2-mobile"')
with open('app/card-roast/page.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')
