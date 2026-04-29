'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/errors/EmptyState'

const EXAMPLES = [
  { route: 'Мск → Питер',  meta: '5 дней · 1 чел.', price: 'от 22 400 ₽' },
  { route: 'Мск → Казань', meta: '3 дня · 2 чел.',  price: 'от 18 600 ₽' },
  { route: 'Мск → Сочи',   meta: '7 дней · семья',  price: 'от 96 000 ₽' },
  { route: 'Мск → Калинг.', meta: '4 дня · 2 чел.', price: 'от 31 000 ₽' },
]

export function EmptyTrips() {
  const router = useRouter()
  return (
    <div className="grid gap-4">
      <EmptyState
        type="no_trips"
        customSubtitle="Вот что сейчас планируют другие — для вдохновения"
        onAction={() => router.push('/')}
        customAction="Спланировать поездку"
      />

      <div className="grid grid-cols-2 gap-2">
        {EXAMPLES.map((e) => (
          <Link
            key={e.route}
            href="/plan/example-spb"
            className="card p-3 block transition-colors hover:border-[var(--color-text-secondary)]"
          >
            <div className="text-[12px]" style={{ fontWeight: 500 }}>
              {e.route}
            </div>
            <div
              className="text-[10px] mt-0.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {e.meta}
            </div>
            <div className="price text-[12px] mt-1.5">{e.price}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
