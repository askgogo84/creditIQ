import io, os
CONTENT = r"""__BODY__"""
open(r"app/api/cron/ig-fetch-results/route.ts","w",encoding="utf-8").write(CONTENT)
print("wrote ig-fetch-results/route.ts")
