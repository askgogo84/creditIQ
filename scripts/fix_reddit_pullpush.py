filepath = r'app/api/cron/reddit-scrape/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

old_fetch = """// Reddit blocks Vercel IPs on public JSON — use Pushshift/alternative
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

new_fetch = """// Reddit blocks Vercel IPs — use Pullpush.io (community Pushshift)
      const since = Math.floor((Date.now() - 48 * 60 * 60 * 1000) / 1000)
      const res = await fetch(
        `https://api.pullpush.io/reddit/search/submission/?subreddit=${source.subreddit}&sort=score&sort_type=desc&size=15&after=${since}`,
        { headers: { 'User-Agent': 'CreditIQ/1.0 (creditiq.app)' } }
      )
      if (!res.ok) {
        errors.push(source.subreddit + ': pullpush HTTP ' + res.status)
        continue
      }
      const data = await res.json()
      const rawPosts = data.data || []
      const posts = rawPosts.map((p: any) => ({ data: p }))"""

content = content.replace(old_fetch, new_fetch)

# Also fix the post data access - pullpush returns flat objects not nested
old_post = "for (const { data: post } of posts) {"
new_post = "for (const { data: post } of posts) { if (!post) continue"
content = content.replace(old_post, new_post)

old_permalink = 'source_url: `https://reddit.com${post.permalink}`,'
new_permalink = 'source_url: `https://reddit.com${post.permalink || \'/r/\' + source.subreddit}`,'
content = content.replace(old_permalink, new_permalink)

old_utc = "published_at: new Date(post.created_utc * 1000).toISOString(),"
new_utc = "published_at: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : new Date().toISOString(),"
content = content.replace(old_utc, new_utc)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK: reddit now uses pullpush.io")
