filepath = r'app/api/cron/reddit-scrape/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Fix 1: Same insight_type fix
old_prompt_types = '"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|general"'
new_prompt_types = '"insight_type":"transfer_hack|devaluation|sweet_spot|strategy|general|card_review|reward_tip"'
content = content.replace(old_prompt_types, new_prompt_types)

# Fix 2: Sanitize insight_type before insert
old_record = "insight_type: insight.insight_type,"
new_record = """insight_type: (['transfer_hack','devaluation','sweet_spot','strategy','general','card_review','reward_tip','lounge','forex'].includes(insight.insight_type) ? insight.insight_type : 'strategy'),"""
content = content.replace(old_record, new_record)

# Fix 3: Lower the score threshold so more posts get through
old_score = "if (!post.title || post.score < 10) continue"
new_score = "if (!post.title || post.score < 3) continue"
content = content.replace(old_score, new_score)

# Fix 4: Also allow selftext-free posts (link posts have no body)
old_text = 'const text = (title + \' \' + body).slice(0, 1500)\nif (text.length < 80) return null'
new_text = 'const text = (title + \' \' + body).slice(0, 1500)\nif (text.length < 20) return null'
content = content.replace(old_text, new_text)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK: reddit insight_type sanitized + score threshold lowered")
