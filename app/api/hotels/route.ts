import { NextResponse } from 'next/server'
import { fetchHotels } from '@/lib/travelpayouts'
import { parseSearchParams, inferDateRange } from '@/lib/searchParams'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const params = parseSearchParams(url)
  const { checkIn, checkOut } = inferDateRange(params.dates, params.days)

  const hotels = await fetchHotels({
    toCity: params.to,
    checkIn,
    checkOut,
    adults: params.pax,
  })

  return NextResponse.json({ ok: true, hotels })
}
