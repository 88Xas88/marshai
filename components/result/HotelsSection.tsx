'use client'

import { useState } from 'react'
import type { Hotel } from '@/types/plan'
import { formatPrice, nightsLabel } from '@/lib/format'

interface Props {
  id: string
  hotels: Hotel[]
  nights: number
  onBook: (h: Hotel) => void
}

export function HotelsSection({ id, hotels, nights, onBook }: Props) {
  const [shownIds, setShownIds] = useState<string[]>(() =>
    hotels.slice(0, 2).map((h) => h.id)
  )

  function replace(oldId: string) {
    const next = hotels.find((h) => !shownIds.includes(h.id))
    if (!next) return
    setShownIds((arr) => arr.map((id) => (id === oldId ? next.id : id)))
  }

  const visible = shownIds
    .map((id) => hotels.find((h) => h.id === id))
    .filter(Boolean) as Hotel[]
  const hasMore = hotels.length > shownIds.length

  return (
    <section id={id} className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-[16px]" style={{ fontWeight: 500 }}>
          Жильё · {nightsLabel(nights)}
        </h2>
        <span
          className="text-[11px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {hotels.length} вариантов
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {visible.map((h) => (
          <HotelCard
            key={h.id}
            hotel={h}
            nights={nights}
            canReplace={hasMore}
            onReplace={() => replace(h.id)}
            onBook={() => onBook(h)}
          />
        ))}
      </ul>

      <div className="mt-3 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
        <a className="hover:underline" href="#">Все варианты →</a>
      </div>
    </section>
  )
}

function HotelCard({
  hotel,
  canReplace,
  onReplace,
  onBook,
}: {
  hotel: Hotel
  nights: number
  canReplace: boolean
  onReplace: () => void
  onBook: () => void
}) {
  return (
    <li
      className="p-3.5 rounded-[10px] flex flex-col gap-2.5"
      style={{ background: 'var(--color-background-tertiary)' }}
    >
      <div className="flex items-start gap-3">
        <Thumbnail hotel={hotel} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] truncate" style={{ fontWeight: 500 }}>
            {hotel.name}
          </div>
          <div
            className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {hotel.stars > 0 && <span>{'★'.repeat(hotel.stars)}</span>}
            <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>
              {hotel.rating.toFixed(1)}
            </span>
            <span>· {hotel.reviews} отзывов</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {hotel.tags.map((t) => (
          <span
            key={t}
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="flex flex-col">
          <span
            className="text-[11px]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            от {formatPrice(hotel.pricePerNight)}/ночь
          </span>
          <span className="price text-[14px]">
            итого {formatPrice(hotel.totalPrice)}
          </span>
        </div>
        <button
          type="button"
          onClick={onBook}
          className="px-3 text-[12px] rounded-lg whitespace-nowrap"
          style={{
            height: '44px',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          Бронировать →
        </button>
      </div>

      {canReplace && (
        <button
          type="button"
          onClick={onReplace}
          className="self-start text-[11px] px-2.5 rounded-full transition-colors"
          style={{
            height: '24px',
            border: '0.5px solid var(--color-border-secondary)',
            color: 'var(--color-text-secondary)',
            background: 'transparent',
          }}
        >
          Заменить отель
        </button>
      )}
    </li>
  )
}

function Thumbnail({ hotel }: { hotel: Hotel }) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: '52px',
        height: '48px',
        borderRadius: '8px',
        background: 'var(--color-avatar-teal)',
        color: 'var(--color-avatar-teal-text)',
        fontSize: '11px',
        fontWeight: 500,
      }}
      aria-hidden
    >
      {initials(hotel.name)}
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter((w) => /^[А-ЯA-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}
