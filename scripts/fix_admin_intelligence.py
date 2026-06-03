import re

filepath = r'app/admin/page.tsx'

with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

old_interface = 'interface IgInsight { id: string; source_handle: string; post_id: string; post_url: string; caption: string; post_date: string; insight_type: string; insight_summary: string; structured_data: any; likes: number; scraped_at: string; click_count?: number }'
new_interface = 'interface IgInsight { id: string; source: string; source_url: string; creator_handle: string; creator_name: string; title: string; content: string; insight_type: string; trust_score: number; engagement: number; card_mentions: string[]; scraped_at: string; published_at: string; }'
content = content.replace(old_interface, new_interface)
print("Interface:", "OK" if new_interface in content else "NOT FOUND")

old_from = ".from('ig_knowledge_base')"
new_from = ".from('intelligence_kb')"
content = content.replace(old_from, new_from)
print("Table name:", "OK" if new_from in content else "NOT FOUND")

old_order = ".order('likes', { ascending: false })"
new_order = ".eq('active', true)\n        .order('scraped_at', { ascending: false })"
content = content.replace(old_order, new_order)
print("Order clause:", "OK" if "intelligence_kb" in content else "NOT FOUND")

content = content.replace("insight.source_handle", "insight.creator_handle")
content = content.replace("insight.insight_summary", "insight.title || insight.content?.slice(0, 120)")
content = content.replace("insight.post_url", "insight.source_url")
content = content.replace("insight.likes", "insight.trust_score ?? 0")
content = content.replace("structured_data?.cards_mentioned", "card_mentions")
content = content.replace("structured_data.cards_mentioned", "card_mentions")
content = content.replace("structured_data?.actionable_tip", "content")
content = content.replace("structured_data.actionable_tip", "content?.slice(0,150)")
print("Field renames: OK")

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Done!")
