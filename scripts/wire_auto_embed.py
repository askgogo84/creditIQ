import re

files = [
    r'app/api/cron/ig-fetch-results/route.ts',
    r'app/api/cron/youtube-scrape/route.ts',
    r'app/api/cron/reddit-scrape/route.ts',
]

EMBED_FN = '''
async function embedAndSave(sb: any, id: string, text: string): Promise<void> {
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
    })
    if (!res.ok) return
    const data = await res.json()
    const embedding = data.data?.[0]?.embedding
    if (embedding) {
      await sb.from('intelligence_kb').update({ embedding }).eq('id', id)
    }
  } catch { /* non-fatal */ }
}
'''

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            content = f.read()
        
        # Skip if already has embedAndSave
        if 'embedAndSave' in content:
            print(f'SKIP (already patched): {filepath}')
            continue

        # Add embedAndSave function before the export
        content = content.replace(
            'export const runtime',
            EMBED_FN + '\nexport const runtime'
        )

        # Find insert blocks and add embedding call after successful insert
        # Pattern: after sb.from('intelligence_kb').insert(...)
        # We look for the insert result and add embedding call
        
        # For ig-fetch-results: patch after insert
        if 'ig-fetch-results' in filepath:
            old = "const { data: inserted, error: insErr } = await sb\n          .from('intelligence_kb')\n          .insert(record)\n          .select('id')\n          .single()"
            new = "const { data: inserted, error: insErr } = await sb\n          .from('intelligence_kb')\n          .insert(record)\n          .select('id')\n          .single()\n        if (inserted?.id) {\n          const embedText = [record.insight_type, record.title, record.content, (record.card_mentions||[]).join(', ')].filter(Boolean).join(' | ')\n          await embedAndSave(sb, inserted.id, embedText)\n        }"
            if old in content:
                content = content.replace(old, new)
                print(f'OK patched insert: {filepath}')
            else:
                print(f'MISS insert block: {filepath} - add embedAndSave manually after insert')

        # For youtube and reddit: find insert patterns
        if 'youtube-scrape' in filepath or 'reddit-scrape' in filepath:
            # Find .insert( calls on intelligence_kb and patch
            pattern = r"(\.from\('intelligence_kb'\)\s*\n?\s*\.insert\([^)]+\)\s*\n?\s*\.select\('id'\)\s*\n?\s*\.single\(\))"
            match = re.search(pattern, content)
            if match:
                old_insert = match.group(0)
                new_insert = old_insert + "\n        if (saved?.id) {\n          const embedText = [row.insight_type, row.title, row.content, (row.card_mentions||[]).join(', ')].filter(Boolean).join(' | ')\n          await embedAndSave(sb, saved.id, embedText)\n        }"
                content = content.replace(old_insert, new_insert)
                print(f'OK patched insert: {filepath}')
            else:
                print(f'MISS insert block: {filepath} - check manually')

        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)

    except FileNotFoundError:
        print(f'NOT FOUND: {filepath}')
    except Exception as e:
        print(f'ERROR {filepath}: {e}')

print('Done')
