'use client'

import { usePlanStore } from '@/store/planStore'
import { formatPrice } from '@/lib/format'

export function PreviewPanel() {
  const { flightsThere, hotels, itinerary } = usePlanStore()

  const transportReady = flightsThere.length > 0
  const hotelsReady = hotels.length > 0
  const itineraryReady = itinerary.length > 0

  return (
    <div className="grid gap-3">
      <Block title="Транспорт туда" ready={transportReady}>
        {transportReady ? (
          <ul className="grid gap-1.5">
            {flightsThere.slice(0, 3).map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between text-[12px] py-1.5 px-2 rounded animate-fade-in"
                style={{
                  background: 'var(--color-background-tertiary)',
                }}
              >
                <span className="truncate min-w-0">
                  {f.departTime}→{f.arriveTime} · {f.carrier}
                </span>
                <span className="price text-[12px] ml-2 whitespace-nowrap">
                  {formatPrice(f.price)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Skeletons rows={3} />
        )}
      </Block>

      <Block title="Жильё" ready={hotelsReady}>
        {hotelsReady ? (
          <div className="animate-fade-in">
            <div className="text-[12px]" style={{ fontWeight: 500 }}>
              {hotels[0].name}
            </div>
            <div
              className="text-[11px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {hotels[0].rating}★ · от {formatPrice(hotels[0].pricePerNight)}/ночь
            </div>
            <div className="mt-2">
              <Skeletons rows={1} />
            </div>
          </div>
        ) : (
          <Skeletons rows={2} />
        )}
      </Block>

      <Block title="Маршрут" ready={itineraryReady}>
        {itineraryReady ? (
          <div className="animate-fade-in">
            <div className="text-[12px]" style={{ fontWeight: 500 }}>
              День 1 · {itinerary[0].title}
            </div>
            <ul className="mt-1.5 grid gap-1">
              {itinerary[0].pois.slice(0, 3).map((p, i) => (
                <li
                  key={i}
                  className="text-[11px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {p.time} · {p.name}
                </li>
              ))}
            </ul>
            <div className="mt-2 grid gap-1.5">
              <Skeletons rows={2} />
            </div>
          </div>
        ) : (
          <Skeletons rows={3} />
        )}
      </Block>
    </div>
  )
}

function Block({
  title,
  ready,
  children,
}: {
  title: string
  ready: boolean
  children: React.ReactNode
}) {
  return (
    <section className="card p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[11px] uppercase tracking-wide"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {title}
        </span>
        {ready ? (
          <span className="text-[10px]" style={{ color: 'var(--color-success)' }}>
            готово
          </span>
        ) : (
          <span
            className="inline-block animate-pulse-dot rounded-full"
            style={{
              width: '6px',
              height: '6px',
              background: 'var(--color-success)',
            }}
          />
        )}
      </div>
      {children}
    </section>
  )
}

function Skeletons({ rows }: { rows: number }) {
  return (
    <div className="grid gap-1.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '20px' }} />
      ))}
    </div>
  )
}
