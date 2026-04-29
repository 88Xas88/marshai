import Link from 'next/link'
import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
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
            <span className="text-[14px]" style={{ fontWeight: 500 }}>
              Marshai
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:py-16">
        <div
          className="card w-full p-6 sm:p-8 flex flex-col items-center gap-3"
          style={{ maxWidth: '420px' }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
