import Link from 'next/link'
import type { ReactNode } from 'react'

// Общая обёртка-шелл для всех страниц блога: navbar + footer + ширина страницы.
export function BlogShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header
        className="sticky top-0 z-20"
        style={{
          background: 'var(--color-background-tertiary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <div className="mx-auto max-w-[1080px] h-14 px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex items-center justify-center"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'var(--color-primary)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              M
            </span>
            <span className="text-[15px]" style={{ fontWeight: 500 }}>
              Marshai
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            <Link href="/blog" className="hover:text-[var(--color-text-primary)]">
              Блог
            </Link>
            <Link href="/plan/example-spb" className="hover:text-[var(--color-text-primary)]">
              Примеры
            </Link>
            <Link href="/account" className="hover:text-[var(--color-text-primary)]">
              Мои поездки
            </Link>
          </nav>
          <Link
            href="/"
            className="px-3 sm:px-4 text-[13px] rounded-lg flex items-center"
            style={{
              height: '36px',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            Спланировать
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-4 sm:px-6 pt-6 sm:pt-10 pb-20">
        {children}
      </main>

      <footer
        className="mt-10 py-6"
        style={{
          borderTop: '0.5px solid var(--color-border-tertiary)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        <div className="mx-auto max-w-[1080px] px-4 sm:px-6 text-[11px] flex flex-col sm:flex-row gap-2 justify-between">
          <span>© Marshai · marshai.ru</span>
          <span>Данные предоставлены Travelpayouts и Яндекс.Расписаниями</span>
        </div>
      </footer>
    </div>
  )
}
