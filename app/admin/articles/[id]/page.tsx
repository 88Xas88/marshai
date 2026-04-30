'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'
import { ArticleEditor } from '@/components/admin/ArticleEditor'

interface Article {
  id: string
  slug: string
  title: string
  description: string
  content: string
  metaTitle: string | null
  metaDescription: string | null
  keywords: string[]
  status: 'draft' | 'published'
}

export default function EditArticlePage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/articles/${id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setArticle(d.article)
        else setError(d.error ?? 'Не удалось загрузить')
      })
      .catch(() => setError('Сеть недоступна'))
  }, [id])

  return (
    <AdminShell>
      {error && (
        <div className="card p-4 text-[13px]" style={{ color: '#C13838' }}>
          {error}
        </div>
      )}
      {!article && !error && (
        <div className="card p-6 text-center text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          Загрузка статьи...
        </div>
      )}
      {article && <ArticleEditor initial={article} />}
    </AdminShell>
  )
}
