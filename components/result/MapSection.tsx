'use client'

import { useEffect, useRef, useState } from 'react'
import type { DayPlan, Hotel, POIType } from '@/types/plan'

interface Props {
  id?: string
  days: DayPlan[]
  hotel?: Hotel
  height?: number
  apiKey?: string
}

const COLOR_BY_TYPE: Record<POIType, string> = {
  museum: '#3D7DCC',
  restaurant: '#E68A2B',
  walk: '#1D9E75',
  hotel: '#D14747',
  other: '#6B6B66',
}

declare global {
  interface Window {
    ymaps?: {
      ready: (cb: () => void) => void
      Map: new (
        el: HTMLElement,
        state: { center: [number, number]; zoom: number; controls?: string[] },
        opts?: object
      ) => YMap
      Placemark: new (
        coords: [number, number],
        props: object,
        opts?: object
      ) => YPlacemark
    }
  }
}

interface YMap {
  destroy: () => void
  setBounds: (
    bounds: number[][],
    opts?: { checkZoomRange?: boolean; zoomMargin?: number }
  ) => Promise<void>
  geoObjects: { add: (o: YPlacemark) => void; removeAll: () => void }
}

type YPlacemark = object

export function MapSection({ id, days, hotel, height = 220, apiKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<YMap | null>(null)
  const [activeDay, setActiveDay] = useState<number | 'all'>(1)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const key = apiKey ?? process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.ymaps) {
      setLoaded(true)
      return
    }
    const src = `https://api-maps.yandex.ru/2.1/?apikey=${key ?? ''}&lang=ru_RU`
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      existing.addEventListener('load', () => setLoaded(true))
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => setLoaded(true)
    script.onerror = () => setError('Не удалось загрузить Яндекс.Карты')
    document.head.appendChild(script)
  }, [key])

  useEffect(() => {
    if (!loaded || !containerRef.current || !window.ymaps) return
    window.ymaps.ready(() => {
      if (!containerRef.current || !window.ymaps) return
      if (mapRef.current) return
      const allPoints = collectPoints(days, hotel)
      if (allPoints.length === 0) return
      const center = allPoints[0].coords
      mapRef.current = new window.ymaps.Map(containerRef.current, {
        center,
        zoom: 12,
        controls: ['zoomControl'],
      })
      renderForDay(mapRef.current, days, hotel, activeDay)
    })
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  useEffect(() => {
    if (mapRef.current) renderForDay(mapRef.current, days, hotel, activeDay)
  }, [activeDay, days, hotel])

  return (
    <section id={id} className="card overflow-hidden">
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <h3 className="text-[13px]" style={{ fontWeight: 500 }}>
          Карта маршрута
        </h3>
        <span
          className="text-[10px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Яндекс.Карты · по дням
        </span>
      </div>

      <div className="relative" style={{ height }}>
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ background: 'var(--color-background-tertiary)' }}
        >
          {!loaded && !error && <FakeMap days={days} hotel={hotel} activeDay={activeDay} />}
        </div>
        {error && (
          <div
            className="absolute inset-0 flex items-center justify-center text-[12px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {error}
          </div>
        )}
      </div>

      <div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar">
        {days.map((d) => (
          <DayTab
            key={d.day}
            label={`День ${d.day}`}
            active={activeDay === d.day}
            onClick={() => setActiveDay(d.day)}
          />
        ))}
        <DayTab
          label="Все"
          active={activeDay === 'all'}
          onClick={() => setActiveDay('all')}
        />
      </div>
    </section>
  )
}

function DayTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 text-[11px] rounded-full whitespace-nowrap transition-colors"
      style={{
        height: '28px',
        background: active ? 'var(--color-primary)' : 'transparent',
        color: active ? '#fff' : 'var(--color-text-secondary)',
        border: active
          ? '0.5px solid transparent'
          : '0.5px solid var(--color-border-tertiary)',
        fontWeight: active ? 500 : 400,
      }}
    >
      {label}
    </button>
  )
}

interface MapPoint {
  coords: [number, number]
  type: POIType
  label: string
}

function collectPoints(days: DayPlan[], hotel?: Hotel, dayFilter?: number | 'all'): MapPoint[] {
  const points: MapPoint[] = []
  if (hotel?.lat && hotel?.lng) {
    points.push({ coords: [hotel.lat, hotel.lng], type: 'hotel', label: hotel.name })
  }
  const filter = dayFilter
  for (const d of days) {
    if (filter && filter !== 'all' && d.day !== filter) continue
    for (const p of d.pois) {
      if (p.lat != null && p.lng != null) {
        points.push({ coords: [p.lat, p.lng], type: p.type, label: p.name })
      }
    }
  }
  return points
}

function renderForDay(
  map: YMap,
  days: DayPlan[],
  hotel: Hotel | undefined,
  active: number | 'all'
) {
  if (!window.ymaps) return
  map.geoObjects.removeAll()
  const points = collectPoints(days, hotel, active)
  for (const p of points) {
    const pm = new window.ymaps.Placemark(
      p.coords,
      { hintContent: p.label, balloonContent: p.label },
      {
        preset: 'islands#circleIcon',
        iconColor: COLOR_BY_TYPE[p.type] ?? '#6B6B66',
      }
    )
    map.geoObjects.add(pm)
  }
  if (points.length > 1) {
    const lats = points.map((p) => p.coords[0])
    const lngs = points.map((p) => p.coords[1])
    void map.setBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { checkZoomRange: true, zoomMargin: 30 }
    )
  }
}

function FakeMap({
  days,
  hotel,
  activeDay,
}: {
  days: DayPlan[]
  hotel?: Hotel
  activeDay: number | 'all'
}) {
  const points = collectPoints(days, hotel, activeDay)
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-[12px]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Нет точек на карте
      </div>
    )
  }
  const lats = points.map((p) => p.coords[0])
  const lngs = points.map((p) => p.coords[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const dLat = maxLat - minLat || 0.01
  const dLng = maxLng - minLng || 0.01

  return (
    <div className="h-full relative" style={{ background: '#EEEEE9' }}>
      {points.map((p, i) => {
        const x = ((p.coords[1] - minLng) / dLng) * 90 + 5
        const y = (1 - (p.coords[0] - minLat) / dLat) * 80 + 10
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: '10px',
              height: '10px',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              background: COLOR_BY_TYPE[p.type] ?? '#6B6B66',
              boxShadow: '0 0 0 2px #fff',
            }}
            aria-label={p.label}
          />
        )
      })}
      <span
        className="absolute bottom-2 right-2 text-[9px] px-1.5 py-0.5 rounded"
        style={{
          background: 'rgba(255,255,255,0.85)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        Превью карты
      </span>
    </div>
  )
}
