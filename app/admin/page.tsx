'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminShell } from '@/components/admin/AdminShell'

interface Article {
  id: string
  slug: string
  title: string
  status: 'draft' | 'published'
  updatedAt: string
  publishedAt: string | null
}

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function fmt(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/articles', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Не удалось загрузить')
        return
      }
      setArticles(data.articles)
    } catch {
      setError('Сеть недоступна')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function remove(id: string, title: string) {
    if (!confirm(`Удалить статью «${title}»? Это необратимо.`)) return
    const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
    if (res.ok) load()
    else alert('Не удалось удалить')
  }

  return (
    <AdminShell>
      <div className="flex items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[24px]" style={{ fontWeight: 500, letterSpacing: '-0.3px' }}>
            Статьи блога
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            {loading ? 'Загрузка…' : `${articles.length} статей всего`}
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center px-4 text-[13px] rounded-lg"
          style={{
            height: 40,
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          + Новая статья
        </Link>
      </div>

      {error && (
        <div className="card p-4 text-[13px]" style={{ color: '#C13838' }}>
          {error}
        </div>
      )}

      <ul className="grid gap-2">
        {articles.map((a) => {
          const isDraft = a.status === 'draft'
          return (
            <li
              key={a.id}
              className="card p-3 sm:p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="text-[14px] block truncate"
                  style={{ fontWeight: 500 }}
                >
                  {a.title}
                </Link>
                <div className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>/{a.slug}</span>
                  <span>·</span>
                  <span>обновлено {fmt(a.updatedAt)}</span>
                  {!isDraft && (
                    <>
                      <span>·</span>
                      <span>опубликовано {fmt(a.publishedAt)}</span>
                    </>
                  )}
                </div>
              </div>
              <span
                className="badge shrink-0"
                style={{
                  background: isDraft ? 'var(--color-background-tertiary)' : 'var(--color-avatar-teal)',
                  color: isDraft ? 'var(--color-text-secondary)' : 'var(--color-avatar-teal-text)',
                }}
              >
                {isDraft ? 'Черновик' : 'Опубликовано'}
              </span>
              <Link
                href={`/admin/articles/${a.id}`}
                className="hidden sm:inline-flex items-center px-3 text-[12px] rounded-lg"
                style={{
                  height: 32,
                  border: '0.5px solid var(--color-border-secondary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Открыть →
              </Link>
              <button
                type="button"
                onClick={() => remove(a.id, a.title)}
                className="px-2 text-[11px]"
                style={{ color: '#C13838', minHeight: 32 }}
              >
                Удалить
              </button>
            </li>
          )
        })}
        {articles.length === 0 && !loading && (
          <li className="card p-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Нет статей. <Link href="/admin/articles/new" style={{ color: 'var(--color-success)' }}>Создать первую</Link>.
          </li>
        )}
      </ul>
    </AdminShell>
  )
}
