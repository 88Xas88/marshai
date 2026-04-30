'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { marked } from 'marked'

interface Article {
  id?: string
  slug: string
  title: string
  description: string
  content: string
  metaTitle: string | null
  metaDescription: string | null
  keywords: string[]
  status: 'draft' | 'published'
}

interface Props {
  initial?: Article // если задан — режим редактирования
}

const EMPTY: Article = {
  slug: '',
  title: '',
  description: '',
  content: '',
  metaTitle: null,
  metaDescription: null,
  keywords: [],
  status: 'draft',
}

export function ArticleEditor({ initial }: Props) {
  const router = useRouter()
  const [a, setA] = useState<Article>(initial ?? EMPTY)
  const [keywordsText, setKeywordsText] = useState((initial?.keywords ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isNew = !initial?.id

  function update<K extends keyof Article>(key: K, value: Article[K]) {
    setA((prev) => ({ ...prev, [key]: value }))
  }

  // === SAVE ===
  async function save(opts: { publish?: boolean; unpublish?: boolean } = {}) {
    setSaving(true)
    setError(null)
    try {
      const status = opts.publish ? 'published' : opts.unpublish ? 'draft' : a.status
      const payload = {
        slug: a.slug.trim(),
        title: a.title.trim(),
        description: a.description.trim(),
        content: a.content,
        metaTitle: a.metaTitle?.trim() || null,
        metaDescription: a.metaDescription?.trim() || null,
        keywords: keywordsText.split(',').map((k) => k.trim()).filter(Boolean),
        status,
      }
      if (!payload.slug || !payload.title || !payload.description || !payload.content) {
        setError('Заполни обязательные поля: title, slug, description, content')
        setSaving(false)
        return
      }
      const res = isNew
        ? await fetch('/api/admin/articles', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/articles/${initial!.id}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Не удалось сохранить')
        return
      }
      if (isNew) {
        router.replace(`/admin/articles/${data.article.id}`)
      } else {
        update('status', data.article.status)
      }
    } finally {
      setSaving(false)
    }
  }

  // === IMAGE UPLOAD ===
  async function uploadFiles(files: File[]) {
    setUploading(true)
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          alert(`Не удалось загрузить ${file.name}: ${data.error ?? 'unknown'}` +
                (data.message ? `\n${data.message}` : ''))
          continue
        }
        insertAtCursor(`![${file.name.replace(/\.[^.]+$/, '')}](${data.url})\n`)
      }
    } finally {
      setUploading(false)
    }
  }

  function insertAtCursor(text: string) {
    const ta = textareaRef.current
    if (!ta) {
      update('content', a.content + '\n' + text)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const next = a.content.slice(0, start) + text + a.content.slice(end)
    update('content', next)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + text.length
      ta.setSelectionRange(pos, pos)
    })
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length) uploadFiles(files)
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }
  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) uploadFiles(files)
    e.target.value = ''
  }

  // === AI GENERATE ===
  async function aiGenerate() {
    if (!aiTopic.trim()) return
    setAiBusy(true)
    try {
      const res = await fetch('/api/admin/ai-generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        alert(`AI-generate failed: ${data.error ?? 'unknown'}\n${data.detail ?? ''}`)
        return
      }
      const f = data.fields
      setA((prev) => ({
        ...prev,
        title: f.title,
        slug: f.slug,
        description: f.description,
        metaTitle: f.meta_title,
        metaDescription: f.meta_description,
        content: f.content,
      }))
      setKeywordsText((f.keywords ?? []).join(', '))
      setAiOpen(false)
      setAiTopic('')
    } finally {
      setAiBusy(false)
    }
  }

  // === DELETE ===
  async function remove() {
    if (!initial?.id) return
    if (!confirm(`Удалить статью «${a.title}»? Это необратимо.`)) return
    const res = await fetch(`/api/admin/articles/${initial.id}`, { method: 'DELETE' })
    if (res.ok) router.replace('/admin')
    else alert('Не удалось удалить')
  }

  // === PREVIEW ===
  const previewHtml = useMemo(() => {
    try {
      return marked.parse(a.content || '_(пусто)_', { async: false }) as string
    } catch {
      return '<p style="color:#C13838">Ошибка рендера Markdown</p>'
    }
  }, [a.content])

  // Auto-slug из title для новой статьи если slug пустой.
  useEffect(() => {
    if (isNew && a.title && !a.slug) {
      const auto = a.title
        .toLowerCase()
        .replace(/[ёе]/g, 'e')
        .replace(/[^a-zа-я0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
      if (auto) update('slug', auto)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.title])

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href="/admin" className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
          ← Все статьи
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="px-3 text-[12px] rounded-lg"
            style={{
              height: 36,
              background: '#EEEDFE',
              color: '#5A4DCC',
              border: '0.5px solid #d2cfff',
              fontWeight: 500,
            }}
          >
            ✨ AI Generate
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={remove}
              className="px-3 text-[12px] rounded-lg"
              style={{
                height: 36,
                background: '#FCEBEB',
                color: '#9C2E2E',
                border: '0.5px solid #f3c7c7',
              }}
            >
              Удалить
            </button>
          )}
          {a.status === 'published' ? (
            <button
              type="button"
              onClick={() => save({ unpublish: true })}
              disabled={saving}
              className="px-3 text-[12px] rounded-lg"
              style={{
                height: 36,
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                color: 'var(--color-text-primary)',
              }}
            >
              Снять с публикации
            </button>
          ) : (
            <button
              type="button"
              onClick={() => save({ publish: true })}
              disabled={saving}
              className="px-3 text-[12px] rounded-lg"
              style={{
                height: 36,
                background: 'var(--color-success)',
                color: '#fff',
                fontWeight: 500,
              }}
            >
              Опубликовать
            </button>
          )}
          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            className="px-4 text-[13px] rounded-lg"
            style={{
              height: 36,
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 500,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card p-3 text-[12px]" style={{ color: '#C13838' }}>
          {error}
        </div>
      )}

      {/* Title + slug */}
      <div className="card p-4 grid gap-3">
        <Field label="Заголовок (H1)">
          <input
            type="text"
            value={a.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Например: Как спланировать поездку в СПб"
            className="w-full px-3 text-[14px] rounded-lg outline-none"
            style={{
              height: 44,
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-secondary)',
            }}
          />
        </Field>
        <Field label="Slug (URL: /blog/<slug>)">
          <input
            type="text"
            value={a.slug}
            onChange={(e) => update('slug', e.target.value)}
            placeholder="spb-5-days"
            className="w-full px-3 text-[14px] rounded-lg outline-none font-mono"
            style={{
              height: 40,
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-secondary)',
            }}
          />
        </Field>
        <Field label="Описание (показывается в карточке /blog)">
          <textarea
            value={a.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="2-3 предложения на 150-180 символов"
            rows={2}
            className="w-full px-3 py-2 text-[13px] rounded-lg outline-none resize-y"
            style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-secondary)',
            }}
          />
        </Field>
      </div>

      {/* SEO */}
      <details className="card p-4">
        <summary className="cursor-pointer text-[13px]" style={{ fontWeight: 500 }}>
          SEO meta-теги (опционально)
        </summary>
        <div className="mt-4 grid gap-3">
          <Field label="Meta Title">
            <input
              type="text"
              value={a.metaTitle ?? ''}
              onChange={(e) => update('metaTitle', e.target.value)}
              placeholder="до 60 символов; пусто = взять title"
              className="w-full px-3 text-[13px] rounded-lg outline-none"
              style={{
                height: 40,
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
              }}
            />
          </Field>
          <Field label="Meta Description">
            <textarea
              value={a.metaDescription ?? ''}
              onChange={(e) => update('metaDescription', e.target.value)}
              placeholder="до 160 символов; пусто = взять description"
              rows={2}
              className="w-full px-3 py-2 text-[13px] rounded-lg outline-none resize-y"
              style={{
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
              }}
            />
          </Field>
          <Field label="Keywords (через запятую)">
            <input
              type="text"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="спб, маршрут, 5 дней"
              className="w-full px-3 text-[13px] rounded-lg outline-none"
              style={{
                height: 40,
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
              }}
            />
          </Field>
        </div>
      </details>

      {/* Content + preview */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Markdown editor */}
        <div className="card p-3 sm:p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px]" style={{ fontWeight: 500 }}>Markdown</span>
            <label
              className="text-[11px] cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {uploading ? 'Загрузка...' : '+ изображение'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onPickFiles}
                className="hidden"
              />
            </label>
          </div>
          <textarea
            ref={textareaRef}
            value={a.content}
            onChange={(e) => update('content', e.target.value)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            placeholder="## Введение&#10;&#10;Текст статьи в Markdown. Перетащи картинку прямо сюда — она загрузится в R2 и вставится как ![](...)"
            className="flex-1 px-3 py-3 text-[13px] rounded-lg outline-none font-mono resize-none"
            style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-secondary)',
              minHeight: 600,
              lineHeight: 1.55,
            }}
          />
        </div>
        {/* Preview */}
        <div className="card p-4 flex flex-col">
          <span className="text-[12px] mb-2" style={{ fontWeight: 500 }}>
            Превью
          </span>
          <div
            className="prose-article overflow-auto"
            style={{ minHeight: 600 }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      {/* AI Generate modal */}
      {aiOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !aiBusy && setAiOpen(false)}
        >
          <div
            className="card p-5 w-full"
            style={{ maxWidth: 480, background: 'var(--color-background-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] mb-2" style={{ fontWeight: 500 }}>
              AI Generate (Sonnet → Haiku)
            </h3>
            <p className="text-[12px] mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Sonnet 4 составит структуру + SEO-поля. Haiku 4.5 напишет тело ~1500-2500 слов с плейсхолдерами для картинок.
              Это займёт 30-60 секунд. ~2 ₽ за статью.
            </p>
            <input
              type="text"
              autoFocus
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Например: Тверь и Селигер на 4 дня"
              className="w-full px-3 text-[14px] rounded-lg outline-none"
              style={{
                height: 44,
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                disabled={aiBusy}
                className="px-3 text-[12px] rounded-lg"
                style={{
                  height: 36,
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border-secondary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={aiGenerate}
                disabled={aiBusy || !aiTopic.trim()}
                className="px-4 text-[12px] rounded-lg"
                style={{
                  height: 36,
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 500,
                  opacity: aiBusy ? 0.6 : 1,
                }}
              >
                {aiBusy ? 'Генерация (60 сек)…' : 'Сгенерировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS для preview — клон того что на /blog/[slug] */}
      <style>{`
        .prose-article { font-size: 14px; line-height: 1.6; color: var(--color-text-primary); }
        .prose-article > * + * { margin-top: 0.9em; }
        .prose-article h2 { font-size: 18px; font-weight: 500; letter-spacing: -0.2px; margin-top: 1.5em; margin-bottom: 0.3em; line-height: 1.3; }
        .prose-article h3 { font-size: 15px; font-weight: 500; margin-top: 1.3em; margin-bottom: 0.25em; }
        .prose-article p { margin-top: 0.6em; }
        .prose-article ul, .prose-article ol { padding-left: 1.4em; margin-top: 0.6em; }
        .prose-article ul { list-style: disc; }
        .prose-article ol { list-style: decimal; }
        .prose-article li { margin-top: 0.25em; }
        .prose-article a { color: var(--color-success); text-decoration: underline; }
        .prose-article strong { font-weight: 500; }
        .prose-article code { font-family: ui-monospace, SFMono-Regular, monospace; background: var(--color-background-tertiary); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.9em; }
        .prose-article hr { border: none; border-top: 0.5px solid var(--color-border-tertiary); margin: 1.5em 0; }
        .prose-article img { max-width: 100%; height: auto; border-radius: 8px; margin-top: 0.8em; }
        .prose-article blockquote { border-left: 3px solid var(--color-border-secondary); padding-left: 1em; color: var(--color-text-secondary); margin: 1em 0; }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}
