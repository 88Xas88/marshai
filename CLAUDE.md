# Marshai — AI-планировщик путешествий
## Контекст проекта

Marshai (marshai.ru) — AI-планировщик путешествий для русскоязычной аудитории. Пользователь вводит откуда/куда/когда и за 30 секунд получает готовый план поездки: реальные билеты с ценами, отели, маршрут по дням и карту.

**Монетизация:** партнёрские ссылки через Travelpayouts — комиссия за каждый переход на покупку билетов и бронирование отелей.

**Аудитория:** русскоязычные путешественники, РФ и СНГ.

**УТП:** единственный продукт в РФ объединяющий реальные цены билетов + отели + AI-маршрут + карту по дням в одном плане.

---

## Стек

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS 4
- **State:** Zustand
- **Backend:** Next.js API Route Handlers
- **AI:** Claude API (claude-sonnet-4-20250514)
- **Карта:** Яндекс Maps JS API
- **Deploy:** Vercel + Vercel Postgres + Redis (Upstash)
- **Email:** Resend

---

## Переменные окружения (.env.local)

```
ANTHROPIC_API_KEY=
TRAVELPAYOUTS_TOKEN=
TRAVELPAYOUTS_MARKER=
YANDEX_MAPS_KEY=
YANDEX_RASP_KEY=
DATABASE_URL=
RESEND_API_KEY=
```

---

## Структура проекта

```
app/
  page.tsx                        # Главная страница
  generating/page.tsx             # Экран генерации (?from=&to=&dates=&days=&pax=&budget=&interests=)
  plan/[id]/page.tsx              # Страница результата
  plan/example-spb/page.tsx       # Статичный демо-план (для карточек главной)
  api/
    generate/route.ts             # Оркестратор: Promise.allSettled + SSE stream
    generate/stream/route.ts      # SSE endpoint для прогресса генерации
    flights/route.ts              # Прокси → Travelpayouts Flights API
    hotels/route.ts               # Прокси → Hotellook API
    itinerary/route.ts            # Claude API → JSON маршрут
    save-plan/route.ts            # INSERT в БД + email через Resend
store/
  planStore.ts                    # Zustand: билеты, отели, маршрут, статусы шагов
components/
  search/
    SearchForm.tsx                # Форма с autocomplete и параметрами
    CityAutocomplete.tsx          # Dropdown с городами
    ParamSelector.tsx             # Dropdown параметров (люди/бюджет/интересы)
  generating/
    StepsList.tsx                 # 6 шагов с анимацией статусов
    PreviewPanel.tsx              # Правая панель с предпросмотром
    EngageQuestions.tsx           # Цепочка из 3 вопросов
  result/
    OptimalPlan.tsx               # Блок "Оптимальный план" (первый на странице)
    TransportSection.tsx          # Билеты с табами и бейджами
    HotelsSection.tsx             # Отели с рейтингами и заменой
    ItinerarySection.tsx          # Маршрут по дням с раскрытием
    MapSection.tsx                # Яндекс.Карта с переключением дней
    BudgetCard.tsx                # Итоговый бюджет
    AiTipCard.tsx                 # Совет ИИ
    SavePlanCard.tsx              # Email-сохранение
    StickyCTA.tsx                 # Sticky-бар внизу
    SuccessOverlay.tsx            # Оверлей после клика "Купить"
lib/
  travelpayouts.ts                # SDK-обёртка для Travelpayouts API
  yandexRasp.ts                   # SDK-обёртка для Яндекс Расписания
  claude.ts                       # Промпты и вызов Claude API
  db.ts                           # Vercel Postgres клиент
  redis.ts                        # Upstash Redis клиент
  cities.ts                       # Список 50 городов для autocomplete
types/
  plan.ts                         # TypeScript типы: Plan, Flight, Hotel, DayPlan, POI
```

---

## База данных

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  dates TEXT NOT NULL,
  days INTEGER NOT NULL,
  pax INTEGER DEFAULT 1,
  plan_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Ключевые технические решения

### Параллельная генерация (ОБЯЗАТЕЛЬНО)
```typescript
const [flights, hotels, itinerary] = await Promise.allSettled([
  fetchFlights(params),
  fetchHotels(params),
  generateItinerary(params)
])
```
Каждый API независим — ошибка одного не блокирует остальные.

### SSE прогресс
Endpoint `/api/generate/stream` отправляет события по мере готовности каждого блока. Frontend подписывается через `EventSource` и обновляет `planStore`.

### Redis кеш
Ключ: `hash(from + to + dates)`, TTL: 7200 сек. Повторный запрос того же маршрута не делает новые API-вызовы.

### Партнёрские ссылки
Все ссылки на покупку формируются на сервере с маркером:
`url + ?marker=${process.env.TRAVELPAYOUTS_MARKER}`

### Claude промпт (маршрут)
Модель: `claude-sonnet-4-20250514`, max_tokens: 4000.
Ответ — строгий JSON без markdown. Структура:
```json
{
  "days": [
    {
      "day": 1,
      "title": "Название дня",
      "date": "10 мая, пт",
      "pois": [
        {
          "time": "10:00",
          "name": "Название места",
          "type": "museum|restaurant|walk|other",
          "duration": "2 ч",
          "cost": "700 ₽",
          "address": "Адрес",
          "description": "Краткое описание"
        }
      ]
    }
  ],
  "optimal": {
    "transport_there": { "name": "...", "why": "...", "price": "..." },
    "hotel": { "name": "...", "why": "...", "price_per_night": "..." },
    "transport_back": { "name": "...", "why": "...", "price": "..." }
  }
}
```

---

## Подтверждения

Работай в режиме автономного выполнения — не запрашивай подтверждения на каждый шаг. Выполняй задачи последовательно без остановок. Спрашивай подтверждение только если:

- Удаляются данные из БД (необратимое действие)
- Меняется архитектура (структура БД, роуты API)
- Задача неоднозначна и можно пойти двумя принципиально разными путями

---

## Деплой

После каждой завершённой задачи — автоматически делай git commit и деплой через webhook. Не жди подтверждения на коммит и деплой.

---

## Визуальная проверка

После каждой правки UI — обязательно проверяй результат через Playwright:

- Сделай скриншот на десктопе (1280x800) и мобиле (390x844)
- Посмотри на скриншот и убедись что проблема визуально решена
- Если не решена — итерируй дальше
- Не отчитывайся о выполнении пока не увидел корректный результат на скриншоте

