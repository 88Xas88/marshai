import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogShell } from '@/components/blog/BlogShell'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Блог о путешествиях по России',
  description:
    'Маршруты, советы и идеи для поездок по России: Питер, Казань, Сочи, Калининград, Владивосток. От Marshai — AI-планировщика путешествий.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    title: 'Блог Marshai — путешествия по России',
    description: 'Готовые маршруты и подборки городов России: что посмотреть, сколько дней нужно, бюджет.',
    url: '/blog',
  },
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

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <BlogShell>
      <header className="mb-8">
        <h1
          className="text-[28px] sm:text-[36px] leading-tight"
          style={{ fontWeight: 500, letterSpacing: '-0.6px' }}
        >
          Блог о путешествиях по России
        </h1>
        <p
          className="mt-2 text-[14px] sm:text-[15px] max-w-[640px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Маршруты по дням, советы по бюджету и подборки городов — чтобы спланировать
          следующую поездку быстрее.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="card p-6 text-center">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Пока нет статей. Загляни позже.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="card p-4 sm:p-5 block transition-colors hover:border-[var(--color-text-secondary)]"
              >
                <h2
                  className="text-[16px] sm:text-[18px]"
                  style={{ fontWeight: 500, letterSpacing: '-0.3px' }}
                >
                  {p.title}
                </h2>
                <p
                  className="mt-1.5 text-[13px] sm:text-[14px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {p.description}
                </p>
                <div
                  className="mt-3 flex items-center gap-3 text-[11px]"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <span>{formatDate(p.publishedAt)}</span>
                  <span>·</span>
                  <span>{p.readingMinutes} мин чтения</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </BlogShell>
  )
}
