import { NextResponse } from 'next/server'
import { generateItinerary } from '@/lib/claude'
import { parseSearchParams } from '@/lib/searchParams'
import type { EngageAnswers } from '@/types/plan'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const params = parseSearchParams(url)
  let body: { engage?: EngageAnswers } = {}
  try {
    body = (await req.json()) as { engage?: EngageAnswers }
  } catch {
    body = {}
  }

  const result = await generateItinerary({ params, engage: body.engage })
  return NextResponse.json({ ok: true, ...result })
}
