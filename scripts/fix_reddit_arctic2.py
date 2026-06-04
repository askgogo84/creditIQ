filepath = r'app/api/cron/reddit-scrape/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

old_fetch = """// Use Arctic Shift API — works from Vercel, updated through Apr 2026
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString().split('T')[0]
      const res = await fetch(
        `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=${source.subreddit}&after=${since}&limit=15&sort=score`,
        { headers: { 'User-Agent': 'CreditIQ/1.0 (creditiq.app)' } }
      )"""

new_fetch = """// Use Arctic Shift API — correct params: after=YYYY-MM-DD, sort=desc (by date)
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString().split('T')[0]
      const res = await fetch(
        `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=${source.subreddit}&after=${since}&limit=15&sort=desc`,
        { headers: { 'User-Agent': 'CreditIQ/1.0 (creditiq.app)' } }
      )"""

content = content.replace(old_fetch, new_fetch)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("OK: arctic shift params fixed - sort=desc, correct date format")
