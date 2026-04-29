'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/',         label: 'Планировать', icon: <PinIcon /> },
  { href: '/account',  label: 'Мои поездки', icon: <ListIcon /> },
  { href: '/account?tab=settings', label: 'Профиль', icon: <UserIcon /> },
]

export function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href.startsWith('/account')) return pathname?.startsWith('/account') ?? false
    return false
  }
  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: 'var(--color-background-primary)',
        borderTop: '0.5px solid var(--color-border-tertiary)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="grid grid-cols-3">
        {TABS.map((t) => {
          const active = isActive(t.href)
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className="flex flex-col items-center justify-center gap-1"
                style={{
                  minHeight: '56px',
                  color: active
                    ? 'var(--color-success)'
                    : 'var(--color-text-secondary)',
                }}
              >
                <span aria-hidden style={{ width: '20px', height: '20px' }}>
                  {t.icon}
                </span>
                <span
                  className="text-[10px]"
                  style={{ fontWeight: active ? 500 : 400 }}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2c-3 0-5.5 2.5-5.5 5.5C4.5 11.5 10 18 10 18s5.5-6.5 5.5-10.5C15.5 4.5 13 2 10 2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="3.2" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
      <rect x="3" y="9" width="14" height="3.2" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
      <rect x="3" y="14" width="14" height="3.2" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.2 17c0-3.4 3-6 6.8-6s6.8 2.6 6.8 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
