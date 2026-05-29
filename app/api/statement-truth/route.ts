import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { base64Pdf, cardName } = await req.json()

    if (!base64Pdf) {
      return NextResponse.json({ error: 'No PDF provided' }, { status: 400 })
    }

    // Step 1: Extract statement data from PDF using Claude's vision
    const extractResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf,
              }
            },
            {
              type: 'text',
              text: `Read this credit card statement PDF carefully and extract all data.

Extract EXACTLY:
1. Cardholder name
2. Card number (last 4 digits)
3. Card type/name (e.g. HDFC Infinia, Axis Magnus)
4. Bank name
5. Statement period (billing period dates)
6. Total amount due
7. Previous statement dues
8. Payments/credits received
9. Total purchases/debit this cycle
10. Finance charges
11. Credit limit
12. Available credit limit
13. Every transaction: date, description, rewards points earned (the + number), amount in rupees, category (PI column)
14. Total reward points earned this month (sum all + numbers)
15. Spending breakdown by category (Travel %, Retail %, Groceries %, etc from Purchase Insights section if shown)

Respond ONLY with valid JSON, no markdown:
{
  "cardholderName": "MUKESH PURSHOTTAM CHAMEDIA",
  "cardLastFour": "5867",
  "cardName": "HDFC Infinia Credit Card",
  "bank": "HDFC Bank",
  "statementPeriod": "20 Apr 2026 - 19 May 2026",
  "totalAmountDue": 399803,
  "previousDues": 240138.62,
  "paymentsReceived": 0,
  "totalPurchases": 150460.85,
  "financeCharges": 9203.20,
  "creditLimit": 800000,
  "availableCredit": 388881,
  "totalRewardsEarned": 3565,
  "minimumDue": 32010,
  "transactions": [
    {
      "date": "19/04/2026",
      "description": "INSTAMART BANGALORE",
      "rewardsEarned": 0,
      "amount": 448,
      "category": "GROCERIES"
    }
  ],
  "categoryBreakdown": [
    { "category": "TRAVEL", "percentage": 43 },
    { "category": "GENERAL RETAIL GOODS", "percentage": 26 },
    { "category": "GROCERIES", "percentage": 15 },
    { "category": "TELECOM & CABLE", "percentage": 9 },
    { "category": "MISC", "percentage": 7 }
  ],
  "eliigibleForEmi": { "transactions": 12, "totalAmount": 141750.84 }
}`
            }
          ]
        }]
      })
    })

    const extractData = await extractResponse.json()
    const extractText = extractData.content?.[0]?.text ?? ''
    const cleanExtract = extractText.replace(/```json/g, '').replace(/```/g, '').trim()

    let statementData: any = {}
    try {
      statementData = JSON.parse(cleanExtract)
    } catch {
      return NextResponse.json({ error: 'Could not read the PDF. Please ensure it is not password-protected.' }, { status: 400 })
    }

    // Step 2: Analyse the extracted data and give honest assessment
    const card = cardName || statementData.cardName || 'Unknown Card'
    const bank = statementData.bank || 'Unknown Bank'
    const totalSpend = statementData.totalPurchases || 0
    const totalRewards = statementData.totalRewardsEarned || 0
    const financeCharges = statementData.financeCharges || 0

    // Calculate reward rate
    // HDFC Infinia: 3.3% on SmartBuy/travel, 1.5% base (1 point per Rs.150 = 0.67%)
    // Actual: rewards / spend * 100
    const valuePerPoint = 1.0 // Rs.1 per point for Infinia (conservative)
    const rewardsValueInr = totalRewards * valuePerPoint
    const actualRatePercent = totalSpend > 0 ? (rewardsValueInr / totalSpend) * 100 : 0

    // HDFC Infinia advertised: 3.3% on SmartBuy, 1.5% on dining/travel, 0.67% base
    // Blended advertised rate depends on spend mix
    let advertisedRate = 1.5 // default
    if (card.toLowerCase().includes('infinia')) advertisedRate = 1.5
    else if (card.toLowerCase().includes('diners') || card.toLowerCase().includes('black')) advertisedRate = 1.5
    else if (card.toLowerCase().includes('regalia')) advertisedRate = 1.33
    else if (card.toLowerCase().includes('magnus')) advertisedRate = 1.2
    else if (card.toLowerCase().includes('ace')) advertisedRate = 2.0

    const analysisPrompt = `You are CIRA, CreditIQ's honest credit card analyst. Analyse this HDFC Infinia statement and give brutal honest feedback.

CARD: ${card} by ${bank}
STATEMENT PERIOD: ${statementData.statementPeriod || 'May 2026'}
CARDHOLDER: ${statementData.cardholderName || 'User'}

KEY NUMBERS:
- Total purchases this cycle: Rs.${totalSpend.toLocaleString('en-IN')}
- Total rewards earned: ${totalRewards} points
- Estimated rewards value: Rs.${rewardsValueInr.toLocaleString('en-IN')} (at Rs.1/point)
- Finance charges paid: Rs.${financeCharges.toLocaleString('en-IN')} ⚠️
- Previous dues unpaid: Rs.${statementData.previousDues?.toLocaleString('en-IN') || 0}
- Actual reward rate: ${actualRatePercent.toFixed(2)}%
- Advertised rate: ${advertisedRate}%

CATEGORY BREAKDOWN:
${JSON.stringify(statementData.categoryBreakdown || [], null, 2)}

TOP TRANSACTIONS:
${(statementData.transactions || []).slice(0, 10).map((t: any) => 
  `${t.date}: ${t.description} — Rs.${t.amount} — ${t.rewardsEarned > 0 ? '+' + t.rewardsEarned + ' pts' : 'NO POINTS'}`
).join('\n')}

CRITICAL ISSUE: Finance charges of Rs.${financeCharges.toLocaleString('en-IN')} completely wipes out reward earnings of Rs.${rewardsValueInr.toFixed(0)}.

Be brutally honest. Respond ONLY with valid JSON:
{
  "cardName": "${card}",
  "bank": "${bank}",
  "period": "${statementData.statementPeriod || 'May 2026'}",
  "totalSpend": ${totalSpend},
  "totalRewardsEarned": ${totalRewards},
  "rewardsValueInr": ${Math.round(rewardsValueInr)},
  "financeCharges": ${financeCharges},
  "actualRate": ${parseFloat(actualRatePercent.toFixed(2))},
  "advertisedRate": ${advertisedRate},
  "netBenefit": ${Math.round(rewardsValueInr - financeCharges)},
  "verdict": "losing" | "breaking-even" | "winning",
  "verdictText": "One brutal honest line",
  "verdictColor": "red" | "amber" | "green",
  "score": 0-100,
  "categoryBreakdown": [
    {
      "category": "TRAVEL",
      "spend": 64698,
      "rewardsEarned": 1890,
      "advertisedRate": 3.3,
      "actualRate": 2.9,
      "moneyLeft": 284
    }
  ],
  "insights": [
    "Specific insight with exact numbers from the statement",
    "Finance charges observation",
    "Missed SmartBuy opportunity"
  ],
  "biggestMissedOpportunity": "Specific merchant or category where points were not earned",
  "financeChargeWarning": "If finance charges > 0, explain the impact clearly",
  "bestAction": "Top 1 thing to do differently next month",
  "totalMoneyLeft": ${Math.max(0, Math.round((advertisedRate - actualRatePercent) / 100 * totalSpend))},
  "keepOrSwitch": "keep" | "switch",
  "keepSwitchReason": "Specific reason"
}`

    const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: analysisPrompt }]
      })
    })

    const analysisData = await analysisResponse.json()
    const analysisText = analysisData.content?.[0]?.text ?? ''
    const cleanAnalysis = analysisText.replace(/```json/g, '').replace(/```/g, '').trim()
    const analysis = JSON.parse(cleanAnalysis)

    // Merge raw data into response
    return NextResponse.json({
      ...analysis,
      rawData: {
        cardholderName: statementData.cardholderName,
        cardLastFour: statementData.cardLastFour,
        totalAmountDue: statementData.totalAmountDue,
        minimumDue: statementData.minimumDue,
        creditLimit: statementData.creditLimit,
        availableCredit: statementData.availableCredit,
        eligibleForEmi: statementData.eligibleForEmi,
        financeCharges: statementData.financeCharges,
        transactions: statementData.transactions,
      }
    })

  } catch (err: any) {
    console.error('Statement truth error:', err)
    return NextResponse.json({ error: 'Analysis failed: ' + (err.message || 'Unknown error') }, { status: 500 })
  }
}
