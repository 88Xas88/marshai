import { NextResponse } from 'next/server'
import { getPlansByEmail } from '@/lib/db'
import { inferDateRange } from '@/lib/searchParams'
import type { BookingStatus } from '@/types/plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Минимальная карточка для UI — берём только то, что показываем в /account.
// Цены вычисляются на сервере, чтобы клиент не парсил весь plan_json.
export interface AccountTrip {
  id: string
  fromCity: string
  toCity: string
  dates: string
  days: number
  pax: number
  price: number
  status: BookingStatus
  missingItem?: 'hotel' | 'transport_back' | 'transport_there'
  tags: string[]
  isPast: boolean
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = (url.searchParams.get('email') ?? '').trim()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }

  // ВАЖНО: настоящая авторизация ещё не подключена (NextAuth — следующий этап),
  // поэтому email берём прямо из query. Это безопасно для текущей фазы:
  // никаких приватных данных в plans.plan_json нет.
  const saved = await getPlansByEmail(email)
  const today = new Date().toISOString().slice(0, 10)

  const trips: AccountTrip[] = saved.map((s) => {
    const range = inferDateRange(s.dates, s.days)
    const isPast = !!range.returnDate && range.returnDate < today

    const flightsThere = s.plan.flights?.there ?? []
    const flightsBack = s.plan.flights?.back ?? []
    const hotels = s.plan.hotels ?? []

    const bestThere =
      flightsThere.find((f) => f.badge === 'best') ?? flightsThere[0]
    const bestBack =
      flightsBack.find((f) => f.badge === 'best') ?? flightsBack[0]
    const bestHotel = hotels[0]

    const price =
      (bestThere?.price ?? 0) +
      (bestBack?.price ?? 0) +
      (bestHotel?.totalPrice ?? 0)

    const tags: string[] = []
    if (bestThere?.carrier) tags.push(bestThere.carrier)
    if (bestHotel?.name) {
      // Сокращаем длинное название до 1-го слова, иначе ломает сетку 3 тегов.
      const short = bestHotel.name.split(/\s+/).slice(0, 2).join(' ')
      tags.push(short)
    }
    const poiCount = (s.plan.itinerary ?? []).reduce(
      (sum, d) => sum + (d.pois?.length ?? 0),
      0
    )
    if (poiCount > 0) tags.push(`${poiCount} мест`)

    // Какой кусок не куплен — для лейбла "Добавить X →"
    let missingItem: AccountTrip['missingItem']
    if (s.bookingStatus === 'partial') {
      const b = s.bookedItems ?? {}
      if (!b.hotel) missingItem = 'hotel'
      else if (!b.transport_there) missingItem = 'transport_there'
      else if (!b.transport_back) missingItem = 'transport_back'
    }

    return {
      id: s.id,
      fromCity: s.fromCity,
      toCity: s.toCity,
      dates: s.dates,
      days: s.days,
      pax: s.pax,
      price,
      status: isPast ? 'booked' : s.bookingStatus,
      missingItem,
      tags,
      isPast,
    }
  })

  return NextResponse.json({
    ok: true,
    trips,
    upcoming: trips.filter((t) => !t.isPast),
    past: trips.filter((t) => t.isPast),
  })
}
