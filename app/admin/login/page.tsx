'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  )
}

const ERRORS: Record<string, string> = {
  invalid_session: 'Сессия истекла, войди заново',
  invalid_credentials: 'Неверный логин или пароль',
  missing_credentials: 'Введи логин и пароль',
}

function Inner() {
  const router = useRouter()
  const sp = useSearchParams()
  const initialError = sp.get('error') ?? null

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!login.trim() || !password) {
      setError('Введи логин и пароль')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), password }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(ERRORS[data.error ?? ''] ?? 'Не удалось войти')
        return
      }
      router.replace('/admin')
      router.refresh()
    } catch {
      setError('Сеть недоступна')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--color-background-tertiary)' }}
    >
      <header
        style={{
          background: 'var(--color-background-tertiary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <div className="mx-auto max-w-[680px] h-14 px-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex items-center justify-center"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: 'var(--color-primary)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              M
            </span>
            <span className="text-[14px]" style={{ fontWeight: 500 }}>
              Marshai · admin
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:py-16">
        <div className="card w-full p-6 sm:p-8 flex flex-col gap-3" style={{ maxWidth: 400 }}>
          <h1 className="text-[20px]" style={{ fontWeight: 500, letterSpacing: '-0.3px' }}>
            Вход в админку
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            Управление статьями блога Marshai.
          </p>

          <form onSubmit={submit} className="grid gap-2 mt-3">
            <input
              type="text"
              placeholder="login"
              autoComplete="username"
              autoFocus
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-3.5 text-[14px] rounded-lg outline-none"
              style={{
                height: 48,
                background: 'var(--color-background-primary)',
                border: error ? '1px solid #E53935' : '0.5px solid var(--color-border-secondary)',
              }}
            />
            <input
              type="password"
              placeholder="пароль"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 text-[14px] rounded-lg outline-none"
              style={{
                height: 48,
                background: 'var(--color-background-primary)',
                border: error ? '1px solid #E53935' : '0.5px solid var(--color-border-secondary)',
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 text-[14px] rounded-lg"
              style={{
                height: 48,
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 500,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Вход...' : 'Войти'}
            </button>
            {error && <p className="text-[12px]" style={{ color: '#C13838' }}>{error}</p>}
          </form>
        </div>
      </main>
    </div>
  )
}
