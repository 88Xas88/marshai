import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://marshai.ru').replace(
  /\/$/,
  ''
)

// User-saved планы (с email) НЕ включаем — это приватные данные.
// /account, /account/login, /auth/verify, /generating, /api/* — служебные.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const posts = getAllPosts()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/blog`,
      lastModified: posts[0]?.publishedAt ? new Date(posts[0].publishedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE}/plan/example-spb`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt ?? p.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticEntries, ...blogEntries]
}
