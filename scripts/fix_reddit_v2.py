filepath = r'app/api/cron/reddit-scrape/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Fix 1: Remove is_valuable filter — save everything and let pgvector ranking sort quality
old_check = 'if (!parsed.is_valuable) return null'
new_check = '// Save all insights, trust score handles quality filtering'
content = content.replace(old_check, new_check)

# Fix 2: Make prompt less restrictive
old_prompt = '{"insight_type":"transfer_hack|devaluation|sweet_spot|strategy|general|card_review|reward_tip","title":"one clear insight headline","content":"2-3 sentence summary","card_mentions":[],"is_valuable":true}'
new_prompt = '{"insight_type":"transfer_hack|devaluation|sweet_spot|strategy|general|card_review|reward_tip","title":"one clear insight headline under 15 words","content":"2-3 sentence summary of what Indian CC users would find useful","card_mentions":["any card names mentioned"],"is_valuable":true}'
content = content.replace(old_prompt, new_prompt)

# Fix 3: Score threshold already at 3, but also skip empty title only
old_skip = "if (!post.title || post.score < 3) continue"
new_skip = "if (!post.title) continue"
content = content.replace(old_skip, new_skip)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK: reddit - removed is_valuable gate, lowered threshold to 0")
