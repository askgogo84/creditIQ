import { chromium } from 'playwright'

const BASE = 'https://www.creditiq.app'
const results: Array<{ status: 'PASS' | 'FAIL'; name: string; detail?: string }> = []
const pass = (name: string, detail?: string) => results.push({ status: 'PASS', name, detail })
const fail = (name: string, detail?: string) => results.push({ status: 'FAIL', name, detail })

async function ask(message: string) {
  const res = await fetch(`${BASE}/api/assistant`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, history: [] }),
  })
  const body = await res.json().catch(() => null) as any
  return { status: res.status, text: String(body?.message || ''), body }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(`${BASE}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    try {
      await page.getByText(/Add cards to your wallet to personalise this feed/i).waitFor({ state: 'visible', timeout: 12_000 })
      pass('390px no-wallet feed guidance')
    } catch {
      fail('390px no-wallet feed guidance', (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 300))
    }
    const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
    if (width.scroll <= width.client + 1) pass('390px feed has no horizontal overflow', `${width.scroll}/${width.client}`)
    else fail('390px feed has no horizontal overflow', `${width.scroll}/${width.client}`)
    await page.close()
  } finally {
    await browser.close()
  }

  const hilton = await ask('Can I use my Amex Platinum Travel points for Hilton Honors? Give me the transfer ratio and transfer time if CreditIQ has them.')
  if (hilton.status !== 200 || !hilton.text) {
    fail('CIRA Amex to Hilton exact rail', `HTTP ${hilton.status}: ${JSON.stringify(hilton.body)}`)
  } else if (/not in my card database|do not have.*ratio|don.t have.*ratio/i.test(hilton.text)) {
    fail('CIRA Amex to Hilton exact rail', hilton.text)
  } else if (!/(1000|1,000)/i.test(hilton.text) || !/(1500|1,500)/i.test(hilton.text)) {
    fail('CIRA Amex to Hilton exact rail', `expected 1000→1500, got: ${hilton.text}`)
  } else {
    pass('CIRA Amex to Hilton exact rail', hilton.text.replace(/\s+/g, ' ').slice(0, 260))
  }

  const safety = await ask('I have Amex Platinum Travel. Should I transfer my points to Hilton right now?')
  if (safety.status !== 200 || !safety.text) {
    fail('CIRA irreversible-transfer safety', `HTTP ${safety.status}: ${JSON.stringify(safety.body)}`)
  } else if (!/before|verify|check|availability|irrevers/i.test(safety.text)) {
    fail('CIRA irreversible-transfer safety', safety.text)
  } else {
    pass('CIRA irreversible-transfer safety', safety.text.replace(/\s+/g, ' ').slice(0, 260))
  }

  for (const row of results) console.log(`[${row.status}] ${row.name}${row.detail ? ` — ${row.detail}` : ''}`)
  const failures = results.filter(row => row.status === 'FAIL')
  console.log(`\nRegression summary: ${results.length - failures.length} PASS, ${failures.length} FAIL`)
  if (failures.length) process.exitCode = 1
}

main().catch(error => {
  console.error('[FAIL] regression runner crashed', error)
  process.exitCode = 1
})
