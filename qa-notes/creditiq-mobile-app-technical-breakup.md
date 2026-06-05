# CreditIQ Mobile App: Product, UX, and Technical Breakup

Prepared from:
- SaveSage reference screenshots shared on June 4, 2026.
- CreditIQ technical documentation: `C:\Users\gover\Downloads\creditiq_technical_doc.html`.
- Current CreditIQ web repo at `C:\Users\gover\creditIQ\creditIQ`.
- Current Google Play and Google API policy references listed at the end.

## 1. Product North Star

CreditIQ should not be positioned as "another rewards tracker." It should be the user's personal credit operating system:

> One app to choose the right card, use the right card, track what every card owes you, catch devaluations early, redeem points intelligently, and improve credit decisions without affiliate bias.

The strongest differentiation is not UI alone. CreditIQ already has the data and intelligence layer SaveSage does not have:

- Community intelligence from Instagram, YouTube, and Reddit.
- Devaluation detection.
- CIRA AI assistant with pgvector context.
- Card Roast with A-F card grading.
- Rewards calculator and spend optimizer.
- Trip planner with live award-seat intelligence.
- Statement Truth for hidden charges and missed rewards.
- Zero affiliate bias positioning.

The mobile app should make these strengths visible in daily use.

## 2. Competitor UX Audit: What SaveSage Does Well

SaveSage has several useful mobile patterns:

- Simple phone OTP onboarding.
- Quick segmentation: "I have credit cards" vs "I use UPI/debit cards."
- Clear bottom navigation: Home, Cards, Scan & Save, Loyalty, Consult.
- Strong mobile-first dark UI for the main app.
- Manual card addition with bank/card type/last 4 digits/points.
- Card-level reward value and redemption options.
- Loyalty program tabs for flights, hotels, and brands.
- Permission nudges for email, SMS, biometrics, and alerts.
- Referral and subscription flows.
- Expert consultation as a premium support layer.

## 3. Competitor UX Gaps CreditIQ Can Beat

The screenshots show friction and trust gaps CreditIQ can solve:

- Too many permission asks before durable value is shown.
- Gmail permission flow feels scary because it asks for broad email access.
- SMS tracking is pushed as a generic permission, not as a controlled benefit.
- Plan/payment appears early and can feel like a paywall before proof.
- Empty states are common and not always useful.
- Action-required cards stack up without a clear completion story.
- Reward values are shown, but the "why" and "best next action" are weak.
- AI assistant is presented as a mascot, but not deeply integrated into each workflow.
- UI mixes dark and light screens without a clearly intentional system.
- "Consult" is isolated instead of being available contextually when a user is stuck.

CreditIQ should win by being more transparent, calmer, and more actionable.

## 4. Proposed App Information Architecture

Use five bottom tabs. Keep the app focused. Everything else can live behind cards, sheets, or profile.

### Tab 1: Home

Purpose: daily command center.

Key sections:
- Net value unlocked this year.
- Action center: bills due, devaluation alerts, expiring points, missing data.
- "Best card to use today" based on wallet, merchant, offers, and spend category.
- CIRA insight card: one high-value recommendation per day.
- Community intelligence feed preview.
- Quick actions: Scan receipt, Add card, Upload statement, Ask CIRA.

### Tab 2: Cards

Purpose: manage the user's card stack.

Key sections:
- Total points value across cards.
- Due amount and bill reminder state.
- Unbilled spend, if permitted.
- Individual card cards with reward value, renewal fee, benefits used, benefits remaining.
- Card health grade: A-F using Card Roast.
- Best redemption options by card.
- Card actions: edit points, bill cycle, charges, support, remove card.

### Tab 3: Scan & Save

Purpose: "which card should I use for this purchase?"

Input modes:
- Merchant search.
- QR/receipt scan.
- Manual category and amount.
- Online offer search.

Output:
- Best card in wallet.
- Expected reward value.
- Better card recommendation if user lacks the best card.
- Live offers.
- Reasoning in one sentence.

This is the daily habit loop and should be a major differentiator.

### Tab 4: Travel & Rewards

Purpose: convert points into maximum value.

Key sections:
- Airline, hotel, brand voucher, cashback, catalogue products, travel booking.
- Transfer partners by card.
- Award seat availability.
- Expiring miles/points.
- Trip planner.
- "Best redemption today" sorted by INR value per point.

This should merge SaveSage's loyalty screen with CreditIQ's stronger travel AI and seats.aero intelligence.

### Tab 5: CIRA

Purpose: always-available expert layer.

Modes:
- Ask anything.
- Roast my card.
- Optimize my card stack.
- Read my statement.
- Plan a trip with points.
- Explain a bank change.
- Find a card for me.

Keep expert human consultation behind CIRA: "Need a human review?" after the AI produces a useful answer.

## 5. Recommended Onboarding Flow

The app should use progressive trust. Do not ask for Gmail/SMS access on screen one.

### Step 1: Phone Login

- OTP via SMS Retriever API where possible.
- Minimal copy: "Create your CreditIQ account."
- Show privacy claim in plain language: "No card numbers. No bank passwords."

### Step 2: Intent Selection

Ask: "What do you want CreditIQ to help with first?"

Options:
- Use my current cards better.
- Find my first/better credit card.
- Track points, bills, and offers.
- Plan travel with points.

### Step 3: Value Preview

Show a personalized preview before permissions:
- "Add one card and we can show devaluation alerts, best redemption value, and bill reminders."
- CTA: Add my first card.

### Step 4: Add Card

Three paths:
- Manual card selection.
- Statement upload.
- Email connection, optional.

Manual should be first and strong, because it is the lowest-trust path.

### Step 5: Optional Permissions

Ask only when relevant:
- Push alerts after the user has a card and understands devaluation/bill alerts.
- Email access only for statement auto-detection.
- SMS access only for Android users who want transaction tracking, with a policy-safe fallback.
- Biometric after account exists.

### Step 6: First Useful Result

The user should reach one "aha" moment within 90 seconds:
- "Your Regalia Gold points are worth up to INR 60.5K if transferred to hotel partners."
- "Your card is strong for travel but weak for Amazon spends."
- "You have 3 devaluation alerts relevant to HDFC cards."

## 6. Visual Design Direction

CreditIQ should feel premium, trustworthy, and data-rich, not like a clone.

### Design Personality

- Premium fintech.
- Editorial intelligence.
- Calm command center.
- Transparent math.
- No cartoon-heavy mascot dependency.

### Palette

Use CreditIQ's current brand direction:
- Deep navy/obsidian for primary app shell.
- Copper/gold for value, points, premium actions.
- Emerald for savings, success, and unlocked value.
- Crimson for devaluation, overdue bills, and risk.
- Light surfaces for forms, support, disclosures, and heavy reading.

Avoid a one-note dark-blue app. Use light screens intentionally for compliance, forms, payment, and detail reading.

### Typography

Use a native-friendly system:
- Display: Syne or Fraunces only for brand moments and hero numbers.
- Body/UI: Inter or Geist Sans.
- Numbers: tabular figures for INR, points, due dates, and ratios.

### Component System

Core components:
- Credit card visual.
- IQ insight card.
- Action required card.
- Reward value meter.
- Card health grade badge.
- Devaluation alert chip.
- Transfer partner card.
- Merchant offer row.
- Bottom sheet action menu.
- Permission explainer sheet.
- Empty-state panel with one clear action.

Rules:
- 44px minimum touch targets.
- One primary CTA per screen.
- Persistent bottom nav.
- No hidden critical actions behind icon-only controls.
- Every permission screen must show "what we read", "what we never read", and "how to revoke."

## 7. Feature Modules

### 7.1 Home Command Center

Data required:
- User cards.
- Points balances.
- Alerts.
- Bills.
- Recent intelligence.
- Recommended action.

Main API:
- `GET /api/mobile/dashboard`

Response shape:
```ts
type MobileDashboard = {
  user: { id: string; name?: string; avatarUrl?: string };
  totals: {
    pointsValueInr: number;
    rewardPoints: number;
    savingsUnlockedInr: number;
    dueInr: number;
  };
  actions: ActionItem[];
  dailyInsight: CiraInsight;
  cards: MobileCardSummary[];
  feed: IntelligenceItem[];
};
```

### 7.2 My Cards

Existing foundation:
- `GET/POST /api/user-cards`
- `POST /api/update-points`
- `GET /api/alerts`
- `POST /api/card-roast`
- `POST /api/claude/redemption`

New tables:
- `user_card_bill_cycles`
- `user_card_benefit_usage`
- `user_card_point_balances`
- `user_card_alert_preferences`

Must-have UX:
- Add card manually.
- Add card from statement.
- Edit points.
- Enter bill cycle.
- Enable card-specific alerts.
- Show card grade.
- Show best redemption path.

### 7.3 Scan & Save

User story:
"I am about to pay. Tell me which card to use."

Inputs:
- Merchant.
- Amount.
- Category.
- User wallet.
- Live offers.
- Bank offer catalogue.

New API:
- `POST /api/scan-and-save`

Response:
```ts
type ScanAndSaveResult = {
  bestOwnedCard: {
    cardId: string;
    cardName: string;
    estimatedRewardInr: number;
    reason: string;
  };
  betterUnownedCard?: {
    cardId: string;
    cardName: string;
    estimatedRewardInr: number;
    annualUpsideInr: number;
  };
  offers: Offer[];
  confidence: "high" | "medium" | "low";
};
```

### 7.4 Rewards Wallet

Purpose:
Show points as money, not abstract balances.

Core views:
- By card.
- By redemption path.
- By expiry.
- By upcoming trip.

New tables:
- `reward_programs`
- `user_reward_accounts`
- `reward_transfer_partners`
- `reward_redemption_options`
- `reward_expiry_events`

### 7.5 Statement Truth

Existing foundation:
- `POST /api/parse-statement`
- `POST /api/statement-truth`

Mobile flow:
- Upload PDF.
- Parse spend categories.
- Detect fees, missed points, interest, GST, reward reversal, over-limit, forex markup.
- Generate dispute/support checklist.

Key UX:
- "We found 3 things to check" is better than a raw parsed statement.
- Keep sensitive document deletion controls visible.

### 7.6 CIRA Assistant

Existing foundation:
- `POST /api/assistant`
- Supabase `intelligence_kb`
- `match_intelligence()` pgvector RPC

Mobile CIRA should support tool-like actions:
- Add result to action center.
- Compare cards.
- Open card.
- Save insight.
- Set alert.
- Start application.
- Ask a human.

### 7.7 Credit Score and Credit Usage

Goal:
Make "one app for all credit usage" credible beyond rewards.

Features:
- Credit score display via partner API.
- Score simulator.
- Utilization tracker.
- Statement due calendar.
- EMI and loan visibility if user opts in.
- Card limit tracking.
- Risk warnings: high utilization, overdue due date, annual fee not justified.

Existing foundation:
- `/approval-odds`
- `/credit-score-simulator`
- `/credit-simulator`

Potential new API:
- `GET /api/credit-score`
- `POST /api/credit-usage/simulate`

### 7.8 Live Offers

Purpose:
Show bank and merchant offers by card, merchant, category, and expiry.

New tables:
- `offers`
- `offer_cards`
- `offer_merchants`
- `offer_categories`
- `user_offer_saves`

UX:
- Search offers.
- Filter by owned cards.
- Expiring soon.
- Best offer for a merchant.
- Offer explanation in plain English.

### 7.9 Consult

SaveSage has consult as a tab. CreditIQ can make it more useful:

- AI first, human second.
- Human consultation is contextual: card stack review, travel redemption review, credit score review.
- Expert sessions can be scheduled from unresolved CIRA conversations.

New tables:
- `consultation_queries`
- `consultation_sessions`
- `expert_profiles`
- `session_slots`

## 8. Technical Architecture

### Recommended Mobile Stack

Use React Native with Expo for speed and shared TypeScript thinking:

- Expo SDK.
- Expo Router.
- TypeScript.
- Zustand for lightweight local UI state, matching existing web dependency.
- TanStack Query or SWR for API caching.
- Supabase Auth client.
- NativeWind or a small custom token system mapped from Tailwind.
- EAS Build and EAS Submit.
- Sentry for crash/error monitoring.
- FCM/APNs for push notifications.

Why not only PWA:
- SMS, biometrics, native push, and app-store distribution need native affordances.
- PWA can be M1/M2 bridge, but app launch should be React Native.

### Backend Strategy

Keep Next.js APIs as the primary backend initially.

Current useful APIs:
- `/api/assistant`
- `/api/card-roast`
- `/api/trip-planner`
- `/api/claude/redemption`
- `/api/optimize`
- `/api/points-optimizer`
- `/api/spend-optimizer`
- `/api/travel-ai`
- `/api/parse-statement`
- `/api/statement-truth`
- `/api/sms-parse`
- `/api/cards`
- `/api/cards/[slug]`
- `/api/rewards-calculator`
- `/api/card-switch`
- `/api/user-cards`
- `/api/ratings`
- `/api/flights`
- `/api/seats-aero`
- `/api/ticker`
- `/api/alerts`

Add mobile aggregation routes so the app does not make 10 calls per screen:
- `GET /api/mobile/dashboard`
- `GET /api/mobile/cards`
- `GET /api/mobile/card/:id`
- `GET /api/mobile/rewards`
- `GET /api/mobile/action-center`
- `POST /api/mobile/onboarding/complete`

### Database Additions

Suggested Supabase tables:

```sql
user_profiles
user_cards
user_card_point_balances
user_card_bill_cycles
user_card_benefit_usage
user_card_alert_preferences
mobile_devices
push_notifications
notification_events
sms_transactions
statement_uploads
statement_findings
reward_programs
user_reward_accounts
reward_transfer_partners
reward_redemption_options
reward_expiry_events
offers
offer_cards
offer_merchants
offer_categories
user_offer_saves
consultation_queries
consultation_sessions
expert_profiles
referrals
wallet_ledger
```

### Data Security

Must-have:
- Row-level security on all user-owned tables.
- Never store full card numbers.
- Store last 4 digits only.
- Encrypt sensitive statement metadata.
- Short-lived signed URLs for statement uploads.
- Auto-delete uploaded PDFs after processing unless user explicitly chooses storage.
- Clear audit trail for permissions and data deletion.
- App-level privacy center.

## 9. Permission and Compliance Plan

### SMS Tracking

Important: Android SMS permissions are high-risk and restricted by Google Play. Google says apps that do not qualify must remove SMS permissions from the manifest, and SMS/Call Log access is generally limited to permitted uses such as default SMS/Phone/Assistant handlers or approved exceptions.

Recommendation:
- Do not make full `READ_SMS` a launch blocker.
- Launch with manual card/points, statement upload, email connection, and push alerts.
- Keep SMS tracking as Android-only beta behind a strict consent screen.
- Prepare a Play Console permissions declaration only if CreditIQ can justify SMS as critical core functionality.
- Provide fallback import through statement PDF and email parsing.

### Gmail/Email Linking

Gmail read access is a restricted scope if it reads message bodies, metadata, headers, or attachments. It requires transparent disclosure, minimum scopes, user deletion controls, and possibly restricted scope verification/security assessment.

Recommendation:
- Make Gmail optional.
- Use the narrowest feasible Gmail query pattern.
- Show a pre-OAuth CreditIQ explainer before Google's permission screen.
- Do not ask for ongoing access unless truly needed.
- Provide "disconnect and delete synced data" in Privacy Center.

### Push Notifications

Ask only after value is clear:
- Devaluation alerts.
- Bill due reminders.
- Expiring points.
- Offer expiry.
- Statement anomaly found.

### Biometrics

Ask after the account is created:
- "Use Face ID/fingerprint to open CreditIQ faster."
- Do not present biometrics as a substitute for data privacy.

## 10. Build Phases

### Phase 0: Design System and Prototype

Deliverables:
- Mobile design tokens.
- Navigation prototype.
- Onboarding prototype.
- Home, Cards, Card Detail, Scan & Save, Rewards, CIRA screens.
- Permission explainer templates.

### Phase 1: MVP App

Scope:
- Phone login.
- Manual card add.
- Home dashboard.
- My Cards.
- Points edit.
- Devaluation alerts.
- CIRA.
- Card Roast.
- Statement upload.
- Push notification registration.

This beats SaveSage on intelligence and trust even before SMS/Gmail automation.

### Phase 2: Daily Habit Loop

Scope:
- Scan & Save.
- Live offers.
- Best card for merchant/category.
- Bill cycle reminders.
- Reward value dashboard.
- Action center.

### Phase 3: Rewards and Travel

Scope:
- Loyalty program balances.
- Transfer partner comparison.
- Trip planner.
- Award seats.
- Redemption tutorials.
- Expiry alerts.

### Phase 4: Automation

Scope:
- Gmail statement detection, subject to verification.
- Android SMS beta, subject to Play policy approval.
- Statement auto-import.
- Merchant spend categorization.

### Phase 5: Monetization

Scope:
- Premium plan.
- Expert review.
- Gift cards/offers.
- Card application revenue.
- B2B bank intelligence API.

## 11. MVP Screen List

Build these first:

1. Splash and trust screen.
2. OTP login.
3. Intent selection.
4. Add card manually.
5. Card selector.
6. Points entry.
7. Home dashboard.
8. Action center.
9. Cards list.
10. Card detail.
11. Card redemption options.
12. Card Roast result.
13. Statement upload.
14. Statement Truth result.
15. Scan & Save input.
16. Scan & Save result.
17. CIRA chat.
18. Rewards/Travel overview.
19. Notifications opt-in.
20. Privacy center.

## 12. User-Friendly Improvements Over SaveSage

CreditIQ should:

- Show value before asking for sensitive access.
- Make manual entry first-class, not a fallback.
- Use "Action Center" as a clear checklist with completion states.
- Explain every recommendation with transparent math.
- Add "why this matters" under devaluation and redemption alerts.
- Keep CIRA available on every screen as contextual help.
- Use fewer empty states and more suggested actions.
- Use privacy-first copy: no card numbers, no bank passwords, revoke anytime.
- Treat annual fees, bill cycles, utilization, and rewards together.
- Show "best next action" instead of only dashboards.

## 13. Success Metrics

Activation:
- OTP completion rate.
- First card added.
- First useful insight shown within 90 seconds.
- Permission opt-in rate after value preview.

Retention:
- Weekly active users.
- Scan & Save usage.
- CIRA usage.
- Alert open rate.
- Cards with updated points/bill cycles.

Monetization:
- Premium conversion.
- Expert session bookings.
- Card application conversion.
- Gift card/order revenue.

Trust:
- Gmail/SMS disconnect rate.
- Data deletion requests.
- Support tickets about privacy.
- App store reviews mentioning trust.

## 14. Policy References

- Google Play SMS/Call Log permissions policy: https://support.google.com/googleplay/android-developer/answer/10208820
- Google Play Developer Programme Policy, sensitive permissions: https://support.google.com/googleplay/android-developer/answer/16549787
- Google API Services User Data Policy: https://developers.google.com/terms/api-services-user-data-policy
- Google Workspace/Gmail API user data policy: https://developers.google.com/gmail/api/policy
- Gmail API scopes: https://developers.google.com/workspace/gmail/api/auth/scopes

