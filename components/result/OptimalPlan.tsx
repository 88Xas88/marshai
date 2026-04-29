'use client'

import type { OptimalSelection } from '@/types/plan'
import { formatPrice, nightsLabel } from '@/lib/format'

interface Props {
  optimal: OptimalSelection
  nights: number
  totalPrice: number
  onBookAll: () => void
}

export function OptimalPlan({ optimal, nights, totalPrice, onBookAll }: Props) {
  return (
    <section
      className="card overflow-hidden"
      style={{ borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}
    >
      <div
        className="px-4 sm:px-5 py-4"
        style={{ background: 'var(--color-primary)', color: '#fff' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="badge"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
          >
            Оптимальный план
          </span>
          <span className="text-[12px]" style={{ color: '#bdbdb6' }}>
            рекомендуем
          </span>
        </div>
        <p className="mt-1.5 text-[13px]" style={{ color: '#d6d6d0' }}>
          ИИ выбрал лучшее соотношение цены, удобства и рейтинга
        </p>
      </div>

      {/* Mobile: 2-колоночная сетка (туда + жильё), обратный — отдельная строка ниже */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px" style={{ background: 'var(--color-border-tertiary)' }}>
        <Cell
          label="Туда"
          name={optimal.transport_there.name}
          why={optimal.transport_there.why}
          price={optimal.transport_there.price}
        />
        <Cell
          label={`Жильё · ${nightsLabel(nights)}`}
          name={optimal.hotel.name}
          why={optimal.hotel.why}
          price={optimal.hotel.price_per_night}
        />
        {/* На мобайле обратный занимает всю строку, на десктопе — третью колонку */}
        <div className="col-span-2 sm:col-span-1">
          <Cell
            label="Обратно"
            name={optimal.transport_back.name}
            why={optimal.transport_back.why}
            price={optimal.transport_back.price}
          />
        </div>
      </div>

      <div
        className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ background: 'var(--color-background-primary)' }}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
            Итого:
          </span>
          <span className="price text-[18px]">{formatPrice(totalPrice)}</span>
        </div>
        <button
          type="button"
          onClick={onBookAll}
          className="px-4 rounded-lg text-[13px]"
          style={{
            height: '44px',
            background: 'var(--color-success)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          Забронировать всё →
        </button>
      </div>
    </section>
  )
}

function Cell({
  label,
  name,
  why,
  price,
}: {
  label: string
  name: string
  why: string
  price: string
}) {
  return (
    <div
      className="p-4 sm:p-5 flex flex-col gap-1.5"
      style={{ background: 'var(--color-background-primary)' }}
    >
      <span
        className="text-[10px] uppercase tracking-wide"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {label}
      </span>
      <span className="text-[14px]" style={{ fontWeight: 500 }}>
        {name}
      </span>
      <span
        className="text-[12px]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {why}
      </span>
      <span className="price text-[14px] mt-auto">{price}</span>
    </div>
  )
}
