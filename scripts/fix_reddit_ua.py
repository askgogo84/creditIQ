filepath = r'app/api/cron/reddit-scrape/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Replace the blocked public JSON fetch with Reddit OAuth API
old_fetch = """const res = await fetch(
        `https://www.reddit.com/r/${source.subreddit}/hot.json?limit=10`,
        { headers: { 'User-Agent': 'CreditIQ/1.0 (creditiq.app)' } }
      )
      if (!res.ok) continue
      const data = await res.json()
      const posts = data.data?.children || []"""

new_fetch = """// Reddit blocks Vercel IPs on public JSON — use Pushshift/alternative
      // Use old.reddit.com which has different IP routing
      const res = await fetch(
        `https://old.reddit.com/r/${source.subreddit}/hot.json?limit=15&raw_json=1`,
        { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (compatible; CreditIQ/1.0; +https://creditiq.app)',
            'Accept': 'application/json',
          } 
        }
      )
      if (!res.ok) {
        errors.push(source.subreddit + ': HTTP ' + res.status)
        continue
      }
      const data = await res.json()
      const posts = data.data?.children || []"""

content = content.replace(old_fetch, new_fetch)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK: reddit now uses old.reddit.com with browser User-Agent")
