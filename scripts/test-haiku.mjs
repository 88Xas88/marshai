// Тест Claude Haiku 4.5 на 3 разных маршрутах через CF AI Gateway, без деплоя.
// Запуск (локально): node --env-file=.env.local scripts/test-haiku.mjs
// Запуск (на сервере): запросить переменную ANTHROPIC_API_KEY из shared/.env.production
//
// Скрипт самодостаточный — promot-builder скопирован один-в-один из lib/claude.ts
// чтобы тестировать ровно тот же prompt что и прод.

const KEY = process.env.ANTHROPIC_API_KEY
if (!KEY) {
  console.error('ANTHROPIC_API_KEY env var required')
  process.exit(1)
}

const MODEL = 'claude-haiku-4-5-20251001'
const GATEWAY =
  'https://gateway.ai.cloudflare.com/v1/00c114e64e1b96d4ebef2716260184f2/marshai-anthropic/anthropic/v1/messages'

// — копия buildItineraryPrompt из lib/claude.ts —
function buildItineraryPrompt({ params, engage = {}, bestFlight, bestFlightBack, bestHotel } = {}) {
  const interestsLabel = {
    museums: 'музеи и история',
    food: 'рестораны и местная кухня',
    walks: 'прогулки и природа',
    all: 'всё понемногу',
  }[params.interests]
  const budgetLabel =
    params.budget > 0
      ? `${params.budget.toLocaleString('ru-RU')} ₽ на человека (общий: транспорт + жильё + питание + развлечения)`
      : 'не указан'

  const enriched = []
  if (engage.priority) enriched.push(`Приоритет: ${engage.priority}`)
  if (engage.pace) enriched.push(`Темп: ${engage.pace}`)
  if (engage.dailyBudget) enriched.push(`Бюджет на день: ${engage.dailyBudget}`)

  const ctx = []
  if (bestFlight) {
    ctx.push(`Транспорт туда: ${bestFlight.carrier} (${bestFlight.departTime}→${bestFlight.arriveTime}), ${bestFlight.price} ₽`)
  }
  if (bestFlightBack) {
    ctx.push(`Транспорт обратно: ${bestFlightBack.carrier} (${bestFlightBack.departTime}→${bestFlightBack.arriveTime}), ${bestFlightBack.price} ₽`)
  }
  if (bestHotel) {
    ctx.push(`Отель: ${bestHotel.name} · ${bestHotel.rating}★ · ${bestHotel.pricePerNight} ₽/ночь`)
  }

  return `Ты помогаешь составить план путешествия для русскоязычного пользователя.

Маршрут: ${params.from} → ${params.to}
Даты: ${params.dates}
Дней: ${params.days}
Кол-во человек: ${params.pax}
Бюджет: ${budgetLabel}
Интересы: ${interestsLabel}
${enriched.join('\n')}

Уже найдено:
${ctx.join('\n') || '(данные о транспорте/отелях ещё подбираются)'}

Составь подробный план поездки по дням с реальными местами в городе ${params.to}.
Каждый день — 3 точки: одна основная активность (музей/достопримечательность), одно место для еды, одна прогулочная активность.
Указывай реальные адреса, времена работы и приблизительные цены в рублях.
Время на каждую точку — реалистичное (с учётом перемещений в большом городе).
Подбирай транспорт, жильё и активности под указанный бюджет.

ВАЖНО: верни СТРОГО JSON без markdown-обрамления, без \`\`\`, без комментариев.

Структура:
{
  "days": [
    {
      "day": 1,
      "title": "Название дня (короткая тема)",
      "date": "10 мая, пт",
      "pois": [
        {
          "time": "10:00",
          "name": "Название места",
          "type": "museum" | "restaurant" | "walk" | "other",
          "duration": "2 ч",
          "cost": "700 ₽",
          "address": "Полный адрес",
          "description": "Краткое описание (1 предложение, до 100 символов)"
        }
      ]
    }
  ],
  "optimal": {
    "transport_there": { "name": "...", "why": "...", "price": "..." },
    "hotel": { "name": "...", "why": "...", "price_per_night": "..." },
    "transport_back": { "name": "...", "why": "...", "price": "..." }
  }
}`
}

const ROUTES = [
  {
    label: 'Москва → Калининград, 5 дней, бюджет 25к, прогулки',
    params: { from: 'Москва', to: 'Калининград', dates: '10-14.06', days: 5, pax: 2, budget: 25000, interests: 'walks' },
  },
  {
    label: 'Москва → Сочи, 7 дней, бюджет 40к, рестораны',
    params: { from: 'Москва', to: 'Сочи', dates: '01-07.07', days: 7, pax: 2, budget: 40000, interests: 'food' },
  },
  {
    label: 'Москва → Владивосток, 4 дня, бюджет 50к, музеи',
    params: { from: 'Москва', to: 'Владивосток', dates: '15-18.08', days: 4, pax: 1, budget: 50000, interests: 'museums' },
  },
]

async function callClaude(prompt) {
  const start = Date.now()
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const ms = Date.now() - start
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`)
  }
  const data = await res.json()
  return { data, ms }
}

function stripJsonFence(text) {
  let t = text.trim()
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  return t.trim()
}

let totalIn = 0
let totalOut = 0
let totalMs = 0
let parseFails = 0

console.log(`Model: ${MODEL}\nGateway: ${GATEWAY.replace(/\/v1\/[^/]+\//, '/v1/<acct>/')}\n`)

for (const route of ROUTES) {
  console.log(`\n${'━'.repeat(80)}`)
  console.log(`▶ ${route.label}`)
  console.log('━'.repeat(80))

  const prompt = buildItineraryPrompt({ params: route.params })

  let r
  try {
    r = await callClaude(prompt)
  } catch (e) {
    console.log(`  ✖ ${e.message}`)
    continue
  }

  totalIn += r.data.usage.input_tokens
  totalOut += r.data.usage.output_tokens
  totalMs += r.ms

  console.log(
    `time: ${(r.ms / 1000).toFixed(1)}s | tokens: in=${r.data.usage.input_tokens} out=${r.data.usage.output_tokens} | stop=${r.data.stop_reason}`
  )

  let parsed
  try {
    parsed = JSON.parse(stripJsonFence(r.data.content[0].text))
  } catch (e) {
    parseFails++
    console.log(`  ✖ JSON parse failed: ${e.message}`)
    console.log(r.data.content[0].text.slice(0, 400))
    continue
  }

  const totalPois = parsed.days?.reduce((s, d) => s + (d.pois?.length ?? 0), 0)
  console.log(`days: ${parsed.days?.length}, total POIs: ${totalPois}`)
  console.log('')

  const printDay = (d) => {
    console.log(`  ▸ День ${d.day} · ${d.title} · ${d.date}`)
    d.pois.forEach((p) => {
      console.log(`      ${p.time}  ${p.name}  [${p.type}, ${p.duration}, ${p.cost}]`)
      console.log(`           ${p.address}`)
      console.log(`           ${p.description}`)
    })
  }
  if (parsed.days?.[0]) printDay(parsed.days[0])
  if (parsed.days?.length > 1) {
    console.log('')
    printDay(parsed.days[parsed.days.length - 1])
  }
  console.log('')
  console.log('  optimal:')
  console.log(`    transport_there: ${parsed.optimal?.transport_there?.name}`)
  console.log(`                     ${parsed.optimal?.transport_there?.why}`)
  console.log(`    hotel:           ${parsed.optimal?.hotel?.name}`)
  console.log(`                     ${parsed.optimal?.hotel?.why}`)
  console.log(`    transport_back:  ${parsed.optimal?.transport_back?.name}`)
  console.log(`                     ${parsed.optimal?.transport_back?.why}`)
}

console.log(`\n${'═'.repeat(80)}`)
console.log(`SUMMARY: ${ROUTES.length} plans, ${parseFails} JSON parse failures`)
console.log(`tokens: in=${totalIn} out=${totalOut}, total time: ${(totalMs / 1000).toFixed(1)}s`)
const haikuCost = (totalIn * 1) / 1e6 + (totalOut * 5) / 1e6
const sonnetCost = (totalIn * 3) / 1e6 + (totalOut * 15) / 1e6
console.log(`Haiku 4.5 cost (3 plans): $${haikuCost.toFixed(5)} ≈ ${(haikuCost * 85).toFixed(2)} ₽`)
console.log(`Sonnet 4 cost (3 plans): $${sonnetCost.toFixed(5)} ≈ ${(sonnetCost * 85).toFixed(2)} ₽`)
console.log(`Saving: ${(((sonnetCost - haikuCost) / sonnetCost) * 100).toFixed(1)}%`)
