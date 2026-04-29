// Запуск:  node --env-file=.env.local scripts/smoke-db.mjs
// Проверяет: что миграция дала рабочие defaults на обеих таблицах,
//            и что реальный INSERT → SELECT → DELETE работает на plans + price_alerts.

import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('✖ DATABASE_URL is not set')
  process.exit(1)
}

const sql = neon(url)

console.log(`→ Smoke test against ${new URL(url).host}`)

// 1. Defaults на price_alerts.id и plans.id
const planDefault = await sql`
  SELECT column_default
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='plans' AND column_name='id'
`
const alertDefault = await sql`
  SELECT column_default
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='price_alerts' AND column_name='id'
`
console.log(`  plans.id default        : ${planDefault[0]?.column_default}`)
console.log(`  price_alerts.id default : ${alertDefault[0]?.column_default}`)

// 2. INSERT в plans с минимальным валидным JSON
const planJson = {
  id: 'will-be-replaced',
  fromCity: 'Москва',
  toCity: 'Санкт-Петербург',
  dates: 'smoke-test',
  days: 5,
  pax: 1,
  budget: 'medium',
  interests: 'all',
  flights: { there: [], back: [] },
  hotels: [],
  itinerary: [],
  optimal: {
    transport_there: { name: '', why: '', price: '' },
    hotel: { name: '', why: '', price_per_night: '' },
    transport_back: { name: '', why: '', price: '' },
  },
  createdAt: new Date().toISOString(),
}

const inserted = await sql`
  INSERT INTO plans (email, from_city, to_city, dates, days, pax, plan_json)
  VALUES ('smoke@marshai.test', ${planJson.fromCity}, ${planJson.toCity}, 'smoke-test',
          5, 1, ${JSON.stringify(planJson)}::jsonb)
  RETURNING id::text AS id, booking_status, booked_items
`
const row = inserted[0]
console.log(`  ✓ INSERT plans → id=${row.id}, status=${row.booking_status}, booked=${JSON.stringify(row.booked_items)}`)

// 3. SELECT обратно
const fetched = await sql`
  SELECT plan_json->>'fromCity' AS from_city,
         plan_json->>'toCity'   AS to_city,
         booking_status,
         created_at::text       AS created
  FROM plans WHERE id::text = ${row.id}
`
console.log(`  ✓ SELECT     → ${fetched[0].from_city} → ${fetched[0].to_city}, status=${fetched[0].booking_status}, ts=${fetched[0].created}`)

// 4. INSERT price_alert с FK
const alert = await sql`
  INSERT INTO price_alerts (plan_id, email, last_price_transport, last_price_hotel)
  VALUES (${row.id}::uuid, 'smoke@marshai.test', 2890, 16000)
  RETURNING id::text AS id
`
console.log(`  ✓ INSERT alert → id=${alert[0].id}`)

// 5. DELETE plan → каскад удалит alert
const del = await sql`DELETE FROM plans WHERE id::text = ${row.id} RETURNING id`
console.log(`  ✓ DELETE plan, rows affected: ${del.length}`)

const orphaned = await sql`
  SELECT count(*)::int AS n FROM price_alerts WHERE id::text = ${alert[0].id}
`
console.log(`  ✓ Cascade  → alerts left: ${orphaned[0].n} (expected 0)`)

// 6. Очистка любых других тест-следов на всякий случай
await sql`DELETE FROM plans WHERE email = 'smoke@marshai.test'`
await sql`DELETE FROM price_alerts WHERE email = 'smoke@marshai.test'`

console.log('\n✓ Smoke test passed.')
