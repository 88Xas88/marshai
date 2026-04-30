import type { Plan } from '@/types/plan'
import { formatPrice, daysLabel, paxLabel } from '@/lib/format'

export interface PlanMeta {
  title: string
  description: string
}

export function buildPlanMeta(plan: Plan): PlanMeta {
  const bestThere =
    plan.flights.there.find((f) => f.badge === 'best') ?? plan.flights.there[0]
  const bestBack =
    plan.flights.back.find((f) => f.badge === 'best') ?? plan.flights.back[0]
  const bestHotel = plan.hotels[0]

  const total =
    (bestThere?.price ?? 0) +
    (bestBack?.price ?? 0) +
    (bestHotel?.totalPrice ?? 0)

  const route = `${plan.fromCity} → ${plan.toCity}`
  const title =
    total > 0
      ? `${route} · от ${formatPrice(total)} за ${daysLabel(plan.days)}`
      : `${route} · ${daysLabel(plan.days)}`

  const parts = [
    `${route} (${plan.dates}, ${daysLabel(plan.days)}, ${paxLabel(plan.pax)})`,
  ]
  if (bestThere) parts.push(`${bestThere.carrier} от ${formatPrice(bestThere.price)}`)
  if (bestHotel)
    parts.push(`${bestHotel.name}, ${bestHotel.rating}★ от ${formatPrice(bestHotel.pricePerNight)}/ночь`)
  parts.push('Маршрут по дням и карта.')

  // 240-символьный лимит — Twitter / Telegram превью обрезают примерно тут.
  const description = parts.join('. ').slice(0, 240)

  return { title, description }
}
