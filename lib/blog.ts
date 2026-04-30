import { marked } from 'marked'
import { listPublished, getPublishedBySlug, type BlogArticle } from '@/lib/blog-db'

// === Публичный фасад блога ===
//
// До stage 5 статьи лежали в content/blog/*.md и читались с диска. Теперь
// источник — таблица blog_articles в Neon. Этот файл — тонкий слой над
// blog-db.ts: парсит markdown в HTML + вычисляет метаданные.
//
// Файлы content/blog/*.md остаются как backup в репо, но в рантайме не
// читаются (импортированы в БД через scripts/migrate-blog-files.mjs).

export interface PostMeta {
  title: string
  slug: string
  description: string
  keywords?: string[]
  publishedAt: string
  updatedAt?: string
  readingMinutes: number
}

export interface Post extends PostMeta {
  contentMarkdown: string
  contentHtml: string
}

// Грубая оценка: 180 слов/мин для русскоязычного читателя.
function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 180))
}

function articleToMeta(a: BlogArticle): PostMeta {
  return {
    title: a.metaTitle ?? a.title,
    slug: a.slug,
    description: a.metaDescription ?? a.description,
    keywords: a.keywords,
    publishedAt: a.publishedAt ?? a.createdAt,
    updatedAt: a.updatedAt,
    readingMinutes: estimateReadingMinutes(a.content),
  }
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const articles = await listPublished()
  return articles.map(articleToMeta)
}

export async function getPostSlugs(): Promise<string[]> {
  const articles = await listPublished()
  return articles.map((a) => a.slug)
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const a = await getPublishedBySlug(slug)
  if (!a) return null
  const html = marked.parse(a.content, { async: false }) as string
  return {
    title: a.title,
    slug: a.slug,
    description: a.description,
    keywords: a.keywords,
    publishedAt: a.publishedAt ?? a.createdAt,
    updatedAt: a.updatedAt,
    readingMinutes: estimateReadingMinutes(a.content),
    contentMarkdown: a.content,
    contentHtml: html,
  }
}
