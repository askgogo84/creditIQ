import Anthropic from '@anthropic-ai/sdk';
import type { CreditCard } from '../types';
import type { ScrapeResult } from './index';

/**
 * Use Claude to parse raw scraped HTML into structured CreditCard JSON.
 * This is the "magic" that lets us add a new bank by just adding a URL.
 */
export async function parseScrapedCard(scrape: ScrapeResult): Promise<Partial<CreditCard> | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — skipping parse');
    return null;
  }
  if (scrape.error || !scrape.html) return null;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a credit card data extraction assistant. Given the raw text from a bank's credit card webpage, extract structured data.

Bank: ${scrape.bank}
URL: ${scrape.url}

Raw page content (first 20000 chars):
${scrape.html.slice(0, 20000)}

Extract and return ONLY a valid JSON object matching this exact schema (no markdown, no explanation, JSON ONLY):

{
  "name": "Full card name as marketed",
  "slug": "kebab-case-slug",
  "bank": "${scrape.bank}",
  "category": ["cashback" | "travel" | "rewards" | "premium" | "shopping" | "dining" | "fuel" | "lifestyle" | "zero-fee" | "entry-level"],
  "tier": "entry" | "mid" | "premium" | "super-premium",
  "joining_fee_inr": <number, 0 if free>,
  "annual_fee_inr": <number, 0 if free>,
  "fee_waiver_spend_inr": <number or null>,
  "min_income_inr_monthly": <number or null>,
  "reward_currency": "cashback" | "points" | "miles" | "neucoins" | "edge" | "reward-points",
  "base_reward_rate": <percent equivalent as decimal>,
  "category_rewards": [
    { "category": "online" | "dining" | "fuel" | "grocery" | "travel" | "utility", "rate": <number>, "unit": "percent" | "multiplier", "cap_inr_monthly": <number or null> }
  ],
  "welcome_benefit_inr": <number or null>,
  "lounges": [
    { "type": "domestic" | "international", "visits_per_year": <number or null>, "network": "priority-pass" | "dreamfolks" | "visa-airport" | "bank-direct" }
  ],
  "forex_markup_percent": <number or null>,
  "highlights": [<top 3-5 key benefits as strings>],
  "best_for": "<one-sentence ideal user>"
}

If you cannot determine a field with confidence, use null. Do not invent data.`;

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    // Strip markdown fences if present
    const clean = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(clean);
    return {
      ...parsed,
      id: parsed.slug,
      active: true,
      last_verified: new Date().toISOString().slice(0, 10),
      data_source: 'scraped' as const,
      apply_url: scrape.url,
      color: parsed.color ?? '#1a1a1a',
      expert_rating: parsed.expert_rating ?? 7.0,
      redemption_options: parsed.redemption_options ?? [],
    };
  } catch (e: any) {
    console.error('Parse failed:', e.message);
    return null;
  }
}
