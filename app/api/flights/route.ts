import { NextResponse } from 'next/server'
import { fetchFlights, fetchFlightsBack } from '@/lib/travelpayouts'
import { parseSearchParams, inferDateRange } from '@/lib/searchParams'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const params = parseSearchParams(url)
  const { departDate, returnDate } = inferDateRange(params.dates, params.days)

  const [there, back] = await Promise.all([
    fetchFlights({
      fromCity: params.from,
      toCity: params.to,
      departDate,
      returnDate,
    }),
    fetchFlightsBack({
      fromCity: params.from,
      toCity: params.to,
      returnDate,
    }),
  ])

  return NextResponse.json({ ok: true, there, back })
}
