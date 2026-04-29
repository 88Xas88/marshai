export function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value) + ' ₽'
}

export function formatPriceShort(value: number): string {
  if (value >= 1000) {
    const k = Math.round(value / 100) / 10
    return `${k.toFixed(k % 1 === 0 ? 0 : 1)}k ₽`
  }
  return `${value} ₽`
}

const MONTHS_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export function formatDay(date: Date): string {
  const d = date.getDate()
  const m = MONTHS_GEN[date.getMonth()]
  const w = WEEKDAYS_SHORT[date.getDay()]
  return `${d} ${m}, ${w}`
}

export function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

export function paxLabel(n: number): string {
  return `${n} ${plural(n, ['человек', 'человека', 'человек'])}`
}

export function daysLabel(n: number): string {
  return `${n} ${plural(n, ['день', 'дня', 'дней'])}`
}

export function nightsLabel(n: number): string {
  return `${n} ${plural(n, ['ночь', 'ночи', 'ночей'])}`
}
