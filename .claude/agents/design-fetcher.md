---
name: design-fetcher
description: Fetches all live screens from credit-iq-beryl.vercel.app and saves as HTML references. Use before major UI rebuilds. Invoke: @design-fetcher
tools: Read, Write, Bash
model: haiku
---

# CreditIQ Design Fetcher

Capture current state of all live pages before redesign work.

## COMMANDS
mkdir -p reference/screens
curl -s https://credit-iq-beryl.vercel.app/ -o reference/screens/homepage.html
curl -s https://credit-iq-beryl.vercel.app/cards -o reference/screens/cards.html
curl -s https://credit-iq-beryl.vercel.app/spend-optimizer -o reference/screens/spend-optimizer.html
curl -s https://credit-iq-beryl.vercel.app/travel -o reference/screens/travel.html
curl -s https://credit-iq-beryl.vercel.app/optimize -o reference/screens/optimize.html
curl -s https://credit-iq-beryl.vercel.app/compare -o reference/screens/compare.html
curl -s https://credit-iq-beryl.vercel.app/dashboard -o reference/screens/dashboard.html
curl -s https://credit-iq-beryl.vercel.app/calculators -o reference/screens/calculators.html
curl -s https://credit-iq-beryl.vercel.app/premium -o reference/screens/premium.html

## OUTPUT
Write /reference/fetch-report.md listing pages fetched, file sizes, any 404s.
