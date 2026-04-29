'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { TripCard } from '@/components/account/TripCard'
import { PriceAlert } from '@/components/account/PriceAlert'
import { EmptyTrips } from '@/components/account/EmptyTrips'
import { PrefsSection } from '@/components/account/PrefsSection'
import { BottomNav } from '@/components/mobile/BottomNav'
import type { AccountTrip } from '@/app/api/account/plans/route'

type Tab = 'upcoming' | 'past' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'Предстоящие' },
  { id: 'past',     label: 'Прошедшие' },
  { id: 'settings', label: 'Настройки' },
]

interface PlansResponse {
  ok: boolean
  trips: AccountTrip[]
  upcoming: AccountTrip[]
  past: AccountTrip[]
  error?: string
}

interface MeResponse {
  ok: boolean
  email?: string
  userId?: string
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountInner />
    </Suspense>
  )
}

function AccountInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const initial = (sp.get('tab') as Tab) || 'upcoming'
  const [tab, setTab] = useState<Tab>(initial)

  const [upcoming, setUpcoming] = useState<AccountTrip[]>([])
  const [past, setPast] = useState<AccountTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // userEmail: null = ещё не проверили /api/auth/me; остальное — реальный email.
  // Middleware уже отбросил неавторизованных, но fetch /me нам нужен чтобы знать
  // конкретный email пользователя (middleware его не пробрасывает в страницу).
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Загружаем сессию на mount.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        const data = (await res.json()) as MeResponse
        if (cancelled) return
        if (res.ok && data.ok && data.email) {
          setUserEmail(data.email)
        } else {
          // Не должно случиться (middleware), но на всякий случай — на login.
          router.replace('/account/login')
        }
      } catch {
        if (!cancelled) router.replace('/account/login')
      }
    })()
    return () => { cancelled = true }
  }, [router])

  const reloadPlans = useCallback(async (email: string) => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(
        `/api/account/plans?email=${encodeURIComponent(email)}`,
        { cache: 'no-store' }
      )
      const data = (await res.json()) as PlansResponse
      if (!res.ok || !data.ok) {
        setLoadError(data.error ?? 'Не удалось загрузить поездки')
        return
      }
      setUpcoming(data.upcoming)
      setPast(data.past)
    } catch (err) {
      console.error('[/account] fetch failed:', err)
      setLoadError('Сеть недоступна')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userEmail) reloadPlans(userEmail)
  }, [userEmail, reloadPlans])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore network errors */ }
    router.replace('/')
    router.refresh()
  }, [router])

  // Pull-to-refresh
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let startY: number | null = null
    let pulled = 0

    function start(e: TouchEvent) {
      if (window.scrollY <= 0) startY = e.touches[0].clientY
    }
    function move(e: TouchEvent) {
      if (startY === null) return
      pulled = e.touches[0].clientY - startY
    }
    async function end() {
      if (pulled > 70 && userEmail) {
        setRefreshing(true)
        await reloadPlans(userEmail)
        setRefreshing(false)
      }
      startY = null
      pulled = 0
    }
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', move, { passive: true })
    el.addEventListener('touchend', end)
    return () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', end)
    }
  }, [userEmail, reloadPlans])

  // Закрытие dropdown по клику вне.
  useEffect(() => {
    if (!menuOpen) return
    function close(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('[data-user-menu]')) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  // Пока ждём /api/auth/me — показываем нейтральный плейсхолдер.
  if (userEmail === null) {
    return (
      <div
        className="min-h-dvh"
        style={{ background: 'var(--color-background-tertiary)' }}
      />
    )
  }

  const display = displayName(userEmail)

  return (
    <div className="min-h-dvh" ref={containerRef}>
      {/* Top bar — лого + email-меню + Выйти */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: 'var(--color-background-tertiary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <div className="mx-auto max-w-[680px] h-14 px-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-[14px]" style={{ fontWeight: 500 }}>Marshai</span>
          </Link>

          <div className="flex items-center gap-2" data-user-menu>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="hidden sm:flex items-center gap-1.5 px-2.5 text-[12px] rounded-lg"
              style={{
                height: '36px',
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                color: 'var(--color-text-primary)',
              }}
            >
              <span className="truncate max-w-[200px]">{userEmail}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={logout}
              className="hidden sm:inline-flex items-center px-3 text-[12px] rounded-lg"
              style={{
                height: '36px',
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

      <main
        className="mx-auto max-w-[680px] px-4 pt-3"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        {/* Профиль-строка */}
        <div className="flex items-center gap-2.5 mb-4" style={{ minHeight: '44px' }}>
          <span
            aria-hidden
            className="inline-flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--color-avatar-teal)',
              color: 'var(--color-avatar-teal-text)',
              fontSize: '11px',
              fontWeight: 500,
            }}
          >
            {display.initials}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] truncate" style={{ fontWeight: 500 }}>
              {display.name}
            </div>
            <div
              className="text-[11px] truncate"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {userEmail}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTab('settings')}
            aria-label="Настройки"
            className="text-[12px] flex items-center gap-1"
            style={{
              color: 'var(--color-text-secondary)',
              minHeight: '36px',
              padding: '0 8px',
            }}
          >
            <SettingsIcon />
          </button>
        </div>

        {refreshing && (
          <div
            className="text-center text-[11px] mb-2 animate-fade-in"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Обновляем...
          </div>
        )}

        {/* Segment tabs */}
        <div
          className="flex gap-3 mb-4 overflow-x-auto no-scrollbar"
          style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
        >
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="text-[13px] py-2.5 whitespace-nowrap"
                style={{
                  color: active
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)',
                  fontWeight: active ? 500 : 400,
                  borderBottom: active
                    ? '2px solid var(--color-primary)'
                    : '2px solid transparent',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'upcoming' && (
          <UpcomingTab
            trips={upcoming}
            loading={loading}
            error={loadError}
            onRetry={() => reloadPlans(userEmail)}
          />
        )}

        {tab === 'past' && (
          <PastTab
            trips={past}
            loading={loading}
            error={loadError}
            onRetry={() => reloadPlans(userEmail)}
          />
        )}

        {tab === 'settings' && (
          <PrefsSection email={userEmail} onLogout={logout} />
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function Logo() {
  return (
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
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1M12.6 12.6l-1.1-1.1M4.5 4.5L3.4 3.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function displayName(email: string): { name: string; initials: string } {
  const local = email.split('@')[0]
  const parts = local.split(/[._-]/).filter(Boolean)

  if (parts.length >= 2) {
    const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    const last = parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
    return {
      name: `${first} ${last}`,
      initials: `${parts[0][0].toUpperCase()}${parts[1][0].toUpperCase()}`,
    }
  }

  const name = local.charAt(0).toUpperCase() + local.slice(1)
  return {
    name,
    initials: name.slice(0, 2).toUpperCase(),
  }
}

interface TabProps {
  trips: AccountTrip[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

function UpcomingTab({ trips, loading, error, onRetry }: TabProps) {
  if (loading && trips.length === 0) return <Loading />
  if (error && trips.length === 0) return <ErrorBlock message={error} onRetry={onRetry} />
  if (trips.length === 0) return <EmptyTrips />

  return (
    <div className="grid gap-3">
      <PriceAlert
        route="Сапсан СПб"
        delta="вырос на 320 ₽ с момента сохранения"
      />
      {trips.map((t) => (
        <TripCard key={t.id} {...t} />
      ))}
      <Link
        href="/"
        className="self-start text-[12px] mt-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        + Запланировать ещё одну
      </Link>
    </div>
  )
}

function PastTab({ trips, loading, error, onRetry }: TabProps) {
  if (loading && trips.length === 0) return <Loading />
  if (error && trips.length === 0) return <ErrorBlock message={error} onRetry={onRetry} />
  if (trips.length === 0) return <EmptyTrips />

  return (
    <div className="grid gap-3">
      {trips.map((t) => (
        <TripCard
          key={t.id}
          {...t}
          status="booked"
          pastView
          customStatusLabel="Завершено"
        />
      ))}
    </div>
  )
}

function Loading() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-4">
          <div className="skeleton" style={{ height: 16, width: '60%' }} />
          <div className="mt-2 skeleton" style={{ height: 12, width: '40%' }} />
          <div className="mt-3 skeleton" style={{ height: 36, width: '50%' }} />
        </div>
      ))}
    </div>
  )
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card p-4 flex flex-col gap-2 items-start">
      <span className="text-[13px]" style={{ color: '#C13838' }}>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="text-[12px] px-3 rounded-lg"
        style={{
          height: '36px',
          background: 'var(--color-primary)',
          color: '#fff',
          fontWeight: 500,
        }}
      >
        Попробовать ещё раз
      </button>
    </div>
  )
}
