import { findCity } from './cities'
import type { Flight } from '@/types/plan'

interface SearchParams {
  fromCity: string
  toCity: string
  date?: string
}

interface RaspSegment {
  thread: { number: string; title: string; transport_type?: string }
  departure: string
  arrival: string
  duration: number
  from: { title: string }
  to: { title: string }
  tickets_info?: { places?: { price?: { whole?: number } }[] }
}

interface RaspResponse {
  segments?: RaspSegment[]
}

export async function fetchTrains(p: SearchParams): Promise<Flight[]> {
  const apikey = process.env.YANDEX_RASP_KEY
  const from = findCity(p.fromCity)?.code
  const to = findCity(p.toCity)?.code
  if (!apikey || !from || !to) return []

  const url = new URL('https://api.rasp.yandex.net/v3.0/search/')
  url.searchParams.set('from', from)
  url.searchParams.set('to', to)
  url.searchParams.set('transport_types', 'train')
  url.searchParams.set('apikey', apikey)
  if (p.date) url.searchParams.set('date', p.date)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 600 } })
    if (!res.ok) return []
    const json = (await res.json()) as RaspResponse
    return (json.segments ?? []).slice(0, 5).map((s, i) => {
      const price =
        s.tickets_info?.places?.[0]?.price?.whole ?? 2500
      return {
        id: `rasp-${i}`,
        type: 'train',
        carrier: s.thread.title,
        number: s.thread.number,
        departTime: s.departure.slice(11, 16),
        arriveTime: s.arrival.slice(11, 16),
        departCity: s.from.title,
        arriveCity: s.to.title,
        duration: formatSeconds(s.duration),
        price: Math.round(price),
        url: `https://www.tutu.ru/poezda/?from=${encodeURIComponent(p.fromCity)}&to=${encodeURIComponent(p.toCity)}`,
      }
    })
  } catch {
    return []
  }
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h} ч ${m.toString().padStart(2, '0')} мин`
}
