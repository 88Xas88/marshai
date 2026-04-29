import { fetchFlights, fetchFlightsBack, fetchHotels } from '@/lib/travelpayouts'
import { generateItinerary } from '@/lib/claude'
import { parseSearchParams, inferDateRange } from '@/lib/searchParams'
import { cacheGet, cacheSet, planCacheKey } from '@/lib/redis'
import { savePlan } from '@/lib/db'
import type { EngageAnswers, Flight, Hotel, Plan } from '@/types/plan'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
// Не пытаемся пре-рендерить SSE-роут.
export const dynamic = 'force-dynamic'

interface CachedPayload {
  flights: { there: Flight[]; back: Flight[] }
  hotels: Hotel[]
  itinerary: Plan['itinerary']
  optimal: Plan['optimal']
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const params = parseSearchParams(url)
  const engage: EngageAnswers = {
    priority: url.searchParams.get('priority') ?? undefined,
    pace: url.searchParams.get('pace') ?? undefined,
    dailyBudget: url.searchParams.get('dailyBudget') ?? undefined,
  }
  const range = inferDateRange(params.dates, params.days)

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      const closed = { value: false }
      const close = () => {
        if (closed.value) return
        closed.value = true
        try { controller.close() } catch { /* ignore */ }
      }

      send('start', { params })

      const cacheKey = planCacheKey({
        from: params.from,
        to: params.to,
        dates: params.dates,
      })
      const cached = await cacheGet<CachedPayload>(cacheKey)
      if (cached) {
        send('flights', cached.flights)
        send('hotels', cached.hotels)
        send('itinerary', { days: cached.itinerary, optimal: cached.optimal })

        const planId = await persistPlan({
          ...cached,
          params,
        })
        send('done', { planId })
        close()
        return
      }

      const flightsP = (async () => {
        const [there, back] = await Promise.all([
          fetchFlights({
            fromCity: params.from,
            toCity: params.to,
            departDate: range.departDate,
            returnDate: range.returnDate,
          }),
          fetchFlightsBack({
            fromCity: params.from,
            toCity: params.to,
            returnDate: range.returnDate,
          }),
        ])
        send('flights', { there, back })
        return { there, back }
      })()

      const hotelsP = (async () => {
        const hotels = await fetchHotels({
          toCity: params.to,
          checkIn: range.checkIn,
          checkOut: range.checkOut,
          adults: params.pax,
        })
        send('hotels', hotels)
        return hotels
      })()

      // Маршрут зависит от лучших вариантов транспорта/отеля для контекста промпта.
      const itineraryP = (async () => {
        const [{ there, back }, hotels] = await Promise.all([flightsP, hotelsP])
        const bestFlight = there[0]
        const bestFlightBack = back[0]
        const bestHotel = hotels[0]
        const result = await generateItinerary({
          params,
          engage,
          bestFlight,
          bestFlightBack,
          bestHotel,
        })
        send('itinerary', result)
        return result
      })()

      const settled = await Promise.allSettled([flightsP, hotelsP, itineraryP])
      const [flightsR, hotelsR, itineraryR] = settled

      if (flightsR.status === 'rejected') send('error', { stage: 'flights' })
      if (hotelsR.status === 'rejected') send('error', { stage: 'hotels' })
      if (itineraryR.status === 'rejected') send('error', { stage: 'itinerary' })

      const flights =
        flightsR.status === 'fulfilled' ? flightsR.value : { there: [], back: [] }
      const hotels = hotelsR.status === 'fulfilled' ? hotelsR.value : []
      const itin =
        itineraryR.status === 'fulfilled'
          ? itineraryR.value
          : { days: [], optimal: emptyOptimal() }

      const payload: CachedPayload = {
        flights,
        hotels,
        itinerary: itin.days,
        optimal: itin.optimal,
      }
      await cacheSet(cacheKey, payload, 7200)

      const planId = await persistPlan({ ...payload, params })
      send('done', { planId })
      close()
    },
    cancel() {
      // клиент отвалился — ничего страшного
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}

function emptyOptimal() {
  return {
    transport_there: { name: '', why: '', price: '' },
    hotel: { name: '', why: '', price_per_night: '' },
    transport_back: { name: '', why: '', price: '' },
  }
}

interface PersistArgs extends CachedPayload {
  params: ReturnType<typeof parseSearchParams>
}

async function persistPlan(args: PersistArgs): Promise<string> {
  const id = randomUUID()
  const plan: Plan = {
    id,
    fromCity: args.params.from,
    toCity: args.params.to,
    dates: args.params.dates || 'ближайшие даты',
    days: args.params.days,
    pax: args.params.pax,
    budget: args.params.budget,
    interests: args.params.interests,
    flights: args.flights,
    hotels: args.hotels,
    itinerary: args.itinerary,
    optimal: args.optimal,
    createdAt: new Date().toISOString(),
    bookingStatus: 'not_booked',
  }
  const dbId = await savePlan(plan)
  return dbId ?? id
}
