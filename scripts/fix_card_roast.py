filepath = r'app/api/card-roast/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

content = content.replace(
    "import { retrieveRelevantCards, buildRagSystemPrompt, cardToText } from '@/lib/rag'",
    "import { retrieveRelevantCards, buildRagSystemPrompt, cardToText, getIgInsights } from '@/lib/rag'"
)

old = """  const { context, devaluations } = await retrieveRelevantCards(
    'best cards for ' + (spendProfile || 'general spending') + ' Rs.' + monthlySpend + ' per month',
    { topK: 6, intent: 'general' }
  )

  const systemPrompt = buildRagSystemPrompt(context, devaluations)"""

new = """  const roastQuery = card.name + ' credit card devaluation worth it ' + (spendProfile || 'general spending')
  const { context, devaluations } = await retrieveRelevantCards(
    'best cards for ' + (spendProfile || 'general spending') + ' Rs.' + monthlySpend + ' per month',
    { topK: 6, intent: 'general' }
  )
  const cardInsights = await getIgInsights(8, roastQuery)
  const systemPrompt = buildRagSystemPrompt(context, devaluations, cardInsights)"""

if old in content:
    content = content.replace(old, new)
    print("OK: card-roast patched")
else:
    print("MISS: check indentation")

content = content.replace(
    "'Grade this card for this user:\\n\\n' +",
    "'Grade this card. If community intelligence shows devaluations or problems, lower the grade and cite them.\\n\\n' +"
)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("done")
