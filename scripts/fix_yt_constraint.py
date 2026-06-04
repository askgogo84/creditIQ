filepath = r'app/api/cron/youtube-scrape/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Fix 1: Restrict insight_type to ONLY values in the CHECK constraint
old_prompt_types = '"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|general"'
new_prompt_types = '"insight_type":"transfer_hack|devaluation|sweet_spot|strategy|general|card_review|reward_tip"'
content = content.replace(old_prompt_types, new_prompt_types)

# Fix 2: Map card_comparison -> strategy (safe fallback)
old_record = "insight_type: insight.insight_type,"
new_record = """insight_type: (['transfer_hack','devaluation','sweet_spot','strategy','general','card_review','reward_tip','lounge','forex'].includes(insight.insight_type) ? insight.insight_type : 'strategy'),"""
content = content.replace(old_record, new_record)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK: youtube insight_type sanitized")
