'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CityAutocomplete } from '@/components/search/CityAutocomplete'

export function NotFoundPage() {
  const router = useRouter()
  const [from, setFrom] = useState('Москва')
  const [to, setTo] = useState('')
  const [error, setError] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!to.trim()) {
      setError(true)
      return
    }
    const params = new URLSearchParams({
      from,
      to,
      dates: '',
      days: '5',
      pax: '1',
      budget: 'medium',
      interests: 'all',
    })
    router.push(`/generating?${params.toString()}`)
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-[640px] w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center text-center gap-3">
        <Pin />

        <h1
          className="text-[22px] sm:text-[26px]"
          style={{ fontWeight: 500, letterSpacing: '-0.3px' }}
        >
          Маршрут потерялся
        </h1>
        <p
          className="text-[13px] sm:text-[14px] max-w-[340px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Эта страница не существует. Но мы поможем — скажи куда хочешь поехать,
          и план будет готов за 30 секунд.
        </p>

        <form
          onSubmit={submit}
          className="w-full mt-6 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"
          style={{ maxWidth: '520px' }}
        >
          <CityAutocomplete
            id="nf-from"
            label="Откуда"
            value={from}
            onChange={setFrom}
            exclude={to}
          />
          <CityAutocomplete
            id="nf-to"
            label="Куда"
            value={to}
            onChange={(v) => {
              setTo(v)
              if (v) setError(false)
            }}
            exclude={from}
            error={error}
            autoFocus
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 text-[13px] rounded-lg"
            style={{
              height: '48px',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 500,
              minWidth: '140px',
            }}
          >
            Поехали →
          </button>
        </form>

        <nav
          className="mt-8 flex items-center justify-center gap-5 text-[12px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Link href="/plan/example-spb" className="hover:text-[var(--color-text-primary)]">
            📍 Примеры планов
          </Link>
          <Link href="/account" className="hover:text-[var(--color-text-primary)]">
            📋 Мои поездки
          </Link>
          <a
            href="mailto:hello@marshai.ru"
            className="hover:text-[var(--color-text-primary)]"
          >
            ? Поддержка
          </a>
        </nav>
      </main>
    </div>
  )
}

function Header() {
  return (
    <header
      style={{
        background: 'var(--color-background-tertiary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
      }}
    >
      <div className="mx-auto max-w-[1080px] h-14 px-4 flex items-center justify-between">
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
          <span className="text-[14px]" style={{ fontWeight: 500 }}>Marshai</span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
          <Link href="/plan/example-spb">Примеры</Link>
        </nav>
        <Link
          href="/"
          className="px-3 text-[12px] rounded-lg flex items-center"
          style={{
            height: '36px',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          На главную
        </Link>
      </div>
    </header>
  )
}

function Pin() {
  return (
    <svg
      className="pin-animated"
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
    >
      <path
        d="M32 6c-9 0-16 7.2-16 16 0 12 16 30 16 30s16-18 16-30c0-8.8-7-16-16-16z"
        fill="#1D9E75"
        opacity="0.16"
      />
      <path
        d="M32 6c-9 0-16 7.2-16 16 0 12 16 30 16 30s16-18 16-30c0-8.8-7-16-16-16z"
        stroke="#1D9E75"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="22" r="6" fill="#fff" stroke="#1D9E75" strokeWidth="2" />
    </svg>
  )
}
