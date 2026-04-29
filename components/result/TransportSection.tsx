'use client'

import { useMemo, useState } from 'react'
import type { Flight, FlightBadge, TransportType } from '@/types/plan'
import { formatPrice } from '@/lib/format'

type TabKey = 'all' | 'train' | 'plane' | 'bus'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'train', label: 'Поезд' },
  { key: 'plane', label: 'Самолёт' },
  { key: 'bus', label: 'Автобус' },
]

interface Props {
  title: string
  id: string
  flights: Flight[]
  onBuy: (f: Flight) => void
}

export function TransportSection({ title, id, flights, onBuy }: Props) {
  const [tab, setTab] = useState<TabKey>('all')
  const filtered = useMemo(
    () => (tab === 'all' ? flights : flights.filter((f) => f.type === (tab as TransportType))),
    [flights, tab]
  )

  return (
    <section id={id} className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-[16px]" style={{ fontWeight: 500 }}>
          {title}
        </h2>
        <span
          className="text-[11px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {flights.length} вариантов
        </span>
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="px-3 text-[12px] rounded-full whitespace-nowrap transition-colors"
            style={{
              height: '32px',
              background:
                tab === t.key
                  ? 'var(--color-primary)'
                  : 'var(--color-background-tertiary)',
              color:
                tab === t.key
                  ? '#fff'
                  : 'var(--color-text-secondary)',
              fontWeight: tab === t.key ? 500 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          className="py-8 text-center text-[13px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Нет вариантов в этой категории
        </div>
      ) : (
        <ul className="grid gap-2">
          {filtered.map((f) => (
            <FlightRow key={f.id} flight={f} onBuy={() => onBuy(f)} />
          ))}
        </ul>
      )}

      <div className="mt-3 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
        <a className="hover:underline" href="#">Все варианты →</a>
      </div>
    </section>
  )
}

function FlightRow({ flight, onBuy }: { flight: Flight; onBuy: () => void }) {
  return (
    <li
      className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] items-center gap-3 p-3 sm:p-3.5 rounded-[10px]"
      style={{ background: 'var(--color-background-tertiary)' }}
    >
      {flight.badge && <Badge kind={flight.badge} />}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 text-[13px]" style={{ fontWeight: 500 }}>
          <span>{flight.departTime}</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
          <span>{flight.arriveTime}</span>
          <span
            className="text-[11px]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            · {flight.duration}
          </span>
        </div>
        <div
          className="text-[12px] truncate"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {flight.carrier} · {flight.departCity} → {flight.arriveCity}
        </div>
      </div>
      <span className="price text-[14px] hidden sm:inline">
        от {formatPrice(flight.price)}
      </span>
      <button
        type="button"
        onClick={onBuy}
        className="px-3 text-[12px] rounded-lg whitespace-nowrap"
        style={{
          height: '44px',
          background: 'var(--color-primary)',
          color: '#fff',
          fontWeight: 500,
        }}
      >
        <span className="sm:hidden">{formatPrice(flight.price)} →</span>
        <span className="hidden sm:inline">Купить →</span>
      </button>
    </li>
  )
}

const BADGE_STYLE: Record<FlightBadge, { bg: string; color: string; label: string }> = {
  best:     { bg: '#E1F5EE', color: '#0F6B4F', label: 'Лучший' },
  fastest:  { bg: '#E6F1FB', color: '#0F3F66', label: 'Быстрее' },
  cheapest: { bg: '#FAEEDA', color: '#6B4A12', label: 'Дешевле' },
}

function Badge({ kind }: { kind: FlightBadge }) {
  const s = BADGE_STYLE[kind]
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}
