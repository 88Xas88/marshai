'use client'

import { useState } from 'react'
import type { DayPlan, POIType } from '@/types/plan'

interface Props {
  id: string
  days: DayPlan[]
  onActiveDayChange?: (dayIndex: number) => void
}

export function ItinerarySection({ id, days, onActiveDayChange }: Props) {
  const [open, setOpen] = useState<Record<number, boolean>>({ 1: true })
  const [allOpen, setAllOpen] = useState(false)

  function toggle(d: number) {
    setOpen((s) => ({ ...s, [d]: !s[d] }))
    onActiveDayChange?.(d - 1)
  }

  function toggleAll() {
    if (allOpen) {
      setOpen({ 1: true })
    } else {
      const m: Record<number, boolean> = {}
      days.forEach((d) => (m[d.day] = true))
      setOpen(m)
    }
    setAllOpen(!allOpen)
  }

  return (
    <section id={id} className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-[16px]" style={{ fontWeight: 500 }}>
          Маршрут по дням
        </h2>
        <button
          type="button"
          onClick={toggleAll}
          className="text-[12px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {allOpen ? 'Свернуть' : 'Все дни'}
        </button>
      </div>

      <ol className="grid gap-2">
        {days.map((d) => (
          <DayItem
            key={d.day}
            day={d}
            open={!!open[d.day]}
            onToggle={() => toggle(d.day)}
          />
        ))}
      </ol>
    </section>
  )
}

function DayItem({
  day,
  open,
  onToggle,
}: {
  day: DayPlan
  open: boolean
  onToggle: () => void
}) {
  return (
    <li
      className="rounded-[10px] overflow-hidden"
      style={{ background: 'var(--color-background-tertiary)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left"
        style={{ minHeight: '48px' }}
      >
        <span
          className="badge"
          style={{
            background: 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
          }}
        >
          День {day.day}
        </span>
        <span className="flex-1 min-w-0">
          <span
            className="block text-[13px] truncate"
            style={{ fontWeight: 500 }}
          >
            {day.title}
          </span>
          <span
            className="block text-[11px]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {day.date} · {day.pois.length} мест
          </span>
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul className="px-3.5 pb-3.5 pt-1 grid gap-3 animate-fade-in">
          {day.pois.map((p, idx) => (
            <li
              key={`${day.day}-${idx}`}
              className="grid grid-cols-[64px_auto_1fr] gap-x-3 items-start"
            >
              <span
                className="text-[12px] pt-0.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {p.time}
              </span>
              <span className="relative pt-1.5">
                <DotAndLine type={p.type} last={idx === day.pois.length - 1} />
              </span>
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px]" style={{ fontWeight: 500 }}>
                    {p.name}
                  </span>
                  <button
                    type="button"
                    className="text-[10px]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    заменить
                  </button>
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {p.duration} · {p.cost} · {p.address}
                </div>
                <div
                  className="text-[12px] mt-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {p.description}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

const POI_COLOR: Record<POIType, string> = {
  museum: '#3D7DCC',
  restaurant: '#E68A2B',
  walk: '#1D9E75',
  hotel: '#D14747',
  other: '#9A9A93',
}

function DotAndLine({ type, last }: { type: POIType; last: boolean }) {
  return (
    <span
      aria-hidden
      className="relative inline-block"
      style={{ width: '10px', height: '100%' }}
    >
      <span
        className="block rounded-full"
        style={{
          width: '8px',
          height: '8px',
          background: POI_COLOR[type] ?? POI_COLOR.other,
        }}
      />
      {!last && (
        <span
          className="absolute"
          style={{
            top: '12px',
            left: '3.5px',
            width: '1px',
            bottom: '-22px',
            background: 'var(--color-border-secondary)',
          }}
        />
      )}
    </span>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      style={{
        transform: open ? 'rotate(90deg)' : 'rotate(0)',
        transition: 'transform 200ms ease',
        color: 'var(--color-text-tertiary)',
      }}
    >
      <path
        d="M4.5 3l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
