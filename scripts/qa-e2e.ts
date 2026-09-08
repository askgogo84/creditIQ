import { chromium, type BrowserContext, type Page } from 'playwright'
import fs from 'node:fs'

const BASE = (process.env.QA_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const STORAGE_STATE = process.env.PLAYWRIGHT_STORAGE_STATE || ''
const REQUIRE_AUTH = process.env.QA_REQUIRE_AUTH === '1'

const viewports = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'desktop', width: 1440, height: 900 },
]

type Outcome = { status: 'PASS' | 'FAIL' | 'BLOCKED'; name: string; detail?: string }
const outcomes: Outcome[] = []

function pass(name: string, detail?: string) { outcomes.push({ status: 'PASS', name, detail }) }
function fail(name: string, detail?: string) { outcomes.push({ status: 'FAIL', name, detail }) }
function blocked(name: string, detail?: string) { outcomes.push({ status: 'BLOCKED', name, detail }) }

async function noDocumentOverflow(page: Page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
}

async function checkOverflow(page: Page, name: string) {
  const size = await noDocumentOverflow(page)
  if (size.scrollWidth <= size.clientWidth + 1) pass(name, `${size.scrollWidth}/${size.clientWidth}`)
  else fail(name, `document scrollWidth ${size.scrollWidth}px > clientWidth ${size.clientWidth}px`)
}

async function publicChecks(context: BrowserContext, viewportName: string) {
  const page = await context.newPage()
  try {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    if ((viewport || '').includes('width=device-width')) pass(`${viewportName}: viewport meta`)
    else fail(`${viewportName}: viewport meta`, viewport || 'missing')
    await checkOverflow(page, `${viewportName}: home horizontal overflow`)

    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await checkOverflow(page, `${viewportName}: login horizontal overflow`)

    await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    if (/\/login(?:\?|$)/.test(new URL(page.url()).pathname + new URL(page.url()).search)) {
      pass(`${viewportName}: /travel auth redirect`)
    } else {
      fail(`${viewportName}: /travel auth redirect`, `ended at ${page.url()}`)
    }
  } finally {
    await page.close()
  }
}

async function apiChecks() {
  const anonymousProtected = [
    `${BASE}/api/travel/redemption-rails?travelKind=flight&programmeId=air-india-maharaja`,
    `${BASE}/api/travel/wallet`,
    `${BASE}/api/travel/providers`,
  ]
  for (const url of anonymousProtected) {
    try {
      const res = await fetch(url, { redirect: 'manual' })
      const path = new URL(url).pathname
      if (res.status === 401 || res.status === 403) pass(`API auth: ${path}`, String(res.status))
      else fail(`API auth: ${path}`, `expected 401/403, got ${res.status}`)
    } catch (error) {
      fail(`API auth: ${new URL(url).pathname}`, String(error))
    }
  }

  const future = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10)
  for (const cabin of ['economy', 'business'] as const) {
    const url = `${BASE}/api/flights/search?from=BLR&to=SIN&date_from=${future}&date_to=${future}&cabin=${cabin}`
    try {
      const res = await fetch(url)
      const body = await res.json().catch(() => null) as any
      if (!res.ok || !body) {
        fail(`flight provider chain: ${cabin}`, `HTTP ${res.status}`)
        continue
      }
      if (!Array.isArray(body.attempts)) {
        fail(`flight provider chain: ${cabin}`, 'attempt provenance missing')
        continue
      }
      if (body.source === 'travelpayouts-v3' && cabin !== 'economy' && body.cashCabinVerified !== false) {
        fail(`flight provider safety: ${cabin}`, 'cached non-cabin fare was marked verified')
        continue
      }
      if (body.source === 'none' && body.coverage?.mode !== 'UNAVAILABLE') {
        fail(`flight provider safety: ${cabin}`, 'empty result did not use UNAVAILABLE')
        continue
      }
      if (['skyscanner-live', 'amadeus', 'kiwi-mcp', 'kiwi'].includes(body.source) && body.cashCabinVerified !== true) {
        fail(`flight provider safety: ${cabin}`, `${body.source} live result not marked cabin-verified`)
        continue
      }
      pass(`flight provider chain: ${cabin}`, `${body.source}/${body.coverage?.mode || 'unknown'}`)
    } catch (error) {
      fail(`flight provider chain: ${cabin}`, String(error))
    }
  }
}

async function authenticatedChecks(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  if (!STORAGE_STATE || !fs.existsSync(STORAGE_STATE)) {
    const detail = 'PLAYWRIGHT_STORAGE_STATE not provided'
    if (REQUIRE_AUTH) fail('authenticated mobile QA', detail)
    else blocked('authenticated mobile QA', detail)
    return
  }

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, storageState: STORAGE_STATE })
    const page = await context.newPage()
    try {
      for (const route of ['/travel', '/wallet', '/hotels', '/concierge']) {
        await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
        if (/\/login(?:\?|$)/.test(new URL(page.url()).pathname + new URL(page.url()).search)) {
          fail(`${vp.name}: authenticated ${route}`, 'storage state was not accepted')
          continue
        }
        await checkOverflow(page, `${vp.name}: authenticated ${route} overflow`)
      }

      await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      const mobileDeck = page.locator('.ciq-st-mobile .ciq-st-deck')
      if (vp.width < 768) {
        if (await mobileDeck.count()) {
          const box = await mobileDeck.first().boundingBox()
          if (box && box.x >= -1 && box.x + box.width <= vp.width + 1) pass(`${vp.name}: section tabs fit viewport`)
          else fail(`${vp.name}: section tabs fit viewport`, box ? JSON.stringify(box) : 'not visible')
        } else {
          fail(`${vp.name}: section tabs fit viewport`, 'mobile section deck missing')
        }
      }
    } finally {
      await context.close()
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
      await publicChecks(context, vp.name)
      await context.close()
    }
    await apiChecks()
    await authenticatedChecks(browser)
  } finally {
    await browser.close()
  }

  for (const item of outcomes) {
    console.log(`[${item.status}] ${item.name}${item.detail ? ` — ${item.detail}` : ''}`)
  }
  const failed = outcomes.filter(item => item.status === 'FAIL')
  const blockedCount = outcomes.filter(item => item.status === 'BLOCKED').length
  console.log(`\nQA summary: ${outcomes.length - failed.length - blockedCount} PASS, ${failed.length} FAIL, ${blockedCount} BLOCKED`)
  if (failed.length) process.exitCode = 1
}

main().catch(error => {
  console.error('[FAIL] QA runner crashed', error)
  process.exitCode = 1
})
