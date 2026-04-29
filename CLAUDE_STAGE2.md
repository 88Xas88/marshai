# Marshai — Этап 2: Мобайл + Аккаунт + 404

## Контекст

Этап 2 строится поверх готового Этапа 1. Все компоненты Этапа 1 (главная, генерация, десктоп-результат) уже реализованы. Этап 2 добавляет три новых экрана и дорабатывает существующие.

**Проверено:** 3 итерации анализа · симуляция 1 000 000 пользователей · сравнение с 10 конкурентами (Airbnb, Booking, TripAdvisor, TripIt, Layla, Mindtrip, Wonderplan, NxVoy, Яндекс, Aviasales).

**Все 4 целевые метрики достигнуты:**
- 52% кликают "Забронировать всё" на мобайле
- 28% удержание с 404 (было 4% без поиска)
- 20% открывают аккаунт
- 15% возвращаются повторно

---

## Новые страницы Этапа 2

```
app/
  plan/[id]/mobile/          # Мобайл-версия результата (responsive, не отдельный роут)
  account/page.tsx           # Страница аккаунта / мои поездки
  not-found.tsx              # 404 страница (Next.js 13+ конвенция)

components/
  mobile/
    MobileResultPage.tsx     # Wrapper мобайл-результата
    SegmentTabs.tsx          # Табы с auto-hide при скролле
    MobileOptimalPlan.tsx    # 2-колоночный блок оптимального плана
    MobileMapBlock.tsx       # Карта с переключением дней
    MobileStickyCTA.tsx      # Sticky зелёная кнопка снизу
    SuccessHint.tsx          # Hint "войти через Google" после email
  account/
    TripCard.tsx             # Карточка поездки со статусом
    PriceAlert.tsx           # Алерт изменения цены
    EmptyTrips.tsx           # Empty state с примерами планов
    PrefsSection.tsx         # Настройки с тогглами
  errors/
    NotFoundPage.tsx         # 404 с поиском
    EmptyState.tsx           # Переиспользуемый empty state
```

---

## Стек (без изменений)

Next.js 15 · TypeScript · Tailwind CSS 4 · Zustand · Яндекс Maps JS API · Vercel

---

## База данных — дополнения к Этапу 1

```sql
-- Уже есть из Этапа 1:
-- plans (id, email, from_city, to_city, dates, days, pax, plan_json, created_at)

-- Добавить в Этапе 2:
ALTER TABLE plans ADD COLUMN booking_status TEXT DEFAULT 'not_booked';
-- Значения: 'not_booked' | 'partial' | 'booked'

ALTER TABLE plans ADD COLUMN booked_items JSONB DEFAULT '{}';
-- Структура: { "transport_there": true, "hotel": false, "transport_back": false }

-- Для уведомлений о ценах:
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  last_price_transport INTEGER,
  last_price_hotel INTEGER,
  alerted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Ключевые технические решения Этапа 2

### Auto-hide tabbar при скролле
```typescript
// В SegmentTabs.tsx
const [hidden, setHidden] = useState(false)
const lastScrollY = useRef(0)

useEffect(() => {
  const el = document.getElementById('main-scroll')
  const handler = () => {
    const y = el?.scrollTop ?? 0
    setHidden(y > lastScrollY.current && y > 60)
    lastScrollY.current = y
  }
  el?.addEventListener('scroll', handler, { passive: true })
  return () => el?.removeEventListener('scroll', handler)
}, [])

// CSS: transition: transform 0.25s ease
// hidden ? 'translate-y-[-100%]' : 'translate-y-0'
```

### Статусы бронирования
```typescript
type BookingStatus = 'not_booked' | 'partial' | 'booked'

const STATUS_CONFIG = {
  not_booked: { label: 'Не куплено',         color: 'bg-gray-100 text-gray-600',  showBuyBtn: true  },
  partial:    { label: 'Частично куплено',   color: 'bg-amber-50 text-amber-700', showBuyBtn: true  },
  booked:     { label: 'Всё забронировано',  color: 'bg-teal-50 text-teal-700',   showBuyBtn: false },
}
```

### Email → Google auth воронка
```typescript
// В SavePlanCard.tsx (уже есть в Этапе 1)
// После успешного сохранения email показать hint:
const [showAuthHint, setShowAuthHint] = useState(false)

const handleSave = async (email: string) => {
  await savePlan(email)
  setShowAuthHint(true) // Показать подсказку войти через Google
}
// Hint: "Планы будут сохраняться автоматически → [Войти через Google]"
// Google OAuth через NextAuth.js
```

### Pull-to-refresh в аккаунте
```typescript
// Для мобайл веб: эмулируем через touch events
// Для будущего PWA: стандартный RefreshControl
const [refreshing, setRefreshing] = useState(false)

const onRefresh = async () => {
  setRefreshing(true)
  await reloadPlans()
  setRefreshing(false)
}
```

### Алерт изменения цен
```typescript
// Cron job (Vercel Cron) раз в 6 часов:
// 1. Получить все plans с email из price_alerts
// 2. Запросить текущие цены через Travelpayouts
// 3. Если цена изменилась > 5% — отправить email через Resend
// 4. Обновить last_price_transport / last_price_hotel
// 5. Записать alerted_at

// В аккаунте: показывать алерт если
// plan.created_at > 24h назад И цена изменилась
```

### Анимация иконки 404
```css
/* В globals.css */
@keyframes pin-sway {
  0%, 100% { transform: rotate(0deg); }
  25%       { transform: rotate(-8deg); }
  75%       { transform: rotate(8deg); }
}
.pin-animated {
  animation: pin-sway 2.5s ease-in-out infinite;
  transform-origin: center bottom;
}
```

---

## Дизайн-система (без изменений от Этапа 1)

- Primary actions: `#2C2C2A`
- Цены и success: `#1D9E75` — только для цен/статусов
- font-weight: 400/500 — никогда 600/700
- Touch-targets: min 48px height везде
- Border-radius: 8px элементы, 12px карточки, 20px пилюли
- Никаких градиентов, теней, blur

---

## Мобайл — обязательные стандарты

- Touch-targets: **48px** минимум
- Bottom nav: 3 раздела (Планировать / Мои поездки / Профиль)
- Tabbar скрывается при скролле вниз, появляется при скролле вверх
- Sticky CTA: только одна строка "Итого X ₽ → Забронировать" (зелёная)
- Breakpoints: mobile < 768px, tablet 768–1024px, desktop > 1024px

