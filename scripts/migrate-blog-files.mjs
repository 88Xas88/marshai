// Импорт статей из content/blog/*.md в таблицу blog_articles.
// Idempotent: проверяет slug, пропускает если уже в БД.
//
// Запуск:
//   npm run db:blog-import
//   ИЛИ напрямую:
//   node --env-file=.env.local scripts/migrate-blog-files.mjs

import { neon } from '@neondatabase/serverless'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = join(__dirname, '..', 'content', 'blog')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}
const sql = neon(url)

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'))
console.log(`Found ${files.length} files in ${POSTS_DIR}`)

let inserted = 0
let skipped = 0
for (const file of files) {
  const raw = readFileSync(join(POSTS_DIR, file), 'utf8')
  const parsed = matter(raw)
  const fm = parsed.data
  const slug = fm.slug ?? file.replace(/\.md$/, '')

  // Проверяем — есть ли уже такой slug в БД.
  const existing = await sql`SELECT id FROM blog_articles WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`  ⊘ ${slug} — уже в БД, пропуск`)
    skipped++
    continue
  }

  await sql`
    INSERT INTO blog_articles
      (slug, title, description, content, keywords, status, published_at)
    VALUES
      (${slug},
       ${fm.title},
       ${fm.description},
       ${parsed.content},
       ${fm.keywords ?? []},
       'published',
       ${fm.publishedAt ? new Date(fm.publishedAt) : new Date()})
  `
  console.log(`  ✓ ${slug} — добавлено`)
  inserted++
}

console.log(`\nИтого: вставлено ${inserted}, пропущено ${skipped}`)
