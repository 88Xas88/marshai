import type { SearchParams, InterestType } from '@/types/plan'
import { parseBudget } from '@/lib/cityBudget'

export function parseSearchParams(url: URL): SearchParams {
  const sp = url.searchParams
  const days = parseInt(sp.get('days') ?? '5', 10)
  const paxRaw = sp.get('pax') ?? '1'
  const pax = paxRaw === '5+' ? 5 : Math.max(1, parseInt(paxRaw, 10) || 1)
  return {
    from: sp.get('from') ?? 'Москва',
    to: sp.get('to') ?? 'Санкт-Петербург',
    dates: sp.get('dates') ?? '',
    days: Number.isFinite(days) && days > 0 ? days : 5,
    pax,
    budget: parseBudget(sp.get('budget')),
    interests: (sp.get('interests') as InterestType) ?? 'all',
  }
}

interface DateRange {
  checkIn?: string
  checkOut?: string
  departDate?: string
  returnDate?: string
}

// Поддерживаемые форматы поля dates:
//   "DD-DD.MM"        — "10-15.05" (тот же месяц)
//   "DD.MM-DD.MM"     — "28.04-03.05" (разные месяцы)
//   "DD.MM"           — "10.05" (только дата вылета, обратная = +days)
//   "YYYY-MM-DD"      — ISO single date
//   ""                — пустая строка (вернёт {})
export function inferDateRange(dates: string, days: number): DateRange {
  const year = new Date().getFullYear()

  // 1. "DD-DD.MM" — компактный, тот же месяц
  const sameMonth = dates.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/)
  if (sameMonth) {
    const dStart = parseInt(sameMonth[1], 10)
    const dEnd = parseInt(sameMonth[2], 10)
    const month = parseInt(sameMonth[3], 10)
    const y = sameMonth[4] ? parseInt(sameMonth[4], 10) : pickYear(year, month, dStart)
    const checkIn = iso(y, month, dStart)
    const checkOut = iso(y, month, dEnd)
    return { checkIn, checkOut, departDate: checkIn, returnDate: checkOut }
  }

  // 2. "DD.MM-DD.MM" — разные месяцы
  const crossMonth = dates.match(
    /^(\d{1,2})\.(\d{1,2})\s*[-–]\s*(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/
  )
  if (crossMonth) {
    const d1 = parseInt(crossMonth[1], 10)
    const m1 = parseInt(crossMonth[2], 10)
    const d2 = parseInt(crossMonth[3], 10)
    const m2 = parseInt(crossMonth[4], 10)
    const y1 = crossMonth[5] ? parseInt(crossMonth[5], 10) : pickYear(year, m1, d1)
    // Если "обратно" в более раннем месяце календарного года, значит он переходит на следующий год.
    const y2 = m2 < m1 ? y1 + 1 : y1
    const checkIn = iso(y1, m1, d1)
    const checkOut = iso(y2, m2, d2)
    return { checkIn, checkOut, departDate: checkIn, returnDate: checkOut }
  }

  // 3. "DD.MM" — только вылет, обратная вычисляется по days
  const single = dates.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/)
  if (single) {
    const d = parseInt(single[1], 10)
    const m = parseInt(single[2], 10)
    const y = single[3] ? parseInt(single[3], 10) : pickYear(year, m, d)
    const start = new Date(`${iso(y, m, d)}T00:00:00`)
    const end = new Date(start.getTime() + days * 86400000)
    const checkIn = iso(y, m, d)
    const checkOut = end.toISOString().slice(0, 10)
    return { checkIn, checkOut, departDate: checkIn, returnDate: checkOut }
  }

  // 4. ISO "YYYY-MM-DD"
  const isoSingle = dates.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoSingle) {
    const start = new Date(dates)
    const end = new Date(start.getTime() + days * 86400000)
    return {
      checkIn: dates,
      checkOut: end.toISOString().slice(0, 10),
      departDate: dates,
      returnDate: end.toISOString().slice(0, 10),
    }
  }

  return {}
}

// Если введённая месяц-день уже прошёл в этом году — берём следующий год.
function pickYear(currentYear: number, month: number, day: number): number {
  const candidate = new Date(`${iso(currentYear, month, day)}T23:59:59`)
  if (candidate.getTime() < Date.now()) return currentYear + 1
  return currentYear
}

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
