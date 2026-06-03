filepath = r'app/compare/page.tsx'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# The popular comparisons section is outside the page wrapper - move it inside
old = """</section>

{/* Popular Comparisons - SEO section */}
<div style={{ marginTop: 48 }}>"""

new = """</section>

        <section style={{ paddingBottom: 60 }}>
        <div className="shell">
        {/* Popular Comparisons - SEO section */}
        <div style={{ marginTop: 0 }}>"""

content = content.replace(old, new)

# Close the new section before DesignFooter
old2 = """</div>

<DesignFooter />
</div>
</>"""

new2 = """</div>
</div>
</section>

<DesignFooter />
</div>
</>"""

content = content.replace(old2, new2)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK: JSX structure fixed")
