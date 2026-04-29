import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import type { Plan, BookingStatus, BookedItems } from '@/types/plan'

const connectionString = process.env.DATABASE_URL

let client: NeonQueryFunction<false, false> | null = null
if (connectionString) {
  client = neon(connectionString)
}

export const dbEnabled = !!client

function db(): NeonQueryFunction<false, false> {
  if (!client) {
    throw new Error('DATABASE_URL is not configured')
  }
  return client
}

export interface SavedPlan {
  id: string
  email?: string
  fromCity: string
  toCity: string
  dates: string
  days: number
  pax: number
  plan: Plan
  bookingStatus: BookingStatus
  bookedItems: BookedItems
  createdAt: string
}

interface PlanRow {
  id: string
  email: string | null
  from_city: string
  to_city: string
  dates: string
  days: number
  pax: number
  plan_json: Plan
  booking_status: BookingStatus | null
  booked_items: BookedItems | null
  created_at: string
}

function rowToSaved(r: PlanRow): SavedPlan {
  return {
    id: r.id,
    email: r.email ?? undefined,
    fromCity: r.from_city,
    toCity: r.to_city,
    dates: r.dates,
    days: r.days,
    pax: r.pax,
    plan: r.plan_json,
    bookingStatus: r.booking_status ?? 'not_booked',
    bookedItems: r.booked_items ?? {},
    createdAt: r.created_at,
  }
}

export async function savePlan(plan: Plan, email?: string): Promise<string | null> {
  if (!client) return plan.id || null
  try {
    const sql = db()
    const rows = (await sql`
      INSERT INTO plans (email, from_city, to_city, dates, days, pax, plan_json, booking_status, booked_items)
      VALUES (
        ${email ?? null},
        ${plan.fromCity},
        ${plan.toCity},
        ${plan.dates},
        ${plan.days},
        ${plan.pax},
        ${JSON.stringify(plan)}::jsonb,
        ${plan.bookingStatus ?? 'not_booked'},
        ${JSON.stringify(plan.bookedItems ?? {})}::jsonb
      )
      RETURNING id::text AS id
    `) as { id: string }[]
    return rows[0]?.id ?? null
  } catch (err) {
    console.error('[db] savePlan failed:', err)
    return null
  }
}

export async function loadPlan(id: string): Promise<SavedPlan | null> {
  if (!client) return null
  try {
    const sql = db()
    const rows = (await sql`
      SELECT id::text, email, from_city, to_city, dates, days, pax, plan_json,
             booking_status, booked_items, created_at::text
      FROM plans
      WHERE id::text = ${id}
      LIMIT 1
    `) as PlanRow[]
    return rows[0] ? rowToSaved(rows[0]) : null
  } catch (err) {
    console.error('[db] loadPlan failed:', err)
    return null
  }
}

export async function getPlansByEmail(email: string): Promise<SavedPlan[]> {
  if (!client) return []
  try {
    const sql = db()
    const rows = (await sql`
      SELECT id::text, email, from_city, to_city, dates, days, pax, plan_json,
             booking_status, booked_items, created_at::text
      FROM plans
      WHERE email = ${email}
      ORDER BY created_at DESC
      LIMIT 50
    `) as PlanRow[]
    return rows.map(rowToSaved)
  } catch (err) {
    console.error('[db] getPlansByEmail failed:', err)
    return []
  }
}

// Привязывает email к существующему плану (UPDATE plans SET email).
// Используется когда пользователь нажимает «Сохранить» уже после генерации:
// сам план уже лежит в БД (его создал /api/generate/stream без email),
// и нужно лишь прикрепить владельца, чтобы он появился в /account.
// Возвращает true если строка обновилась, false если plan_id не найден.
export async function attachEmailToPlan(
  planId: string,
  email: string
): Promise<boolean> {
  if (!client) return false
  try {
    const sql = db()
    const rows = (await sql`
      UPDATE plans
      SET email = ${email}
      WHERE id::text = ${planId}
      RETURNING id::text AS id
    `) as { id: string }[]
    return rows.length > 0
  } catch (err) {
    console.error('[db] attachEmailToPlan failed:', err)
    return false
  }
}

export async function updateBookingStatus(
  planId: string,
  status: BookingStatus,
  bookedItems: BookedItems
): Promise<boolean> {
  if (!client) return false
  try {
    const sql = db()
    await sql`
      UPDATE plans
      SET booking_status = ${status},
          booked_items = ${JSON.stringify(bookedItems)}::jsonb
      WHERE id::text = ${planId}
    `
    return true
  } catch (err) {
    console.error('[db] updateBookingStatus failed:', err)
    return false
  }
}

// --- Users (auth) ---

export interface User {
  id: string
  email: string
  name: string | null
  createdAt: string
  lastLogin: string | null
}

interface UserRow {
  id: string
  email: string
  name: string | null
  created_at: string
  last_login: string | null
}

function userRowToObj(r: UserRow): User {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    createdAt: r.created_at,
    lastLogin: r.last_login,
  }
}

export async function findOrCreateUser(email: string): Promise<User | null> {
  if (!client) return null
  try {
    const sql = db()
    // INSERT ... ON CONFLICT DO UPDATE SET email=EXCLUDED.email — гарантирует RETURNING.
    const rows = (await sql`
      INSERT INTO users (email)
      VALUES (${email})
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id::text, email, name, created_at::text, last_login::text
    `) as UserRow[]
    return rows[0] ? userRowToObj(rows[0]) : null
  } catch (err) {
    console.error('[db] findOrCreateUser failed:', err)
    return null
  }
}

export async function updateLastLogin(userId: string): Promise<void> {
  if (!client) return
  try {
    const sql = db()
    await sql`UPDATE users SET last_login = NOW() WHERE id::text = ${userId}`
  } catch (err) {
    console.error('[db] updateLastLogin failed:', err)
  }
}

// --- Auth tokens (magic link) ---

const TOKEN_TTL_MIN = 15

export async function createAuthToken(
  email: string,
  token: string
): Promise<boolean> {
  if (!client) return false
  try {
    const sql = db()
    await sql`
      INSERT INTO auth_tokens (email, token, expires_at)
      VALUES (${email}, ${token}, NOW() + (${TOKEN_TTL_MIN} || ' minutes')::interval)
    `
    return true
  } catch (err) {
    console.error('[db] createAuthToken failed:', err)
    return false
  }
}

// Атомарно: помечает токен как использованный, если он валиден.
// Возвращает email из токена при успехе, null если токен невалиден/просрочен/использован.
// Сравниваем email строкой (case-insensitive) — пользователи иногда нажимают со ссылок
// в почте с разным регистром.
export async function consumeAuthToken(
  token: string,
  email: string
): Promise<string | null> {
  if (!client) return null
  try {
    const sql = db()
    const rows = (await sql`
      UPDATE auth_tokens
      SET used = true
      WHERE token = ${token}
        AND used = false
        AND expires_at > NOW()
        AND lower(email) = lower(${email})
      RETURNING email
    `) as { email: string }[]
    return rows[0]?.email ?? null
  } catch (err) {
    console.error('[db] consumeAuthToken failed:', err)
    return null
  }
}

// --- Price alerts ---

export interface PriceAlert {
  id: string
  planId: string
  email: string
  lastPriceTransport: number | null
  lastPriceHotel: number | null
  alertedAt: string | null
  createdAt: string
}

interface PriceAlertRow {
  id: string
  plan_id: string
  email: string
  last_price_transport: number | null
  last_price_hotel: number | null
  alerted_at: string | null
  created_at: string
}

function alertRowToObj(r: PriceAlertRow): PriceAlert {
  return {
    id: r.id,
    planId: r.plan_id,
    email: r.email,
    lastPriceTransport: r.last_price_transport,
    lastPriceHotel: r.last_price_hotel,
    alertedAt: r.alerted_at,
    createdAt: r.created_at,
  }
}

export async function createPriceAlert(
  planId: string,
  email: string,
  initialTransportPrice: number | null,
  initialHotelPrice: number | null
): Promise<string | null> {
  if (!client) return null
  try {
    const sql = db()
    const rows = (await sql`
      INSERT INTO price_alerts (plan_id, email, last_price_transport, last_price_hotel)
      VALUES (${planId}::uuid, ${email}, ${initialTransportPrice}, ${initialHotelPrice})
      RETURNING id::text AS id
    `) as { id: string }[]
    return rows[0]?.id ?? null
  } catch (err) {
    console.error('[db] createPriceAlert failed:', err)
    return null
  }
}

export async function getActivePriceAlerts(): Promise<PriceAlert[]> {
  if (!client) return []
  try {
    const sql = db()
    const rows = (await sql`
      SELECT id::text, plan_id::text, email,
             last_price_transport, last_price_hotel,
             alerted_at::text, created_at::text
      FROM price_alerts
      ORDER BY created_at DESC
    `) as PriceAlertRow[]
    return rows.map(alertRowToObj)
  } catch (err) {
    console.error('[db] getActivePriceAlerts failed:', err)
    return []
  }
}
