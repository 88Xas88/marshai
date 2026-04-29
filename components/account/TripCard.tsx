'use client'

import Link from 'next/link'
import type { BookingStatus } from '@/types/plan'
import { formatPrice, paxLabel, daysLabel } from '@/lib/format'

interface Props {
  id: string
  fromCity: string
  toCity: string
  dates: string
  days: number
  pax: number
  price: number
  status: BookingStatus
  missingItem?: 'hotel' | 'transport_back' | 'transport_there'
  tags?: string[]
  pastView?: boolean
  customStatusLabel?: string
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; color: string; showAction: boolean }
> = {
  not_booked: {
    label: 'Не куплено',
    bg: '#F2F2EF',
    color: '#6B6B66',
    showAction: true,
  },
  partial: {
    label: 'Частично куплено',
    bg: '#FAEEDA',
    color: '#6B4A12',
    showAction: true,
  },
  booked: {
    label: 'Всё забронировано',
    bg: '#E1F5EE',
    color: '#085041',
    showAction: false,
  },
}

const MISSING_LABEL: Record<NonNullable<Props['missingItem']>, string> = {
  hotel: 'жильё',
  transport_back: 'транспорт обратно',
  transport_there: 'транспорт туда',
}

export function TripCard({
  id,
  fromCity,
  toCity,
  dates,
  days,
  pax,
  price,
  status,
  missingItem,
  tags = [],
  pastView,
  customStatusLabel,
}: Props) {
  const cfg = STATUS_CONFIG[status]
  const statusLabel = customStatusLabel ?? cfg.label
  const actionLabel =
    status === 'partial' && missingItem
      ? `Добавить ${MISSING_LABEL[missingItem]} →`
      : 'Купить сейчас →'

  return (
    <article className="card p-4 grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14px]" style={{ fontWeight: 500 }}>
            {fromCity} → {toCity}
          </h3>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {daysLabel(days)} · {dates} · {paxLabel(pax)}
          </p>
        </div>
        <span
          className="badge shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {statusLabel}
        </span>
      </div>

      {cfg.showAction && !pastView && (
        <button
          type="button"
          className="w-full px-3 text-[13px] rounded-lg"
          style={{
            height: '44px',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          {actionLabel}
        </button>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--color-background-tertiary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div
        className="pt-2 flex items-baseline justify-between"
        style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}
      >
        <span className="price text-[14px]">от {formatPrice(price)}</span>
        <Link
          href={`/plan/${id}`}
          className="text-[12px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {pastView ? 'Посмотреть →' : 'Открыть план →'}
        </Link>
      </div>
    </article>
  )
}
