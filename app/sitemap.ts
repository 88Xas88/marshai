import type { MetadataRoute } from 'next'

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://marshai.ru').replace(
  /\/$/,
  ''
)

// User-saved планы (с email) НЕ включаем — это приватные данные.
// /account, /account/login, /auth/verify, /generating, /api/* — служебные,
// не имеют смысла в индексе.
//
// Когда появится курируемый набор «featured»-планов в БД — добавим их сюда
// (например, через флаг `featured = true` в plans).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/plan/example-spb`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
