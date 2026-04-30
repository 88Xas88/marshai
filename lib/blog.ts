import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'

const POSTS_DIR = join(process.cwd(), 'content', 'blog')

export interface PostFrontmatter {
  title: string
  slug: string
  description: string
  keywords?: string[]
  publishedAt: string
  updatedAt?: string
  readingMinutes?: number
}

// Чистый frontmatter без тела — для списка /blog.
export type PostMeta = PostFrontmatter

export interface Post extends PostFrontmatter {
  // С телом — для страницы статьи.
  contentMarkdown: string
  contentHtml: string
}

function listFiles(): string[] {
  if (!existsSync(POSTS_DIR)) return []
  return readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'))
}

function readPostFile(file: string): { data: PostFrontmatter; content: string } {
  const raw = readFileSync(join(POSTS_DIR, file), 'utf8')
  const parsed = matter(raw)
  return {
    data: parsed.data as PostFrontmatter,
    content: parsed.content,
  }
}

// Грубая оценка времени чтения: 180 слов/мин для русскоязычного читателя.
function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 180))
}

export function getAllPosts(): PostMeta[] {
  return listFiles()
    .map((file) => {
      const { data, content } = readPostFile(file)
      return {
        ...data,
        readingMinutes: data.readingMinutes ?? estimateReadingMinutes(content),
      }
    })
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
}

export function getPostSlugs(): string[] {
  return listFiles().map((f) => f.replace(/\.md$/, ''))
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const file = `${slug}.md`
  if (!listFiles().includes(file)) return null

  const { data, content } = readPostFile(file)
  // marked возвращает Promise в новых версиях если есть async-extension; используем sync вариант.
  const html = marked.parse(content, { async: false }) as string
  return {
    ...data,
    readingMinutes: data.readingMinutes ?? estimateReadingMinutes(content),
    contentMarkdown: content,
    contentHtml: html,
  }
}
