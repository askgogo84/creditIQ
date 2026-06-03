filepath = r'app/api/cron/ig-fetch-results/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Fix 1: save to intelligence_kb instead of ig_knowledge_base
old_upsert = "const { error } = await sb.from('ig_knowledge_base').upsert(insight, { onConflict: 'post_id' });"
new_upsert = """// Map to intelligence_kb schema
        const kbRecord = {
          source: 'instagram',
          source_url: insight.post_url,
          creator_handle: insight.source_handle,
          creator_name: insight.source_handle,
          title: insight.insight_summary,
          content: insight.caption,
          insight_type: insight.insight_type,
          card_mentions: insight.structured_data?.cards_mentioned || [],
          trust_score: Math.min(1.0, (insight.likes || 0) / 10000),
          engagement: insight.likes || 0,
          published_at: insight.post_date,
          scraped_at: new Date().toISOString(),
          active: true,
        }
        // Also keep ig_knowledge_base for legacy admin view
        const { error } = await sb.from('ig_knowledge_base').upsert(insight, { onConflict: 'post_id' });
        // Save to intelligence_kb
        const { data: kbInserted } = await sb.from('intelligence_kb').upsert(kbRecord, { onConflict: 'source_url' }).select('id').single();
        if (kbInserted?.id) {
          const embedText = [kbRecord.insight_type, kbRecord.title, kbRecord.content?.slice(0,500), kbRecord.card_mentions.join(', ')].filter(Boolean).join(' | ')
          await embedAndSave(sb, kbInserted.id, embedText)
        }"""

if old_upsert in content:
    content = content.replace(old_upsert, new_upsert)
    print("OK: IG scraper now dual-writes to ig_knowledge_base + intelligence_kb with embedding")
else:
    print("MISS: upsert block not found")

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("done")
