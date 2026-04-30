import Anthropic from '@anthropic-ai/sdk'
import type {
  DayPlan,
  EngageAnswers,
  Flight,
  Hotel,
  OptimalSelection,
  SearchParams,
} from '@/types/plan'

const MODEL = 'claude-sonnet-4-20250514'

interface ItineraryGenerationInput {
  params: SearchParams
  engage?: EngageAnswers
  bestFlight?: Flight
  bestFlightBack?: Flight
  bestHotel?: Hotel
}

export interface ItineraryResult {
  days: DayPlan[]
  optimal: OptimalSelection
}

export function buildItineraryPrompt(input: ItineraryGenerationInput): string {
  const { params, engage, bestFlight, bestFlightBack, bestHotel } = input
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

  const enriched: string[] = []
  if (engage?.priority) enriched.push(`Приоритет: ${engage.priority}`)
  if (engage?.pace) enriched.push(`Темп: ${engage.pace}`)
  if (engage?.dailyBudget) enriched.push(`Бюджет на день: ${engage.dailyBudget}`)

  const ctx: string[] = []
  if (bestFlight) {
    ctx.push(
      `Транспорт туда: ${bestFlight.carrier} (${bestFlight.departTime}→${bestFlight.arriveTime}), ${bestFlight.price} ₽`
    )
  }
  if (bestFlightBack) {
    ctx.push(
      `Транспорт обратно: ${bestFlightBack.carrier} (${bestFlightBack.departTime}→${bestFlightBack.arriveTime}), ${bestFlightBack.price} ₽`
    )
  }
  if (bestHotel) {
    ctx.push(
      `Отель: ${bestHotel.name} · ${bestHotel.rating}★ · ${bestHotel.pricePerNight} ₽/ночь`
    )
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

const apiKey = process.env.ANTHROPIC_API_KEY

// Anthropic geo-блокирует RU IP с 403, поэтому сервер ходит в Anthropic
// через Cloudflare AI Gateway (US/EU edge). Можно переопределить через
// ANTHROPIC_BASE_URL в .env.production если переехали на другой прокси.
const ANTHROPIC_BASE_URL =
  process.env.ANTHROPIC_BASE_URL ??
  'https://gateway.ai.cloudflare.com/v1/00c114e64e1b96d4ebef2716260184f2/marshai-anthropic/anthropic'

const client: Anthropic | null = apiKey
  ? new Anthropic({ apiKey, baseURL: ANTHROPIC_BASE_URL })
  : null

export async function generateItinerary(
  input: ItineraryGenerationInput
): Promise<ItineraryResult> {
  if (!client) return mockItinerary(input)
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: buildItineraryPrompt(input) }],
    })
    const block = res.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') return mockItinerary(input)
    const text = block.text.trim()
    const cleaned = stripJsonFence(text)
    const parsed = JSON.parse(cleaned) as ItineraryResult
    if (!parsed.days || !parsed.optimal) return mockItinerary(input)
    return parsed
  } catch (err) {
    console.error('[claude] itinerary failed:', err)
    return mockItinerary(input)
  }
}

function stripJsonFence(text: string): string {
  let t = text.trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  }
  return t.trim()
}

function mockItinerary(input: ItineraryGenerationInput): ItineraryResult {
  const { params, bestFlight, bestFlightBack, bestHotel } = input
  const days: DayPlan[] = Array.from({ length: params.days }, (_, i) => {
    const dayNum = i + 1
    return {
      day: dayNum,
      title: dayNum === 1 ? 'Прогулка по центру' : `Маршрут дня ${dayNum}`,
      date: `День ${dayNum}`,
      pois: [
        {
          time: '10:00',
          name: `Главная достопримечательность ${params.to}`,
          type: 'museum',
          duration: '2.5 ч',
          cost: '500 ₽',
          address: `${params.to}, центр`,
          description: 'Ключевое место города — рекомендуем начать с него.',
        },
        {
          time: '14:00',
          name: 'Местная кухня в кафе у площади',
          type: 'restaurant',
          duration: '1 ч',
          cost: '700 ₽',
          address: `${params.to}, центр`,
          description: 'Уютное место с городскими специалитетами.',
        },
        {
          time: '16:00',
          name: 'Прогулка по историческим улицам',
          type: 'walk',
          duration: '1.5 ч',
          cost: '0 ₽',
          address: `${params.to}, исторический центр`,
          description: 'Атмосфера города пешком — самое интересное.',
        },
      ],
    }
  })

  const optimal: OptimalSelection = {
    transport_there: {
      name: bestFlight?.carrier ?? 'Транспорт туда',
      why: 'Лучшее соотношение цены, удобства и времени',
      price: bestFlight ? `${bestFlight.price} ₽` : '—',
    },
    hotel: {
      name: bestHotel?.name ?? 'Жильё',
      why: bestHotel
        ? `${bestHotel.rating}★ · центр · бесплатная отмена`
        : 'Центр, рейтинг 8+',
      price_per_night: bestHotel ? `${bestHotel.pricePerNight} ₽/ночь` : '—',
    },
    transport_back: {
      name: bestFlightBack?.carrier ?? 'Транспорт обратно',
      why: 'Удобный вечерний рейс',
      price: bestFlightBack ? `${bestFlightBack.price} ₽` : '—',
    },
  }

  return { days, optimal }
}
