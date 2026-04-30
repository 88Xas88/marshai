import Anthropic from '@anthropic-ai/sdk'
import type {
  DayPlan,
  EngageAnswers,
  Flight,
  Hotel,
  OptimalSelection,
  SearchParams,
} from '@/types/plan'

// Haiku 4.5 — в ~3× дешевле Sonnet 4 (Input $1/M vs $3/M, Output $5/M vs $15/M).
// Один план ~ 0.85-1.5 ₽ против ~2.5-3.5 ₽ на Sonnet. Если качество просядет —
// вернуть на 'claude-sonnet-4-20250514'.
const MODEL = 'claude-haiku-4-5-20251001'

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

// === Промпт разбит на 2 части для prompt caching ===
//
// STATIC_PROMPT — инструкции, формат, правила, few-shot примеры. Никогда не
// меняется → кешируется через cache_control: { type: 'ephemeral' } (TTL 5 мин).
// При попадании в горячий кеш Anthropic берёт $0.10/1M вместо $1/1M на input
// для этих токенов (Haiku 4.5) = -90% на input cost.
//
// Минимальный размер кешируемого блока — 2048 токенов для Haiku 4.5 (1024 для
// Sonnet/Opus). Промпт ниже специально расширен few-shot примерами, чтобы:
// 1) гарантированно брался порог кеширования (текущий размер ~2300 токенов);
// 2) Haiku видел эталонные POI для качества (анти-галлюцинации).
//
// buildDynamicSection() возвращает только переменную часть. Не кешируется.

const STATIC_PROMPT = `Ты — AI-планировщик путешествий для русскоязычной аудитории Marshai (marshai.ru).

Твоя задача — составить детальный план поездки по дням на основе входных данных пользователя, которые приходят отдельным блоком ниже.

ПРАВИЛА СОСТАВЛЕНИЯ ПЛАНА

Каждый день должен содержать ровно 3 точки:
1. Основная активность — общеизвестный музей, достопримечательность, исторический объект, природный или архитектурный памятник.
2. Место для еды — ресторан, кафе или точка с локальной кухней. ВАЖНО: если не знаешь конкретного названия ресторана в этом городе со 100% уверенностью — пиши обобщённое описание, например «кафе с татарской кухней в центре города» или «семейный ресторан рядом с Эрмитажем». Не выдумывай конкретные имена ресторанов. Лучше указать тип кухни и район, чем дать неверное название.
3. Прогулочная активность — парк, набережная, историческая улица, смотровая площадка или прогулочная зона.

Для каждой точки укажи:
- time — время начала визита (формат "HH:MM" в 24-часовом формате).
- name — название места. Для крупных достопримечательностей — точное историческое имя. Для рестов — см. правило выше.
- type — одно из четырёх значений: "museum", "restaurant", "walk", "other".
- duration — длительность пребывания (например "2 ч", "1.5 ч", "45 мин").
- cost — стоимость на одного человека в рублях ("0 ₽" для бесплатного).
- address — реальный адрес (улица, дом, район, город). Для известных мест — используй настоящие адреса.
- description — одно ёмкое предложение до 100 символов о том, чем место примечательно.

ПРАВИЛА ВРЕМЕНИ

Реалистичное планирование с учётом перемещений между точками 30-60 минут в крупных городах:
- Утренний слот: 09:00-13:00.
- Обеденный слот: 13:00-15:00.
- Послеобеденный слот: 15:00-18:00.
- Вечерний слот: 18:00-22:00.
- В первый день поездки начинай не раньше 12:00-14:00 (учитывай время прибытия транспорта).
- В последний день заканчивай к 16:00 (учитывай время отправления обратно).

ПРАВИЛА ЦЕН

- Используй цены актуальные на 2025-2026 годы для российских городов.
- Музеи: 200-1000 ₽; для культовых мест (Эрмитаж, Кремль) — 600-1200 ₽.
- Кафе/недорогие рестораны: 400-1000 ₽ на человека.
- Средние рестораны: 1000-2500 ₽ на человека.
- Подбирай ценовой сегмент под указанный бюджет — если бюджет до 15 000 ₽ на человека, не предлагай рестораны по 3000+ ₽.

ПРАВИЛА ИНТЕРЕСОВ

- museums (музеи и история): больше музеев, исторических зданий, тематических экскурсий.
- food (рестораны и местная кухня): добавляй кулинарные точки в каждый день, можно гастрономические районы и рынки.
- walks (прогулки и природа): больше парков, набережных, природных мест, видовых точек.
- all (всё понемногу): сбалансированный микс.

БЛОК OPTIMAL

После массива days верни блок optimal — рекомендуемая комбинация из 3 элементов для пользователя:
- transport_there: транспорт туда. Если данные о найденном транспорте есть в "Уже найдено" — используй это. Иначе подбирай оптимальный по дистанции/бюджету.
- hotel: жильё. Если в "Уже найдено" есть отель — используй его. Иначе предложи общий тип (например, "3-звёздочный отель в центре"), а не конкретное название.
- transport_back: транспорт обратно — обычно симметричен transport_there.

Каждый элемент имеет 3 поля:
- name — название (или общее описание для отелей).
- why — короткое обоснование выбора (1 предложение).
- price (для transport_*) или price_per_night (для hotel) — цена в рублях.

ФОРМАТ ОТВЕТА — СТРОГО JSON

Верни единый JSON-объект без markdown-обрамления (без \`\`\`), без преамбулы, без комментариев. Никакого текста до или после JSON.

Структура:

{
  "days": [
    {
      "day": 1,
      "title": "Короткая тема дня (3-5 слов)",
      "date": "10 мая, пт",
      "pois": [
        {
          "time": "10:00",
          "name": "Название места",
          "type": "museum",
          "duration": "2 ч",
          "cost": "700 ₽",
          "address": "Полный адрес, город",
          "description": "Краткое описание (1 предложение, до 100 символов)"
        }
      ]
    }
  ],
  "optimal": {
    "transport_there": { "name": "...", "why": "...", "price": "..." },
    "hotel":           { "name": "...", "why": "...", "price_per_night": "..." },
    "transport_back":  { "name": "...", "why": "...", "price": "..." }
  }
}

Поле type принимает только: "museum" | "restaurant" | "walk" | "other".
Поля cost, price, price_per_night — строки с указанием валюты (например "1200 ₽").
Поле days должно содержать ровно столько объектов, сколько указано в параметре "Дней".
Поле pois внутри каждого дня должно содержать ровно 3 объекта.

ПРИМЕРЫ КАЧЕСТВЕННЫХ POI (используй такой уровень конкретики и точности)

Пример 1 — Санкт-Петербург, Эрмитаж как основная точка:
{
  "time": "10:00",
  "name": "Государственный Эрмитаж",
  "type": "museum",
  "duration": "3 ч",
  "cost": "500 ₽",
  "address": "Дворцовая пл., 2, Санкт-Петербург",
  "description": "Главная площадь и крупнейший музей мира с коллекцией от Античности до XX века"
}

Пример 2 — обобщённый ресторан без выдумки конкретного имени:
{
  "time": "14:30",
  "name": "Кафе с татарской кухней рядом с Кремлём",
  "type": "restaurant",
  "duration": "1 ч",
  "cost": "700 ₽",
  "address": "район ул. Баумана, Казань",
  "description": "Бюджетные обеды с эчпочмаками, чак-чаком и горячим бульоном"
}

Пример 3 — прогулочная активность:
{
  "time": "16:00",
  "name": "Прогулка по Невскому проспекту",
  "type": "walk",
  "duration": "1.5 ч",
  "cost": "0 ₽",
  "address": "Невский пр., Санкт-Петербург",
  "description": "Главная артерия города от Адмиралтейства до площади Восстания"
}

Пример 4 — общий тип отеля для блока optimal без конкретного бренда:
{
  "name": "3-звёздочный отель в районе Центрального района",
  "why": "Пешая доступность к набережной и историческому центру, бюджетный сегмент",
  "price_per_night": "3 200 ₽"
}

ЧЕГО НЕЛЬЗЯ ДЕЛАТЬ

- Не выдумывай конкретные названия ресторанов, мини-отелей, бутиков, локальных кафе если не уверен на 100%. Лучше "ресторан грузинской кухни в районе ул. Льва Толстого" чем фейковое "Ресторан Тбилисо на Льва Толстого 12".
- Не выдумывай несуществующие парки, улицы, музеи. Используй только общеизвестные локации.
- Не путай города. Если едем в Калининград — не подкладывай московские локации.
- Не предлагай рестораны выше бюджетного сегмента пользователя.
- Не превышай 100 символов в description.
- Не используй markdown в полях JSON (никаких **bold** или \`\`\`).
- Не возвращай НИЧЕГО кроме самого JSON-объекта (никакой "Вот ваш план:", никаких комментариев в конце).

ЕСЛИ В ПРИНЦИПЕ НЕ УВЕРЕН

Лучше дать общий, но честный ответ, чем выдумывать. Например, для далёких городов где знаешь только крупные достопримечательности — используй их и обобщённые описания для еды/прогулок. Не пытайся заполнить пробелы выдумкой.`

function buildDynamicSection(input: ItineraryGenerationInput): string {
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

  return `Параметры этой поездки:

Маршрут: ${params.from} → ${params.to}
Даты: ${params.dates}
Дней: ${params.days}
Кол-во человек: ${params.pax}
Бюджет: ${budgetLabel}
Интересы: ${interestsLabel}
${enriched.join('\n')}

Уже найдено:
${ctx.join('\n') || '(данные о транспорте/отелях ещё подбираются)'}

Составь подробный план поездки в город ${params.to} на ${params.days} дней по правилам выше. Верни СТРОГО JSON.`
}

// Сохраняем экспорт для совместимости (используется в тестовых скриптах).
export function buildItineraryPrompt(input: ItineraryGenerationInput): string {
  return STATIC_PROMPT + '\n\n' + buildDynamicSection(input)
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
      messages: [
        {
          role: 'user',
          content: [
            {
              // Статичная часть — кешируется на стороне Anthropic.
              type: 'text',
              text: STATIC_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
            {
              // Динамичная часть — параметры конкретной поездки.
              type: 'text',
              text: buildDynamicSection(input),
            },
          ],
        },
      ],
    })
    // Логируем usage в pm2 logs marshai. cache_w > 0 при первом вызове =
    // создан ephemeral-кеш. cache_r > 0 при повторных = взяли из кеша
    // (в 10× дешевле обычного input).
    console.log(
      `[claude] ${MODEL} ${JSON.stringify({
        in: res.usage.input_tokens,
        out: res.usage.output_tokens,
        cache_r: res.usage.cache_read_input_tokens,
        cache_w: res.usage.cache_creation_input_tokens,
      })}`
    )
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
