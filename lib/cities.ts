import type { City } from '@/types/plan'

export const CITIES: City[] = [
  { name: 'Москва', code: 'MOW', region: 'Россия' },
  { name: 'Санкт-Петербург', code: 'LED', region: 'Россия' },
  { name: 'Сочи', code: 'AER', region: 'Краснодарский край' },
  { name: 'Казань', code: 'KZN', region: 'Татарстан' },
  { name: 'Калининград', code: 'KGD', region: 'Россия' },
  { name: 'Владивосток', code: 'VVO', region: 'Приморский край' },
  { name: 'Екатеринбург', code: 'SVX', region: 'Свердловская область' },
  { name: 'Новосибирск', code: 'OVB', region: 'Россия' },
  { name: 'Краснодар', code: 'KRR', region: 'Краснодарский край' },
  { name: 'Нижний Новгород', code: 'GOJ', region: 'Россия' },
  { name: 'Ростов-на-Дону', code: 'ROV', region: 'Россия' },
  { name: 'Самара', code: 'KUF', region: 'Россия' },
  { name: 'Уфа', code: 'UFA', region: 'Башкортостан' },
  { name: 'Челябинск', code: 'CEK', region: 'Россия' },
  { name: 'Пермь', code: 'PEE', region: 'Россия' },
  { name: 'Минеральные Воды', code: 'MRV', region: 'Ставропольский край' },
  { name: 'Иркутск', code: 'IKT', region: 'Россия' },
  { name: 'Красноярск', code: 'KJA', region: 'Россия' },
  { name: 'Тюмень', code: 'TJM', region: 'Россия' },
  { name: 'Махачкала', code: 'MCX', region: 'Дагестан' },
  { name: 'Якутск', code: 'YKS', region: 'Якутия' },
  { name: 'Хабаровск', code: 'KHV', region: 'Россия' },
  { name: 'Архангельск', code: 'ARH', region: 'Россия' },
  { name: 'Мурманск', code: 'MMK', region: 'Россия' },
  { name: 'Петрозаводск', code: 'PES', region: 'Карелия' },
  { name: 'Псков', code: 'PKV', region: 'Россия' },
  { name: 'Великий Новгород', code: 'NVR', region: 'Россия' },
  { name: 'Тверь', code: 'KLD', region: 'Россия' },
  { name: 'Тула', code: 'TUL', region: 'Россия' },
  { name: 'Ярославль', code: 'IAR', region: 'Россия' },
  { name: 'Кострома', code: 'KMW', region: 'Россия' },
  { name: 'Иваново', code: 'IWA', region: 'Россия' },
  { name: 'Владимир', code: 'VLM', region: 'Россия' },
  { name: 'Суздаль', code: 'SUZ', region: 'Россия' },
  { name: 'Рязань', code: 'RZN', region: 'Россия' },
  { name: 'Воронеж', code: 'VOZ', region: 'Россия' },
  { name: 'Волгоград', code: 'VOG', region: 'Россия' },
  { name: 'Астрахань', code: 'ASF', region: 'Россия' },
  { name: 'Анапа', code: 'AAQ', region: 'Краснодарский край' },
  { name: 'Геленджик', code: 'GDZ', region: 'Краснодарский край' },
  { name: 'Симферополь', code: 'SIP', region: 'Крым' },
  { name: 'Ставрополь', code: 'STW', region: 'Россия' },
  { name: 'Грозный', code: 'GRV', region: 'Чечня' },
  { name: 'Кисловодск', code: 'KSL', region: 'Ставропольский край' },
  { name: 'Омск', code: 'OMS', region: 'Россия' },
  { name: 'Барнаул', code: 'BAX', region: 'Алтайский край' },
  { name: 'Горно-Алтайск', code: 'RGK', region: 'Алтай' },
  { name: 'Улан-Удэ', code: 'UUD', region: 'Бурятия' },
  { name: 'Чита', code: 'HTA', region: 'Россия' },
  { name: 'Южно-Сахалинск', code: 'UUS', region: 'Сахалин' },
]

export function searchCities(query: string, exclude?: string): City[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase().trim()
  return CITIES.filter(
    (c) => c.name.toLowerCase().startsWith(q) && c.name !== exclude
  ).slice(0, 8)
}

export function findCity(name: string): City | undefined {
  return CITIES.find((c) => c.name === name)
}
