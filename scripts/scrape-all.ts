// Run a full scrape locally for testing.
// Usage: npx tsx scripts/scrape-all.ts [bank-name]

import { runScrapers } from '../lib/scrapers';
import { parseScrapedCard } from '../lib/scrapers/parser';
import { writeFileSync } from 'fs';

async function main() {
  const bank = process.argv[2];
  const banks = bank ? [bank] : undefined;

  console.log(`Running scrapers${banks ? ` for ${banks.join(', ')}` : ' (all banks)'}...`);

  const results = await runScrapers(banks);
  console.log(`Scraped ${results.length} pages`);

  // Save raw results
  writeFileSync(
    `./scrape-output-raw-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(results, null, 2)
  );

  // Parse with Claude
  const parsed: any[] = [];
  for (const r of results) {
    console.log(`Parsing: ${r.url}`);
    const card = await parseScrapedCard(r);
    if (card) parsed.push(card);
  }

  writeFileSync(
    `./scrape-output-parsed-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(parsed, null, 2)
  );

  console.log(`\n(ok) Parsed ${parsed.length} cards. Output saved.`);
}

main().catch(console.error);
