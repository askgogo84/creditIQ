filepath = r'app/api/cron/reddit-scrape/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

old_fetch = """// Reddit blocks Vercel IPs — use Pullpush.io (community Pushshift)
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

new_fetch = """// Use Arctic Shift API — works from Vercel, updated through Apr 2026
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString().split('T')[0]
      const res = await fetch(
        `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=${source.subreddit}&after=${since}&limit=15&sort=score`,
        { headers: { 'User-Agent': 'CreditIQ/1.0 (creditiq.app)' } }
      )
      if (!res.ok) {
        errors.push(source.subreddit + ': arctic HTTP ' + res.status)
        continue
      }
      const data = await res.json()
      const rawPosts = data.data || []
      const posts = rawPosts.map((p: any) => ({ data: p }))"""

content = content.replace(old_fetch, new_fetch)

# Fix post field names - Arctic Shift uses same field names as Reddit API
old_score = "if (!post.title) continue"
new_score = "if (!post?.title) continue"
content = content.replace(old_score, new_score)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK: reddit now uses Arctic Shift API")
