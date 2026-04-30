'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [login, setLogin] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setLogin(d.login)
      })
      .catch(() => { /* ignore */ })
  }, [])

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-dvh">
      <header
        className="sticky top-0 z-20"
        style={{
          background: 'var(--color-background-tertiary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <div className="mx-auto max-w-[1200px] h-14 px-4 sm:px-6 flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-2">
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
          <nav className="hidden md:flex items-center gap-5 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
            <Link href="/admin" className="hover:text-[var(--color-text-primary)]">Статьи</Link>
            <Link href="/admin/articles/new" className="hover:text-[var(--color-text-primary)]">Новая</Link>
            <Link href="/blog" target="_blank" className="hover:text-[var(--color-text-primary)]">Сайт ↗</Link>
          </nav>
          <div className="flex items-center gap-2">
            {login && (
              <span className="hidden sm:inline text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                {login}
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="px-3 text-[12px] rounded-lg"
              style={{
                height: 36,
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 500,
              }}
            >
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
