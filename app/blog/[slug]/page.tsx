import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import type { Metadata } from 'next';
import { DesignFooter } from '@/components/design/Footer';

const ARTICLES: Record<string, {
  title: string;
  tag: string;
  tagColor: string;
  date: string;
  readTime: string;
  intro: string;
  sections: { heading: string; body: string }[];
  verdict?: string;
  relatedCard?: string;
  relatedCardSlug?: string;
}> = {

  'hdfc-infinia-review-2026': {
    title: 'HDFC Infinia Review 2026 — Is the ₹12,500 Fee Still Worth It?',
    tag: 'Card Review', tagColor: '#1B3A5C',
    date: 'May 25, 2026', readTime: '8 min read',
    intro: 'HDFC Infinia is India\'s most talked-about premium credit card. It has also been devalued four times in 18 months. We ran the actual numbers so you can decide whether to keep it, downgrade, or finally apply.',
    sections: [
      { heading: 'What you actually get for ₹12,500', body: 'Infinia earns 5 reward points per ₹150 spent (3.33 pts/₹100). Each point is worth ₹0.50 in the product catalogue, ₹1.00 via SmartBuy flights and hotels, or up to ₹2.00+ when transferred to airline partners like Singapore KrisFlyer at 1:1.\n\nOn top of that: unlimited domestic and international airport lounge access via Priority Pass, ₹10,000 welcome benefit, 10X points on SmartBuy, golf at 200+ courses, and 24x7 concierge. The card is metal, invite-only, and has no earning cap on base spends.' },
      { heading: 'The four devaluations — what actually changed', body: 'Between mid-2024 and early 2026, HDFC made four changes:\n\n1. SmartBuy 10X categories reduced — utility payments no longer earn 10X.\n2. Gyftr vouchers capped at 50,000 points per month.\n3. Lounge guest access now costs ₹2,000 per visit (self-access remains unlimited).\n4. From April 2026, Infinia retention requires either ₹18L annual spend OR ₹50L Total Relationship Value with HDFC.\n\nThe reward structure itself — earn rate, transfer ratios, SmartBuy 10X on flights — remains unchanged. The devaluations hurt casual users more than power users.' },
      { heading: 'The maths: who actually profits', body: 'To break even on the ₹12,500 fee at base rate (₹0.50/pt), you need ₹75,000/month in spend. That is a lot.\n\nBut via SmartBuy 10X on flights (effectively ₹3.33 back per ₹100), spending ₹30,000/month on SmartBuy flight bookings earns ₹12,000/year — nearly covering the fee from flights alone.\n\nThe real unlock: 45,000 points transferred to KrisFlyer books DEL-SIN Business Class worth ₹85,000+. To accumulate 45,000 points at base rate, you need ₹2.7L in eligible spend — about 3–4 months for a mid-range user.' },
      { heading: 'Who should keep Infinia', body: '1. Anyone spending ₹5L+ per year on the card, especially travel and dining.\n2. Anyone who flies internationally 2+ times per year and uses airline transfers.\n3. Those who meet the ₹18L spend or ₹50L TRV retention threshold from April 2026.\n4. People with genuine concierge, golf, or unlimited lounge needs.' },
      { heading: 'Who should consider downgrading', body: '1. Spenders under ₹3L/year — fee drag eats too much of your reward.\n2. Anyone who never books via SmartBuy or transfers to airlines.\n3. People who primarily want cashback — SBI Cashback or Axis ACE will serve them better with zero complexity.\n4. Anyone who cannot meet the new ₹18L/₹50L TRV retention bar from April 2026.' },
    ],
    verdict: 'Infinia remains India\'s best premium credit card if you use it right. The airline transfer ecosystem is unmatched. But it is a specialist tool — not an all-rounder. If you are not using SmartBuy or making at least one airline redemption per year, you are overpaying for a metal card.',
    relatedCard: 'HDFC Infinia', relatedCardSlug: 'hdfc-infinia',
  },

  'axis-magnus-vs-hdfc-infinia': {
    title: 'Axis Magnus Burgundy vs HDFC Infinia — The Honest Comparison',
    tag: 'Comparison', tagColor: '#e11d48',
    date: 'May 22, 2026', readTime: '6 min read',
    intro: 'Both cards cost over ₹10,000 per year. Both earn airline miles. Both are invite-only. But they are designed for completely different spending patterns — and choosing the wrong one costs you thousands per year.',
    sections: [
      { heading: 'The fundamental difference', body: 'HDFC Infinia is a general-purpose premium card. It rewards all spend at 3.33 pts/₹100 and significantly rewards SmartBuy spend at 10X — particularly useful for infrequent travellers who prefer redeeming points for flights rather than earning them.\n\nAxis Magnus is a travel earning specialist. Its 12 EDGE Miles per ₹100 on travel aggregators (MakeMyTrip, Yatra, EaseMyTrip) is the highest earn rate on any mainstream Indian credit card. Each EDGE Mile is worth ₹2 when transferred to airlines — making it an effective 24% return on OTA travel bookings.' },
      { heading: 'Fee comparison', body: 'HDFC Infinia: ₹12,500 + GST. Fee waived on ₹10L annual spend.\nAxis Magnus Burgundy: ₹10,000 + GST. Fee waived on ₹15L annual spend.\n\nThe Magnus fee waiver threshold is 50% higher — meaning Magnus is effectively more expensive unless you are spending ₹15L+ per year.' },
      { heading: 'The April 2026 Axis devaluation — what changed', body: 'Axis removed Accor, Marriott Bonvoy, and Qatar Airways as transfer partners overnight on 2 April 2026 without prior notice — violating their own 30-day MITC notification requirement. New partners added (British Airways, Finnair Plus, Vietnam Airlines Lotusmiles) offer lower value than what was removed.\n\nThe surviving strong partners on Magnus: Singapore KrisFlyer (1.33 EDGE Miles = 1 KrisFlyer mile), Turkish Miles&Smiles, Air France-KLM Flying Blue, and Air India. For most Indians targeting KrisFlyer, note that Magnus gives a less favourable ratio than HDFC Infinia\'s 1:1.' },
      { heading: 'When Magnus wins decisively', body: 'Magnus wins clearly when your primary card spend is booking flights and hotels via OTAs. At 12 EDGE Miles/₹100 and ₹2/mile, you get ₹24 back per ₹100 — or 24%. No other mainstream Indian card touches this for OTA-heavy spenders.\n\nIf you spend ₹1.5L/month on travel via MakeMyTrip or Yatra, Magnus earns ₹4.32L per year in EDGE Miles — vastly outperforming Infinia for that specific pattern.' },
      { heading: 'When Infinia wins', body: 'Infinia wins when spend is diversified across dining, shopping, utilities, and entertainment — not primarily OTAs. Its 1:1 KrisFlyer ratio beats Magnus\'s 1.33:1, so Infinia delivers more miles per point when transferring to KrisFlyer specifically.\n\nInfonia\'s SmartBuy 10X for direct flight redemptions also serves infrequent travellers who prefer to redeem for flights rather than transfer to airline programmes.' },
    ],
    verdict: 'Magnus for OTA-heavy travel bookers spending ₹1L+/month on flights and hotels. Infinia for everyone else. If you book ₹1.5L+/month via MakeMyTrip or Yatra, Magnus wins clearly. For mixed spend or KrisFlyer targeting, Infinia\'s simpler structure and better transfer ratio keeps it ahead.',
    relatedCard: 'Axis Magnus', relatedCardSlug: 'axis-magnus',
  },

  'zero-fee-portfolio-beats-premium': {
    title: 'The ₹0 Credit Card Portfolio That Outperforms Magnus',
    tag: 'Strategy', tagColor: '#10b981',
    date: 'May 18, 2026', readTime: '5 min read',
    intro: 'The credit card industry wants you to believe that paying ₹10,000+ annually is the price of good rewards. The data says otherwise — at least for most Indian spenders under ₹6L/year.',
    sections: [
      { heading: 'The three cards', body: 'Amazon Pay ICICI (Lifetime Free)\n5% on Amazon and partner merchants (Swiggy, BookMyShow, Uber). 1% everywhere else. Cashback hits your Amazon Pay balance every cycle — no portals, no activations.\n\nBoB Eterna (Lifetime Free)\n3.75% effective return on all spends via reward points. No category restrictions. Points redeemable for travel vouchers and statement credit.\n\nScapia Federal Bank (Lifetime Free)\nZero forex markup on all international transactions. Points on every foreign currency spend. The only card in this portfolio needed for international use.' },
      { heading: 'How to divide spend', body: 'Amazon and partner merchants → Amazon Pay ICICI (5% back)\nAll other domestic spend → BoB Eterna (3.75% back)\nAll foreign currency / international → Scapia (zero forex + points)\n\nFor ₹50,000/month spend:\n- ₹15,000 on Amazon/partners = ₹750 cashback\n- ₹30,000 domestic other = ₹1,125 cashback\n- ₹5,000 in foreign currency = ₹250 saved on forex\n- Monthly total: ₹2,125 | Annual: ₹25,500 | Fees: ₹0\n- Net value: ₹25,500' },
      { heading: 'How does Axis Magnus compare at the same spend?', body: 'Axis Magnus at ₹50,000/month (no OTA bookings):\n- Base earn: 3.5 EDGE Miles/₹100 = 1,750 EDGE Miles/month\n- At ₹2/mile: ₹3,500/month = ₹42,000/year\n- Annual fee: ₹10,000 + GST = ₹11,800\n- Net value: ₹30,200\n\nMagnus wins — but by only ₹4,700/year. For an invite-only card with a ₹15L fee-waiver threshold, that margin barely justifies the complexity, credit inquiry, and premium positioning.' },
      { heading: 'Where the zero-fee portfolio wins outright', body: 'For spend under ₹3L/year: the zero-fee portfolio wins by ₹8,000–₹15,000 net, because the fee drag represents a larger share of total rewards.\n\nFor purely online spenders (Amazon, Swiggy, subscriptions, OTT): Amazon Pay ICICI\'s 5% beats every premium card\'s online category.\n\nFor anyone who travels internationally occasionally but does not need lounge access: Scapia alone saves 3.5% forex on every international spend.' },
      { heading: 'The honest caveat', body: 'This portfolio has no airport lounge access, no airline transfer programme, and no concierge. If you aim to fly business class using transferred miles, zero-fee cards cannot compete.\n\nThe right choice depends on what you value: pure financial return at lower spend (zero-fee wins) versus premium travel experiences at higher spend (Infinia or Magnus wins).' },
    ],
    verdict: 'For most Indians spending under ₹6L/year with no business class travel ambitions, the zero-fee portfolio delivers more net value. It is not exciting — but the maths is honest. Above ₹6L/year with genuine international travel plans, upgrade to Infinia.',
    relatedCard: 'Amazon Pay ICICI', relatedCardSlug: 'amazon-pay-icici',
  },

  'hdfc-smartbuy-complete-guide': {
    title: 'HDFC SmartBuy 2026 — The Complete Guide to Maximising Your Reward Points',
    tag: 'Guide', tagColor: '#6366f1',
    date: 'May 14, 2026', readTime: '7 min read',
    intro: 'SmartBuy is the most powerful — and most underused — tool in the HDFC rewards ecosystem. Most cardholders let points expire on Amazon vouchers at ₹0.20/pt. SmartBuy can deliver ₹1.00–₹3.00+. Here is how.',
    sections: [
      { heading: 'What SmartBuy actually is', body: 'SmartBuy (smartbuy.hdfcbank.com) is HDFC\'s proprietary rewards portal. It gives HDFC cardholders accelerated reward points on specific spending categories — primarily flights, hotels, and gift vouchers — and lets you redeem points for the same categories at significantly better value than the standard product catalogue.\n\nThe portal launched in 2015 and has been continuously updated. In 2026, it covers flights via MakeMyTrip and Cleartrip, hotel bookings, Apple products, electronics via MyEMIShop, and Gyftr gift cards covering 100+ brands.' },
      { heading: 'The 10X categories — what earns what in 2026', body: 'Hotels: 10X reward points on hotel bookings for Infinia, Diners Black.\nFlights: 5X reward points on flight bookings for most eligible cards.\nGyftr vouchers: 5X for Regalia Gold; varies by card — always check your specific card\'s SmartBuy page.\nApple products: Up to 5X on Apple.com purchases via SmartBuy.\n\nNote: 10X categories for Regalia Gold and lower-tier cards changed in 2026. Diners Club Black now earns only 3X on vouchers vs Regalia Gold\'s 5X. If you hold both, use Regalia Gold for vouchers.' },
      { heading: 'Monthly caps — the limits you must know', body: 'HDFC Infinia: 15,000 bonus reward points per month via SmartBuy (caps out at roughly ₹2.25L in portal spend).\nHDFC Diners Club Black: 7,500 bonus points per month.\nAll other eligible cards: 5,000 bonus points per month.\n\nFor Gyftr/Tanishq vouchers specifically: Infinia capped at 50,000 points per month. No cap on airline transfers.\n\nStrategy: If you hit the monthly cap mid-month, stop booking via SmartBuy for that cycle. Overflow spend earns only base points — the same as booking directly with the airline.' },
      { heading: 'Gyftr vouchers — the best non-travel redemption', body: 'Gyftr on SmartBuy gives approximately ₹0.32 per reward point when used for popular brands — Amazon, Flipkart, Myntra, Nykaa, Swiggy, Zomato, and 100+ others. That is 60% better than the standard catalogue rate of ₹0.20/point.\n\nHow it works: Redeem points → receive digital gift card code → use at checkout on the relevant platform. Delivery is instant by email. No expiry issues since gift cards have their own validity window (typically 12 months).\n\nBest brands to target: Amazon (works on all Amazon categories including groceries), Swiggy (covers food + Instamart), and Myntra (ideal for annual shopping events).' },
      { heading: 'The SmartBuy flight booking strategy', body: 'Booking flights via SmartBuy earns 5X points. But here is the key insight most miss: you can also redeem points for flights on SmartBuy at ₹1.00 per point — and this stacks with the regular earn on whatever portion you pay in cash.\n\nExample:\n- Book ₹20,000 flight on SmartBuy\n- Pay ₹10,000 in points (10,000 points = ₹10,000)\n- Pay ₹10,000 in cash (earns 5X = 3,333 bonus points)\n- Net cost: ₹10,000 cash + 10,000 points, but you earned 3,333 points back\n- Effective point redemption rate: ₹1.00 per point used\n\nCompare this to catalogue: same 10,000 points = ₹2,000 in vouchers. SmartBuy flight redemption is 5x better.' },
      { heading: 'Airline transfers vs SmartBuy — when to use which', body: 'Use SmartBuy for: Domestic flights, hotel bookings, Gyftr vouchers, Apple products. Simple, instant, no waiting for transfers.\n\nUse airline transfers for: International business class, premium cabin awards, high-value long-haul routes. The value extraction is 3–9x better than SmartBuy for these use cases.\n\nNever use: The product catalogue (Amazon vouchers, merchandise). ₹0.20–₹0.25 per point is the worst redemption rate available. Every other SmartBuy option beats it.' },
    ],
    verdict: 'SmartBuy is HDFC\'s most valuable feature — and most cardholders leave 60–80% of its value on the table. Start with Gyftr vouchers for everyday brands. Graduate to flight redemptions at ₹1/pt. Reserve airline transfers for international premium cabin travel. In that order.',
    relatedCard: 'HDFC Infinia', relatedCardSlug: 'hdfc-infinia',
  },

  'credit-card-devaluations-india-2026': {
    title: 'Credit Card Devaluations in India 2026 — Every Change, What to Do Next',
    tag: 'News', tagColor: '#f59e0b',
    date: 'May 10, 2026', readTime: '6 min read',
    intro: '2026 has been the worst year for Indian credit card rewards in a decade. HDFC, Axis, SBI, ICICI, and Amex all cut benefits between January and April. Here is every change that happened and how to respond.',
    sections: [
      { heading: 'Why it happened all at once', body: 'Indian banks collectively devalued rewards programmes in 2026 for three reasons:\n\n1. RBI tightened norms on credit card spending in late 2025, reducing interchange fee income that funds rewards.\n2. Banks are now required to hold higher capital reserves, reducing the budget available for reward programmes.\n3. The loss-leading new-user acquisition phase ended — banks are optimising for profitability over growth.\n\nThe result: a coordinated but unacknowledged industry-wide shift from generous flat rewards to conditional, spend-linked benefit structures.' },
      { heading: 'Axis Bank — the biggest devaluation', body: 'April 2, 2026 — Axis removed three premium transfer partners overnight with no prior notice:\n\nAccor Live Limitless removed: Was valued at ₹2.2 per Accor point — one of the best hotel programme values in India.\nMarriott Bonvoy removed: The most popular hotel programme for Indian travellers.\nQatar Airways Privilege Club removed: Best for Qsuite business class redemptions.\n\nNew partners added (British Airways Avios, Finnair Plus, Vietnam Airlines Lotusmiles) offer materially lower value. Transfer ratios on existing partners also cut — Magnus went from 5:4 to 5:2 on some programmes.\n\nLounge access removed entirely from Airtel Axis Card. Cashback caps restructured to require ₹25,000 in non-Airtel spend to unlock Airtel cashback.' },
      { heading: 'HDFC Bank — retention conditions, earn rate cuts', body: 'April 1, 2026 — HDFC introduced retention conditions for Infinia:\nCardholders must now spend ₹18L/year OR maintain ₹50L Total Relationship Value to continue holding the card. Reward structure unchanged for those who qualify.\n\nMay 15, 2026 — HDFC Regalia Gold earn rate cut:\nFrom 4 points per ₹150 to 5 points per ₹200 — an effective 17% reduction in earn rate.\n\nLounge access: Regalia Gold cardholders must now spend ₹60,000 per quarter to unlock 3 lounge visits. Previously spend-free.\n\nSwiggy HDFC Credit Card: Structurally changed — some categories discontinued. Confirm your specific card\'s current earn rates via HDFC NetBanking.' },
      { heading: 'SBI Card — cashback capped', body: 'April 1, 2026 — SBI Cashback Card:\n5% cashback on online spends capped at ₹2,000 per month (previously ₹5,000).\n1% offline cashback capped at ₹2,000 per month.\nTotal cap: ₹4,000 per statement cycle.\n\nRedemption now only in multiples of 4,000 points — previously any amount.\n\nExcluded categories: Gaming platforms, toll transactions, and government-related payments no longer earn cashback.\n\nImpact: A user spending ₹40,000/month online now earns only ₹2,000 (5% capped) instead of ₹2,000 (was already near the old cap). High-spend users are most affected.' },
      { heading: 'Amex and ICICI changes', body: 'Amex Platinum Travel — milestone benefit threshold raised 75% in early 2026. The annual travel voucher milestone now requires ₹4L+ spend (up from ₹1.9L). Most cardholders will not hit this.\n\nICICI Bank — excluded rent, education fees, and government payments from reward earning on most cards effective March 2026. These categories previously earned base points — now they earn zero.\n\nIDFC FIRST LTF cards — earn rate worsened by 25% on non-merchant-category spends. Lounge visits halved and now require ₹20,000/month minimum spend.' },
      { heading: 'What to do now', body: '1. Audit your current card\'s earn rate. Do not assume it is what you think — check your bank\'s updated MITC or portal.\n\n2. SBI Cashback users: If you spend more than ₹40,000/month online, the card no longer earns incremental rewards above ₹2,000. Consider pairing with Axis ACE for overflow.\n\n3. Axis Magnus users: Remove Accor and Marriott from your transfer strategy. Focus remaining EDGE Miles on KrisFlyer or Turkish Miles&Smiles — the two strongest surviving partners.\n\n4. HDFC Regalia Gold users: If you are not spending ₹60,000/quarter, lounge access has effectively ended. Evaluate whether the card\'s reduced earn rate still justifies the fee.\n\n5. Do not hoard points. Devaluations often hit redemption rates next. Transfer to airline partners when you have a concrete redemption target.' },
    ],
    verdict: 'The era of easy, flat, unconditional rewards is over for most Indian credit cards. The cards that survived 2026 with their core value intact — HDFC Infinia, Axis Magnus on OTA spend, Amazon Pay ICICI — remain the best options. Everything else needs a fresh evaluation.',
    relatedCard: 'HDFC Infinia', relatedCardSlug: 'hdfc-infinia',
  },

  'best-credit-card-international-travel-india': {
    title: 'Best Credit Cards for International Travel from India 2026',
    tag: 'Guide', tagColor: '#0ea5e9',
    date: 'May 5, 2026', readTime: '9 min read',
    intro: 'Three things define a great international travel card: zero (or low) forex markup, airport lounge access, and a reward programme worth using abroad. Most Indian cards fail at least one. Here is who passes all three in 2026.',
    sections: [
      { heading: 'The forex markup problem most Indians ignore', body: 'Most Indian credit cards charge 3–3.5% as a foreign currency transaction fee. On a ₹5L international trip, that is ₹15,000–₹17,500 in hidden fees — paid silently, often confused with exchange rate movement.\n\nZero forex markup cards eliminate this. The difference between 3.5% forex (HDFC Infinia) and 0% forex (Scapia) on ₹5L annual international spend is ₹17,500/year. For many travellers, this single number determines which card to carry abroad.' },
      { heading: 'Best for occasional international travel (1–2 trips/year)', body: 'Scapia Federal Bank (Lifetime Free)\nZero forex markup on all international transactions. Reward points on every foreign spend. Domestic lounge access as milestone benefit. No annual fee.\n\nWho should get it: Anyone who travels internationally even once a year. The forex saving alone justifies the 5-minute application. Pair with your domestic rewards card for local spend.\n\nNiyo SBM Credit Card (₹0 effectively)\nAlso zero forex. Better for ATM withdrawals abroad — useful in cash-heavy destinations like Japan or parts of Southeast Asia. App shows live exchange rates.' },
      { heading: 'Best for 3–5 international trips per year', body: 'HSBC TravelOne Credit Card (₹4,999/year)\n1.5% forex markup — not zero, but low. Instant 1:1 transfer to 18 airline and hotel programmes including Singapore KrisFlyer, British Airways Avios, and Cathay Asia Miles. Good earn rate on all spends. 6 international lounge visits included.\n\nAxis Atlas Credit Card (₹5,000/year)\n3.5% forex markup (not ideal for spending abroad) but extremely strong for earning EDGE Miles on travel bookings. Tiered lounge access that improves as spend grows. Best used for earning before the trip, not spending during it.\n\nHDFC Regalia Gold (₹2,500/year, often waived)\n2% forex markup. 6 international lounge visits. Reliable Priority Pass coverage. Good all-around option after the 2026 earn rate cut — still serviceable for most travellers.' },
      { heading: 'Best for frequent flyers (6+ trips/year)', body: 'HDFC Infinia (₹12,500/year, invite-only)\nUnlimited Priority Pass access for self — no cap, no conditions. 2% forex markup. 10X SmartBuy rewards. 1:1 KrisFlyer transfers. For frequent flyers who need unlimited lounges in every city, Infinia is unmatched in India.\n\nICICI Emeralde Private Metal (₹12,499/year, invite-only)\nUnlimited domestic and international lounge access. Up to 36% value back on hotel bookings via iShop. 3.5% forex markup (negated by the iShop hotel benefit for hotel-heavy travellers).\n\nBOBCard Etihad Guest Premium (₹10,000/year)\nZero forex markup — rare at this tier. 6% value back as Etihad Guest Miles on Etihad flights. 2% on international spends. Unlimited lounge access via Dreamfolks. Best for Indians flying via Abu Dhabi regularly.' },
      { heading: 'The two-card strategy most frequent travellers use', body: 'Card 1 — Scapia Federal Bank: Use for all international spending. Zero forex, reasonable rewards. Free.\n\nCard 2 — HDFC Infinia or Axis Magnus: Use for all domestic earning. Accumulate points/miles before the trip, redeem for business class or hotel stays during it.\n\nThis combination gives you zero forex costs on spending plus the best mile-earning structure for redemptions. Total fee: ₹10,000–₹12,500 for the premium card, ₹0 for Scapia. Total saved on ₹5L annual international spend vs using Infinia abroad: ₹17,500 (forex alone).' },
      { heading: 'What about travel insurance?', body: 'Most premium Indian cards include travel insurance — but the coverage is often inadequate or has strict activation conditions (you must buy the tickets with that card for coverage to apply).\n\nHDFC Infinia: ₹3 crore air accident cover, ₹50L medical evacuation — strong.\nAxis Magnus: ₹1 crore accident cover, reasonable medical coverage.\nHSBC TravelOne: Trip cancellation and delay coverage — more practical for frequent travellers.\n\nFor serious international travel, supplement card insurance with a standalone travel insurance policy for medical coverage. Card insurance rarely covers pre-existing conditions and has complex claim processes.' },
    ],
    verdict: 'For most Indians: Scapia for international spending (zero forex) + HDFC Infinia or Axis Magnus for domestic earning (best miles). If you travel 1–2 times a year with a moderate budget, Scapia alone is enough. If you are a frequent business traveller, the two-card strategy above is optimal.',
    relatedCard: 'HDFC Infinia', relatedCardSlug: 'hdfc-infinia',
  },

  'best-credit-card-dining-swiggy-zomato': {
    title: 'Best Credit Cards for Swiggy, Zomato, and Dining in India 2026',
    tag: 'Guide', tagColor: '#e11d48',
    date: 'April 28, 2026', readTime: '6 min read',
    intro: 'Food delivery is where credit card rewards get genuinely interesting — and genuinely confusing. Cards advertise 4–10% on Swiggy and Zomato, but monthly caps mean your real earn rate depends entirely on how much you order. We calculated actual returns at ₹8,000/month food spend.',
    sections: [
      { heading: 'The cap problem — why advertised rates are misleading', body: 'Every food-delivery reward card has a monthly cap. "10% on Swiggy" sounds incredible — until you discover it caps at ₹1,500/month. That means your 10% rate applies to the first ₹15,000 of Swiggy spend per month. Above that, you earn the standard 1%.\n\nFor the average urban professional ordering 4–5 times per week (₹6,000–₹10,000/month on delivery), the cap is rarely reached. But for heavy orderers or families, the cap is hit quickly — and the "10% card" becomes a 1% card for the overflow spend.' },
      { heading: 'Best for Swiggy-only users', body: 'HDFC Swiggy Credit Card (₹500/year)\n10% cashback on all Swiggy orders — food, Instamart, Dineout, Genie. Cap: ₹1,500/month on Swiggy + ₹1,500/month on other online + ₹500/month elsewhere.\n\nAt ₹8,000/month Swiggy spend: you earn ₹800 back (10% on ₹8,000). Fee: ₹500. Net annual value: ₹9,100. Strong positive return.\n\nCaveat: Zomato orders on this card earn only 1%. If you use both platforms, this is not your card.' },
      { heading: 'Best for Swiggy + Zomato users', body: 'HDFC Millennia Credit Card (₹1,000/year, often waived)\n5% cashback on both Swiggy AND Zomato (plus Amazon, Flipkart, BookMyShow, Uber). Cap: ₹1,000/month shared across all accelerated categories.\n\nAt ₹8,000/month split between Swiggy and Zomato: ₹400 back (5% on ₹8,000 up to the cap). Not as high a rate as the Swiggy card — but covers both platforms and more categories.\n\nHDFC Diners Club Privilege (₹2,500/year)\n5X reward points on Swiggy and Zomato = approx 3.3% return on points redeemed via SmartBuy. Includes complimentary Swiggy One membership on ₹75K spend in first 90 days — worth ₹1,999 standalone.' },
      { heading: 'Best for restaurant dining (not delivery)', body: 'HSBC Live+ Credit Card (₹1,000/year)\nUp to 10% cashback on dining and food delivery combined, via the Live+ Dining Programme. Additional 15% off at partner restaurants. Total potential: 25% value back at partner restaurants.\n\nAxis Bank Dining Delights via EazyDiner: Multiple Axis cards offer 15% off at 10,000+ restaurants across India through EazyDiner. Not delivery — but for restaurant meals, this consistently beats delivery app cashback.\n\nIndusInd EazyDiner Platinum (₹2,500/year)\nDesigned specifically for restaurant dining. Complimentary EazyDiner Prime membership. High earn rate on dining transactions.' },
      { heading: 'The lifetime-free option', body: 'HSBC Cashback Card (Lifetime Free)\n1.5% cashback on all online transactions — including Swiggy, Zomato, and every other platform. No category tracking, no caps to monitor. Plus 3-month Swiggy One membership on activation.\n\nAt ₹8,000/month food delivery: ₹120/month = ₹1,440/year. Not as high as the Swiggy card — but zero fee, zero effort. For someone who wants simplicity over optimisation, this is the default choice.' },
      { heading: 'The honest recommendation matrix', body: 'Swiggy-only, ₹8,000–₹15,000/month: HDFC Swiggy Card (10% capped, best rate)\nSwiggy + Zomato, ₹6,000–₹10,000/month: HDFC Millennia (5% on both, versatile)\nRestaurant dining focus: Axis EazyDiner or HSBC Live+\nNo-fee priority: HSBC Cashback Card (1.5%, no complexity)\nPremium user who eats out frequently: HDFC Diners Privilege (5X + Swiggy One)\n\nStack tip: Bank card offers (HDFC, Axis, ICICI) on Swiggy/Zomato run weekly and stack on top of card rewards. Check your banking app for instant 15–20% offers before every order — they can double your effective return.' },
    ],
    verdict: 'Swiggy-only users should get the HDFC Swiggy Card without hesitation. Mixed Swiggy/Zomato users should default to HDFC Millennia. For restaurant dining rather than delivery, Axis EazyDiner or HSBC Live+ beats everything else. And always check bank offers before ordering — they are often bigger than your card\'s base reward.',
    relatedCard: 'HDFC Diners Privilege', relatedCardSlug: 'hdfc-diners-privilege',
  },

};


export function generateStaticParams() {
  return Object.keys(ARTICLES).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = ARTICLES[params.slug];
  if (!article) return { title: 'Not Found | CreditIQ' };
  return {
    title: `${article.title} | CreditIQ`,
    description: article.intro.substring(0, 160),
    openGraph: { title: article.title, description: article.intro.substring(0, 160) },
  };
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const article = ARTICLES[params.slug];
  if (!article) notFound();

  return (
    <>
      <Header />
      <div className="page-fade">

        {/* Hero */}
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
          <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)', position: 'relative', zIndex: 2 }}>

            <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)', textDecoration: 'none', letterSpacing: '0.05em', marginBottom: 32, fontWeight: 600 }}>
              ← All articles
            </Link>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 14px', borderRadius: 999, background: `${article!.tagColor}18`, border: `1px solid ${article!.tagColor}35`, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: article!.tagColor, fontFamily: 'var(--font-mono,monospace)' }}>
                {article!.tag}
              </span>
              <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>{article!.date} &bull; {article!.readTime}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 24px', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
              {article!.title}
            </h1>

            <div style={{ borderLeft: '3px solid var(--copper-3,#D89B2A)', paddingLeft: 20 }}>
              <p style={{ fontSize: 16, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.8, margin: 0, fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic' }}>
                {article!.intro}
              </p>
            </div>
          </div>
        </section>

        {/* Body */}
        <section style={{ paddingBottom: 80 }}>
          <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {article!.sections.map((section, idx) => (
                <div key={idx} style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 20, padding: 'clamp(20px,3vw,32px)', border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <h2 style={{ fontSize: 'clamp(17px,2vw,21px)', fontWeight: 700, color: 'var(--ink,#142950)', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                    {section.heading}
                  </h2>
                  <div>
                    {section.body.split('\n\n').map((para, i) => (
                      <p key={i} style={{ fontSize: 14.5, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.85, margin: i > 0 ? '14px 0 0' : 0 }}>
                        {para.split('\n').map((line, j, arr) => (
                          <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Verdict */}
            {article!.verdict && (
              <div style={{ marginTop: 24, background: 'var(--ink,#142950)', borderRadius: 20, padding: 'clamp(20px,3vw,32px)', position: 'relative', overflow: 'hidden' }}>
                <div className="aurora" style={{ top: -40, right: -40, width: 250, height: 250, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'var(--copper-3,#D89B2A)', marginBottom: 12 }}>CreditIQ Verdict</div>
                  <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>{article!.verdict}</p>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {article!.relatedCardSlug && (
                <Link href={`/cards/${article!.relatedCardSlug}`} style={{ display: 'inline-block', background: 'var(--copper-3,#D89B2A)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  View {article!.relatedCard} →
                </Link>
              )}
              <Link href="/sweet-spots" style={{ display: 'inline-block', background: 'transparent', border: '1.5px solid var(--ink,#142950)', color: 'var(--ink,#142950)', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Redemption Sweet Spots
              </Link>
            </div>

            {/* More */}
            <div style={{ marginTop: 48 }}>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'var(--ink-3,#5A6A8A)', marginBottom: 14 }}>More articles</div>
              <Link href="/blog" style={{ display: 'block', background: 'var(--paper,#FAF5EB)', borderRadius: 16, padding: 20, border: '1px solid var(--line,rgba(20,41,80,0.08))', textDecoration: 'none' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)' }}>View all articles →</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3,#5A6A8A)' }}>Card reviews, comparisons, and earning strategies</p>
              </Link>
            </div>
          </div>
        </section>

        <DesignFooter />
      </div>
    </>
  );
}
