import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BlogShell } from '@/components/blog/BlogShell'
import { PostCTA } from '@/components/blog/PostCTA'
import { getPostBySlug, getPostSlugs } from '@/lib/blog'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Дёргаем БД на каждом запросе — статьи могут публиковаться/обновляться
// через админку, ISR не подходит без on-demand revalidation.
export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Статья не найдена', robots: { index: false, follow: false } }
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  return (
    <BlogShell>
      <article>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-[12px] mb-5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ← Все статьи
        </Link>

        <h1
          className="text-[28px] sm:text-[36px] leading-tight"
          style={{ fontWeight: 500, letterSpacing: '-0.6px' }}
        >
          {post.title}
        </h1>

        <div
          className="mt-3 flex items-center gap-3 text-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <span>{formatDate(post.publishedAt)}</span>
          <span>·</span>
          <span>{post.readingMinutes} мин чтения</span>
        </div>

        <div
          className="prose-article mt-7"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <PostCTA />
      </article>

      <style>{`
        .prose-article {
          font-size: 15px;
          line-height: 1.65;
          color: var(--color-text-primary);
        }
        .prose-article > * + * { margin-top: 1em; }
        .prose-article h2 {
          font-size: 22px;
          font-weight: 500;
          letter-spacing: -0.3px;
          margin-top: 2em;
          margin-bottom: 0.4em;
          line-height: 1.25;
        }
        .prose-article h3 {
          font-size: 18px;
          font-weight: 500;
          letter-spacing: -0.2px;
          margin-top: 1.6em;
          margin-bottom: 0.3em;
        }
        .prose-article p { margin-top: 0.8em; }
        .prose-article ul, .prose-article ol {
          padding-left: 1.4em;
          margin-top: 0.8em;
        }
        .prose-article ul { list-style: disc; }
        .prose-article ol { list-style: decimal; }
        .prose-article li { margin-top: 0.35em; }
        .prose-article a {
          color: var(--color-success);
          text-decoration: underline;
          text-underline-offset: 2px;
          text-decoration-thickness: 0.5px;
        }
        .prose-article strong { font-weight: 500; }
        .prose-article blockquote {
          border-left: 3px solid var(--color-border-secondary);
          padding-left: 1em;
          color: var(--color-text-secondary);
          margin: 1.2em 0;
        }
        .prose-article code {
          font-family: ui-monospace, SFMono-Regular, monospace;
          background: var(--color-background-tertiary);
          padding: 0.1em 0.35em;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .prose-article hr {
          border: none;
          border-top: 0.5px solid var(--color-border-tertiary);
          margin: 2em 0;
        }
        .prose-article table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
          font-size: 14px;
        }
        .prose-article th, .prose-article td {
          border: 0.5px solid var(--color-border-tertiary);
          padding: 0.5em 0.7em;
          text-align: left;
        }
        .prose-article th {
          background: var(--color-background-tertiary);
          font-weight: 500;
        }
      `}</style>
    </BlogShell>
  )
}
