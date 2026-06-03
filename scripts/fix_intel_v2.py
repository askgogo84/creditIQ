import re

filepath = r'app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Fix broken "View post" link - only show if source_url exists, no dash
content = content.replace(
    "{insight.source_url && <a href={insight.source_url} target=\"_blank\" rel=\"noopener noreferrer\" style={{ fontSize: 11, color: '#0369a1' }}>View source &#8599;</a>}",
    "{insight.source_url ? <a href={insight.source_url} target=\"_blank\" rel=\"noopener noreferrer\" style={{ fontSize: 11, color: '#0369a1' }}>View source &#8599;</a> : null}"
)

# Fix INSIGHT_ICONS - replace with clean text symbols
pattern = r"const INSIGHT_ICONS: Record<string, string> = \{[^\}]+\};"
replacement = """const INSIGHT_ICONS: Record<string, string> = {
  transfer_hack: '\u21c4', devaluation: '\u2193', card_comparison: '\u2248',
  sweet_spot: '\u2605', strategy: '\u25c6', general: '\u25cf',
  card_review: '\u2713', reward_tip: '\u25b6', lounge: '\u25a0', forex: '\u00a5',
};"""
content = re.sub(pattern, replacement, content, flags=re.DOTALL)
print("OK: icons fixed")

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("Done")
