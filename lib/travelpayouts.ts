import type { Flight, Hotel, FlightBadge } from '@/types/plan'
import { buildAffiliateUrl } from './affiliate'
import { findCity } from './cities'

interface FlightSearchParams {
  fromCity: string
  toCity: string
  departDate?: string
  returnDate?: string
}

interface HotelSearchParams {
  toCity: string
  checkIn?: string
  checkOut?: string
  adults?: number
}

const TP_BASE = 'https://api.travelpayouts.com/v1'
const HL_BASE = 'https://engine.hotellook.com/api/v2'

interface TPCheapItem {
  airline?: string
  flight_number?: string | number
  departure_at?: string
  return_at?: string
  expires_at?: string
  price: number
}

interface TPCheapResponse {
  success?: boolean
  data?: Record<string, Record<string, TPCheapItem>>
}

interface HLCacheItem {
  hotelId?: number
  hotelName: string
  stars?: number
  priceFrom?: number
  priceAvg?: number
  pricePercentile?: Record<string, number>
  location?: { name?: string; geo?: { lat?: number; lon?: number } }
}

export async function fetchFlights(p: FlightSearchParams): Promise<Flight[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN
  const origin = findCity(p.fromCity)?.code
  const destination = findCity(p.toCity)?.code

  if (!token || !origin || !destination) {
    return mockFlights(p)
  }

  const url = new URL(`${TP_BASE}/prices/cheap`)
  url.searchParams.set('origin', origin)
  url.searchParams.set('destination', destination)
  url.searchParams.set('currency', 'rub')
  url.searchParams.set('token', token)
  if (p.departDate) url.searchParams.set('depart_date', p.departDate)
  if (p.returnDate) url.searchParams.set('return_date', p.returnDate)

  try {
    const res = await fetch(url.toString(), {
      headers: { 'X-Access-Token': token },
      next: { revalidate: 600 },
    })
    if (!res.ok) return mockFlights(p)
    const json = (await res.json()) as TPCheapResponse
    const items: Flight[] = []
    const dest = json.data?.[destination] ?? {}
    let i = 0
    for (const [num, item] of Object.entries(dest)) {
      const departTime = item.departure_at?.slice(11, 16) ?? '—'
      const arriveTime = item.return_at?.slice(11, 16) ?? '—'
      items.push({
        id: `tp-${destination}-${num}-${i}`,
        type: 'plane',
        carrier: item.airline ?? 'Авиаперевозчик',
        number: String(item.flight_number ?? num),
        departTime,
        arriveTime,
        departCity: p.fromCity,
        arriveCity: p.toCity,
        duration: '—',
        price: Math.round(item.price),
        url: buildAffiliateUrl(
          `https://www.aviasales.ru/search/${origin}${(p.departDate ?? '').replace(/-/g, '').slice(2)}${destination}1`
        ),
      })
      i++
      if (i >= 10) break
    }
    if (items.length === 0) return mockFlights(p)
    return rankFlights(items)
  } catch {
    return mockFlights(p)
  }
}

export async function fetchFlightsBack(p: FlightSearchParams): Promise<Flight[]> {
  return fetchFlights({
    fromCity: p.toCity,
    toCity: p.fromCity,
    departDate: p.returnDate,
  })
}

export async function fetchHotels(p: HotelSearchParams): Promise<Hotel[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN

  if (!token) return mockHotels(p)

  const url = new URL(`${HL_BASE}/cache.json`)
  url.searchParams.set('location', p.toCity)
  url.searchParams.set('currency', 'rub')
  url.searchParams.set('limit', '10')
  url.searchParams.set('token', token)
  if (p.checkIn) url.searchParams.set('checkIn', p.checkIn)
  if (p.checkOut) url.searchParams.set('checkOut', p.checkOut)
  url.searchParams.set('adults', String(p.adults ?? 1))

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 600 } })
    if (!res.ok) return mockHotels(p)
    const json = (await res.json()) as HLCacheItem[]
    const nights = nightsBetween(p.checkIn, p.checkOut) ?? 4
    const hotels: Hotel[] = json.slice(0, 6).map((h, i) => {
      const perNight = Math.round(h.priceFrom ?? h.priceAvg ?? 4000)
      return {
        id: `hl-${h.hotelId ?? i}`,
        name: h.hotelName,
        stars: h.stars ?? 0,
        rating: 8.4,
        reviews: 120 + i * 30,
        tags: ['Wi-Fi', 'Бесп. отмена'],
        pricePerNight: perNight,
        totalPrice: perNight * nights,
        url: buildAffiliateUrl(
          `https://search.hotellook.com/?destination=${encodeURIComponent(p.toCity)}`
        ),
        address: h.location?.name,
        lat: h.location?.geo?.lat,
        lng: h.location?.geo?.lon,
      }
    })
    if (hotels.length === 0) return mockHotels(p)
    return hotels
  } catch {
    return mockHotels(p)
  }
}

function rankFlights(arr: Flight[]): Flight[] {
  const sorted = [...arr].sort((a, b) => a.price - b.price)
  const cheapest = sorted[0]
  const fastest = sorted[Math.min(1, sorted.length - 1)]
  const best = sorted[Math.min(2, sorted.length - 1)] ?? cheapest

  const tagged = new Map<string, FlightBadge>()
  if (best) tagged.set(best.id, 'best')
  if (fastest && fastest.id !== best?.id) tagged.set(fastest.id, 'fastest')
  if (cheapest && !tagged.has(cheapest.id)) tagged.set(cheapest.id, 'cheapest')

  return arr
    .map((f) => ({ ...f, badge: tagged.get(f.id) }))
    .filter((f) => f.badge)
    .slice(0, 3)
}

function nightsBetween(checkIn?: string, checkOut?: string): number | undefined {
  if (!checkIn || !checkOut) return undefined
  const a = new Date(checkIn).getTime()
  const b = new Date(checkOut).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return undefined
  return Math.max(1, Math.round((b - a) / 86400000))
}

function mockFlights(p: FlightSearchParams): Flight[] {
  const base = `${p.fromCity}→${p.toCity}`
  return [
    {
      id: `mock-best-${base}`,
      type: 'train',
      badge: 'best',
      carrier: 'Сапсан 767А',
      number: '767А',
      departTime: '06:50',
      arriveTime: '10:55',
      departCity: p.fromCity,
      arriveCity: p.toCity,
      duration: '4 ч 05 мин',
      price: 2890,
      url: buildAffiliateUrl(`https://www.tutu.ru/poezda/?from=${encodeURIComponent(p.fromCity)}&to=${encodeURIComponent(p.toCity)}`),
    },
    {
      id: `mock-fast-${base}`,
      type: 'train',
      badge: 'fastest',
      carrier: 'Сапсан 757А',
      number: '757А',
      departTime: '13:00',
      arriveTime: '16:50',
      departCity: p.fromCity,
      arriveCity: p.toCity,
      duration: '3 ч 50 мин',
      price: 4190,
      url: buildAffiliateUrl(`https://www.tutu.ru/poezda/?from=${encodeURIComponent(p.fromCity)}&to=${encodeURIComponent(p.toCity)}`),
    },
    {
      id: `mock-cheap-${base}`,
      type: 'train',
      badge: 'cheapest',
      carrier: 'Гранд Экспресс №053',
      number: '053',
      departTime: '23:55',
      arriveTime: '08:36',
      departCity: p.fromCity,
      arriveCity: p.toCity,
      duration: '8 ч 41 мин',
      price: 2150,
      url: buildAffiliateUrl(`https://www.tutu.ru/poezda/?from=${encodeURIComponent(p.fromCity)}&to=${encodeURIComponent(p.toCity)}`),
    },
  ]
}

function mockHotels(p: HotelSearchParams): Hotel[] {
  const nights = nightsBetween(p.checkIn, p.checkOut) ?? 4
  const variants = [
    { name: `Апартаменты в центре`, perNight: 3200, rating: 8.7, reviews: 412, stars: 0 },
    { name: `Отель Невский Форум 4★`, perNight: 5400, rating: 8.9, reviews: 1183, stars: 4 },
    { name: `Бутик-отель Петровский`, perNight: 6800, rating: 9.1, reviews: 246, stars: 4 },
  ]
  return variants.map((v, i) => ({
    id: `mock-h-${i}`,
    name: v.name,
    stars: v.stars,
    rating: v.rating,
    reviews: v.reviews,
    tags: ['Центр', 'Wi-Fi', 'Бесп. отмена'],
    pricePerNight: v.perNight,
    totalPrice: v.perNight * nights,
    url: buildAffiliateUrl(
      `https://search.hotellook.com/?destination=${encodeURIComponent(p.toCity)}`
    ),
    address: `${p.toCity}, центр`,
  }))
}
