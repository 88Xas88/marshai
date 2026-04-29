# Marshai — Этап 4: Magic Link авторизация + страница аккаунта

## Что делаем

1. Magic Link авторизация — настоящий вход через email
2. Полная переработка страницы /account

Требования к зависимостям: RESEND_API_KEY уже есть в коде (lib/email.ts), нужно добавить в Vercel Environment Variables.

---

## ЧАСТЬ 1 — Magic Link авторизация

### Как работает

```
Пользователь вводит email
       ↓
Сервер генерирует токен (UUID) → сохраняет в БД (таблица auth_tokens)
       ↓
Resend отправляет письмо со ссылкой:
https://marshai.ru/auth/verify?token=UUID&email=user@mail.ru
       ↓
Пользователь кликает ссылку
       ↓
Сервер проверяет токен (не просрочен? не использован?)
       ↓
Создаёт сессию → записывает в cookie httpOnly
       ↓
Редирект на /account
```

### БД — новая таблица

```sql
CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ON auth_tokens (token);
CREATE INDEX ON auth_tokens (email);
```

Добавить в `migrations/002_auth.sql`.

### Таблица users (новая)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

### Новые API роуты

**POST /api/auth/send-link**
```typescript
Body: { email: string }

1. Валидация email
2. Найти или создать пользователя в таблице users
3. Сгенерировать token = crypto.randomUUID()
4. Сохранить в auth_tokens (expires_at = NOW() + 15 минут)
5. Отправить письмо через Resend:
   - Тема: "Войти в Marshai"
   - Кнопка: https://marshai.ru/auth/verify?token=TOKEN&email=EMAIL
6. Вернуть { ok: true }
```

**GET /api/auth/verify?token=&email=**
```typescript
1. Найти токен в auth_tokens
2. Проверить: exists? NOT used? expires_at > NOW()?
3. Если нет → вернуть { error: 'invalid_token' }
4. Отметить токен как used=true
5. Обновить users.last_login
6. Создать сессию: JWT подписанный SECRET_KEY
   { userId, email, exp: NOW() + 30 дней }
7. Записать в cookie: 
   - name: 'marshai_session'
   - value: JWT
   - httpOnly: true
   - secure: true  
   - sameSite: 'lax'
   - maxAge: 30 * 24 * 60 * 60
8. Redirect: /account
```

**POST /api/auth/logout**
```typescript
1. Удалить cookie 'marshai_session'
2. Вернуть { ok: true }
```

**GET /api/auth/me**
```typescript
1. Прочитать cookie 'marshai_session'
2. Верифицировать JWT
3. Вернуть { email, userId } или 401
```

### Новый env

```
AUTH_SECRET=random-32-char-string  # для подписи JWT
```

Добавить в Vercel Environment Variables.

---

### Экран входа /account (без сессии)

```
┌─────────────────────────────────────┐
│         M  Marshai                  │
│                                     │
│   [иконка геометки на teal 56px]    │
│                                     │
│   Войти в Marshai                   │  ← h1, 20px, weight 500
│   Сохраняй планы и следи за         │  ← subtitle, 14px, gray
│   изменением цен                    │
│                                     │
│   [email@mail.ru____________]       │  ← input, h 48px
│                                     │
│   [  Получить ссылку для входа  ]   │  ← #2C2C2A кнопка, h 48px
│                                     │
│   Нажимая "Войти", вы соглашаетесь  │
│   с условиями использования         │
└─────────────────────────────────────┘
```

**После отправки email — экран ожидания:**

```
┌─────────────────────────────────────┐
│         M  Marshai                  │
│                                     │
│   [иконка письма 56px, анимация]    │
│                                     │
│   Проверьте почту                   │  ← h1
│   Мы отправили ссылку на            │  ← subtitle
│   ivan@mail.ru                      │  ← email жирным
│                                     │
│   Ссылка действительна 15 минут     │  ← мелко, серым
│                                     │
│   [  Отправить снова  ]             │  ← outline кнопка
│   [  Изменить email   ]             │  ← текстовая ссылка
└─────────────────────────────────────┘
```

**Письмо (HTML через Resend):**

```
Subject: "Войти в Marshai"

[Логотип Marshai]

Привет!

Нажмите кнопку чтобы войти в Marshai.
Ссылка действительна 15 минут.

[  Войти в Marshai  ]  ← большая кнопка #2C2C2A

Если вы не запрашивали вход — просто проигнорируйте это письмо.

marshai.ru
```

---

## ЧАСТЬ 2 — Страница /account (после входа)

### Структура

```
[Навбар: Marshai лого + email пользователя + кнопка выйти]

[Профиль-строка компактная]:
[АВ] Алексей Борисов · ivan@mail.ru  [Настройки ⚙]

[Табы]: Предстоящие | Прошедшие | Настройки

[Контент вкладки]
```

### Вкладка "Предстоящие"

**Если есть алерт цен:**
```
┌─ зелёный бордер ─────────────────────────────┐
│ ★  Цены изменились на ваш маршрут            │
│    Сапсан Москва → СПб: +320 ₽ с сохранения  │
│    [Купить сейчас →]                          │
└───────────────────────────────────────────────┘
```

**Карточка поездки:**
```
┌──────────────────────────────────────────────┐
│ Москва → Санкт-Петербург    [Не куплено]     │
│ 5 дней · 10–15 мая · 1 чел.                 │
├──────────────────────────────────────────────┤
│ [Купить сейчас →]  (полная ширина, чёрная)  │
├──────────────────────────────────────────────┤
│ [Сапсан] [5 дней] [15 мест]                 │
│ от 28 980 ₽              [Открыть план →]   │
└──────────────────────────────────────────────┘
```

Три статуса бейджа:
- `not_booked` → серый "Не куплено" + кнопка "Купить сейчас →"
- `partial` → amber "Частично куплено" + кнопка "Добавить [жильё/транспорт] →"
- `booked` → teal "Всё забронировано" + кнопки нет

**Empty state (нет поездок):**
```
[иконка геометки]
Ещё нет сохранённых поездок
Вот что планируют сейчас другие:

[Мск → Питер  5 дн  от 22 400 ₽]  [Мск → Казань  3 дн  от 18 600 ₽]
[Мск → Сочи   7 дн  от 96 000 ₽]  [Мск → Калинг. 4 дн  от 31 000 ₽]

[Спланировать поездку]
```

### Вкладка "Прошедшие"

Те же карточки, без кнопок действия, статус всегда "Завершено" (teal).

### Вкладка "Настройки"

```
УВЕДОМЛЕНИЯ
[🔔] Изменение цен           [тоггл ON]
     Email когда цены меняются

[📅] Напоминание о поездке    [тоггл ON]
     За 3 дня до отъезда

ПРЕДПОЧТЕНИЯ
[🏛] Интересы                [Музеи и история  →]
[💰] Бюджет                  [Средний          →]

АККАУНТ
[📧] Email: ivan@mail.ru
[🚪] Выйти из аккаунта       ← красный текст, cursor pointer
```

Тогглы: ON = #1D9E75, OFF = border-secondary, анимация 150ms.

### Навбар /account

```
[M Marshai]              [ivan@mail.ru ▼]  [Выйти]
```

На мобайле — bottom nav как в Этапе 2 (уже есть).

---

## Технические детали

### Middleware (app/middleware.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export function middleware(req: NextRequest) {
  // Защищаем только /account
  if (req.nextUrl.pathname.startsWith('/account')) {
    const session = req.cookies.get('marshai_session')
    if (!session) {
      return NextResponse.redirect(new URL('/account/login', req.url))
    }
    const payload = verifyJWT(session.value)
    if (!payload) {
      return NextResponse.redirect(new URL('/account/login', req.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*']
}
```

### lib/auth.ts (новый файл)

```typescript
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET)

export async function signJWT(payload: { email: string; userId: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { email: string; userId: string }
  } catch {
    return null
  }
}
```

Зависимость: `npm install jose`

### Удалить localStorage

После реализации:
- Удалить `localStorage.getItem('marshai_user_email')` из app/account/page.tsx
- Удалить `LoginScreen` компонент (заменяется на /account/login страницу)
- Данные пользователя брать из /api/auth/me

---

## Страница /auth/verify

```
app/auth/verify/page.tsx

При загрузке:
- Читает ?token= и ?email= из URL
- POST /api/auth/verify
- Если ok → редирект /account
- Если ошибка → показать:

[иконка ошибки]
Ссылка устарела или уже использована
Ссылки действительны 15 минут

[Запросить новую ссылку]  ← ведёт на /account
```

---

## Дизайн (без изменений от системы)

- Цвета: #2C2C2A кнопки, #1D9E75 успех/teal
- font-weight: 400/500
- border-radius: 8px элементы, 12px карточки
- Никаких теней, градиентов, blur
- Touch-targets 48px

---

## Env переменные добавить в Vercel

```
AUTH_SECRET=сгенерируй-32-случайных-символа
RESEND_API_KEY=re_xxxxxxxx  ← взять из resend.com
```

---

## Чеклист приёмки

- [ ] Миграция 002_auth.sql применена (таблицы auth_tokens, users)
- [ ] POST /api/auth/send-link отправляет реальное письмо через Resend
- [ ] Письмо приходит с кнопкой входа, ссылка валидна 15 мин
- [ ] GET /api/auth/verify создаёт сессию в httpOnly cookie
- [ ] После верификации — редирект на /account с реальным контентом
- [ ] POST /api/auth/logout удаляет cookie
- [ ] Middleware защищает /account — без сессии редирект на /account/login  
- [ ] localStorage полностью убран
- [ ] /account показывает реальные планы из БД по email сессии
- [ ] Тогглы уведомлений работают
- [ ] Кнопка "Выйти" разлогинивает и редиректит на главную
- [ ] Экран "Проверьте почту" показывается после отправки
- [ ] Экран ошибки на /auth/verify если токен невалиден
- [ ] next build чистый


---

## ЧАСТЬ 3 — Умный бюджет на главной странице

### Проблема

Сейчас три статичных кнопки: Эконом / Средний / Свободно. Это ничего не говорит пользователю — "средний" для Питера на 2 дня и на 10 дней это совершенно разные суммы.

### Решение

Заменить dropdown бюджета на **умный слайдер с динамическими рекомендациями**.

---

### Компонент BudgetSelector

**Файл:** `components/search/BudgetSelector.tsx`

**Как выглядит:**

```
БЮДЖЕТ НА ЧЕЛОВЕКА
[──────────●──────────────]  12 000 ₽
 Эконом    ↑              Свободно
           Средний

💡 Для Питера на 5 дней: рекомендуем 10 000–15 000 ₽
   Транспорт ~3 000 ₽ · Жильё ~5 000 ₽ · Питание ~3 000 ₽ · Музеи ~2 000 ₽
```

**Props:**
```typescript
interface BudgetSelectorProps {
  value: number           // текущее значение в рублях
  onChange: (value: number) => void
  toCity?: string         // куда едем (для рекомендаций)
  days?: number           // сколько дней (для рекомендаций)
}
```

---

### Логика рекомендаций

**Функция** `getBudgetRecommendation(toCity, days)`:

```typescript
// Базовые стоимости в сутки по городам (в рублях)
const CITY_COSTS: Record<string, { transport: number; hotel: number; food: number; museums: number }> = {
  'Санкт-Петербург': { transport: 600, hotel: 3200, food: 800, museums: 500 },
  'Казань':          { transport: 400, hotel: 2500, food: 700, museums: 300 },
  'Сочи':            { transport: 500, hotel: 3500, food: 900, museums: 200 },
  'Калининград':     { transport: 500, hotel: 2800, food: 750, museums: 400 },
  'Владивосток':     { transport: 800, hotel: 3000, food: 1000, museums: 300 },
  'Екатеринбург':    { transport: 400, hotel: 2200, food: 650, museums: 250 },
  'Новосибирск':     { transport: 400, hotel: 2000, food: 600, museums: 200 },
  'Нижний Новгород': { transport: 350, hotel: 2200, food: 650, museums: 300 },
  // DEFAULT для неизвестных городов:
  'default':         { transport: 500, hotel: 2500, food: 700, museums: 300 },
}

function getBudgetRecommendation(toCity: string, days: number) {
  const costs = CITY_COSTS[toCity] ?? CITY_COSTS['default']
  
  // Транспорт считается один раз (туда+обратно), остальное × дней
  const transport = costs.transport * 2  // фиксированно туда+обратно
  const hotel = costs.hotel * days
  const food = costs.food * days
  const museums = costs.museums * days
  
  const total = transport + hotel + food + museums
  const min = Math.round(total * 0.8 / 1000) * 1000    // -20%
  const max = Math.round(total * 1.3 / 1000) * 1000    // +30%
  
  return {
    min,           // нижняя граница рекомендации
    recommended: total,  // рекомендованное значение
    max,           // верхняя граница
    breakdown: {
      transport,
      hotel,
      food,
      museums,
    }
  }
}
```

---

### UI слайдера

**Диапазон:** от 3 000 ₽ до 200 000 ₽
**Шаг:** 1 000 ₽
**Метки на слайдере:**
- 3 000 ₽ → "Эконом"
- 15 000 ₽ → "Средний"
- 50 000 ₽ → "Комфорт"
- 100 000 ₽ → "Бизнес"
- 200 000 ₽ → "Свободно"

**Цвет ползунка:** #2C2C2A
**Трек до ползунка:** #2C2C2A
**Трек после ползунка:** var(--color-border-secondary)

**Подсказка (появляется когда выбран город И дни):**

```
💡 Для [Питера] на [5 дней]:
Рекомендуем [10 000 – 15 000 ₽]

Транспорт туда+обратно  ~1 200 ₽
Жильё (5 ночей)         ~16 000 ₽
Питание                 ~4 000 ₽
Музеи и активности      ~2 500 ₽
──────────────────────────────────
Итого                   ~23 700 ₽

[Применить рекомендацию]  ← кнопка подставляет рекомендованное значение
```

Подсказка появляется с анимацией fade-in 200ms.
Если город не выбран — показывать только слайдер без подсказки.

---

### Передача бюджета в генерацию

В URL генерации добавить числовое значение:
```
/generating?...&budget=23700
```

В `lib/claude.ts` в промпт добавить:
```typescript
const budgetText = budget > 0 
  ? `Общий бюджет на поездку (транспорт + жильё + питание + развлечения): ${budget.toLocaleString('ru')} ₽`
  : 'Бюджет не указан'

// В промпте:
`${budgetText}. Подбирай транспорт, жильё и активности под этот бюджет.`
```

В `lib/searchParams.ts` обновить парсер — принимать числовое значение budget.

---

### Обратная совместимость

Если budget в URL = 'economy' / 'medium' / 'free' (старый формат) — конвертировать:
```typescript
const BUDGET_MAP = { economy: 8000, medium: 20000, free: 80000 }
```

---

### Чеклист бюджета

- [ ] Слайдер заменяет dropdown бюджета
- [ ] Метки Эконом/Средний/Комфорт/Бизнес/Свободно на слайдере
- [ ] При выборе города + дней — появляется подсказка с разбивкой
- [ ] Кнопка "Применить рекомендацию" подставляет значение
- [ ] Числовое значение бюджета передаётся в URL и в Claude промпт
- [ ] Работает на мобайле (touch-friendly, min-height 48px)
- [ ] Старые URL с budget=medium продолжают работать

