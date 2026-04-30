import { neon } from '@neondatabase/serverless'

const dbUrl = process.env.DATABASE_URL
const sql = dbUrl ? neon(dbUrl) : null

export type ArticleStatus = 'draft' | 'published'

export interface BlogArticle {
  id: string
  slug: string
  title: string
  description: string
  content: string
  metaTitle: string | null
  metaDescription: string | null
  keywords: string[]
  status: ArticleStatus
  authorId: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

interface Row {
  id: string
  slug: string
  title: string
  description: string
  content: string
  meta_title: string | null
  meta_description: string | null
  keywords: string[] | null
  status: ArticleStatus
  author_id: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

function rowToArticle(r: Row): BlogArticle {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    content: r.content,
    metaTitle: r.meta_title,
    metaDescription: r.meta_description,
    keywords: r.keywords ?? [],
    status: r.status,
    authorId: r.author_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    publishedAt: r.published_at,
  }
}

const SELECT_COLS = `
  id::text, slug, title, description, content, meta_title, meta_description,
  keywords, status, author_id::text,
  created_at::text, updated_at::text, published_at::text
`

export async function listPublished(): Promise<BlogArticle[]> {
  if (!sql) return []
  const rows = (await sql.query(`
    SELECT ${SELECT_COLS} FROM blog_articles
    WHERE status = 'published'
    ORDER BY published_at DESC NULLS LAST
  `)) as Row[]
  return rows.map(rowToArticle)
}

export async function listAll(): Promise<BlogArticle[]> {
  if (!sql) return []
  const rows = (await sql.query(`
    SELECT ${SELECT_COLS} FROM blog_articles
    ORDER BY updated_at DESC
  `)) as Row[]
  return rows.map(rowToArticle)
}

export async function getBySlug(slug: string): Promise<BlogArticle | null> {
  if (!sql) return null
  const rows = (await sql.query(
    `SELECT ${SELECT_COLS} FROM blog_articles WHERE slug = $1 LIMIT 1`,
    [slug]
  )) as Row[]
  return rows[0] ? rowToArticle(rows[0]) : null
}

export async function getPublishedBySlug(slug: string): Promise<BlogArticle | null> {
  if (!sql) return null
  const rows = (await sql.query(
    `SELECT ${SELECT_COLS} FROM blog_articles WHERE slug = $1 AND status = 'published' LIMIT 1`,
    [slug]
  )) as Row[]
  return rows[0] ? rowToArticle(rows[0]) : null
}

export async function getById(id: string): Promise<BlogArticle | null> {
  if (!sql) return null
  const rows = (await sql.query(
    `SELECT ${SELECT_COLS} FROM blog_articles WHERE id::text = $1 LIMIT 1`,
    [id]
  )) as Row[]
  return rows[0] ? rowToArticle(rows[0]) : null
}

export interface ArticleInput {
  slug: string
  title: string
  description: string
  content: string
  metaTitle?: string | null
  metaDescription?: string | null
  keywords?: string[]
  status?: ArticleStatus
}

export async function createArticle(
  input: ArticleInput,
  authorId: string | null
): Promise<BlogArticle | null> {
  if (!sql) return null
  const status = input.status ?? 'draft'
  const publishedAtSql = status === 'published' ? 'NOW()' : 'NULL'
  const rows = (await sql.query(
    `
    INSERT INTO blog_articles
      (slug, title, description, content, meta_title, meta_description,
       keywords, status, author_id, published_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9::uuid, ${publishedAtSql})
    RETURNING ${SELECT_COLS}
    `,
    [
      input.slug,
      input.title,
      input.description,
      input.content,
      input.metaTitle ?? null,
      input.metaDescription ?? null,
      input.keywords ?? [],
      status,
      authorId,
    ]
  )) as Row[]
  return rows[0] ? rowToArticle(rows[0]) : null
}

export async function updateArticle(
  id: string,
  input: Partial<ArticleInput>
): Promise<BlogArticle | null> {
  if (!sql) return null
  // Динамическая сборка SET-частей (PostgreSQL не поддерживает обновление
  // только заданных полей через одиночный SQL без EXCLUDED — собираем руками).
  const sets: string[] = []
  const params: unknown[] = []
  const push = (col: string, val: unknown) => {
    params.push(val)
    sets.push(`${col} = $${params.length}`)
  }
  if (input.slug !== undefined) push('slug', input.slug)
  if (input.title !== undefined) push('title', input.title)
  if (input.description !== undefined) push('description', input.description)
  if (input.content !== undefined) push('content', input.content)
  if (input.metaTitle !== undefined) push('meta_title', input.metaTitle)
  if (input.metaDescription !== undefined) push('meta_description', input.metaDescription)
  if (input.keywords !== undefined) push('keywords', input.keywords)
  if (input.status !== undefined) {
    push('status', input.status)
    if (input.status === 'published') {
      // Если публикуем впервые — ставим published_at = NOW(); иначе оставляем как есть.
      sets.push(`published_at = COALESCE(published_at, NOW())`)
    }
  }
  sets.push('updated_at = NOW()')
  if (sets.length === 1) return getById(id)
  params.push(id)
  const rows = (await sql.query(
    `UPDATE blog_articles SET ${sets.join(', ')} WHERE id::text = $${params.length} RETURNING ${SELECT_COLS}`,
    params
  )) as Row[]
  return rows[0] ? rowToArticle(rows[0]) : null
}

export async function deleteArticle(id: string): Promise<boolean> {
  if (!sql) return false
  const rows = (await sql.query(
    `DELETE FROM blog_articles WHERE id::text = $1 RETURNING id`,
    [id]
  )) as { id: string }[]
  return rows.length > 0
}

export async function setStatus(
  id: string,
  status: ArticleStatus
): Promise<BlogArticle | null> {
  return updateArticle(id, { status })
}
