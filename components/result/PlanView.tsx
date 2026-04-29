'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Plan, Flight, Hotel } from '@/types/plan'
import { OptimalPlan } from './OptimalPlan'
import { TransportSection } from './TransportSection'
import { HotelsSection } from './HotelsSection'
import { ItinerarySection } from './ItinerarySection'
import { MapSection } from './MapSection'
import { BudgetCard } from './BudgetCard'
import { AiTipCard } from './AiTipCard'
import { SavePlanCard } from './SavePlanCard'
import { StickyCTA } from './StickyCTA'
import { SuccessOverlay } from './SuccessOverlay'
import { SegmentTabs } from '@/components/mobile/SegmentTabs'
import { BottomNav } from '@/components/mobile/BottomNav'
import { formatPrice, paxLabel, daysLabel } from '@/lib/format'

interface Props {
  plan: Plan
}

const SECTIONS = [
  { id: 'transport', label: 'Транспорт' },
  { id: 'hotels', label: 'Жильё' },
  { id: 'itinerary', label: 'Маршрут' },
  { id: 'map', label: 'Карта' },
]

const MOBILE_TABS = [
  { id: 'overview', label: 'Обзор' },
  { id: 'transport', label: 'Транспорт' },
  { id: 'hotels', label: 'Жильё' },
  { id: 'itinerary', label: 'Маршрут' },
  { id: 'map', label: 'Карта' },
]

export function PlanView({ plan }: Props) {
  const [overlayOpen, setOverlayOpen] = useState(false)

  const bestThere = plan.flights.there.find((f) => f.badge === 'best') ?? plan.flights.there[0]
  const bestBack = plan.flights.back.find((f) => f.badge === 'best') ?? plan.flights.back[0]
  const bestHotel = plan.hotels[0]

  const totalOptimal =
    (bestThere?.price ?? 0) + (bestBack?.price ?? 0) + (bestHotel?.totalPrice ?? 0)
  const stickyTransport = bestThere?.price ?? 0
  const stickyHotel = bestHotel?.totalPrice ?? 0
  const startingPrice = totalOptimal

  function open(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
    setOverlayOpen(true)
  }

  function buyFlight(f: Flight) { open(f.url) }
  function buyHotel(h: Hotel) { open(h.url) }
  function buyAll() {
    if (bestThere) open(bestThere.url)
    if (bestHotel) setTimeout(() => open(bestHotel.url), 200)
  }

  return (
    <div className="min-h-dvh">
      {/* Top bar (sticky) */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: 'var(--color-background-tertiary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <div className="mx-auto max-w-[1280px] h-14 px-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-[14px]" style={{ fontWeight: 500 }}>Marshai</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="hover:text-[var(--color-text-primary)]">
                {s.label}
              </a>
            ))}
          </nav>
          <div className="flex gap-1.5">
            {/* Войти / Профиль — десктоп. На мобайле тот же путь даёт BottomNav. */}
            <Link
              href="/account"
              className="hidden sm:flex items-center px-3 text-[12px] rounded-lg"
              style={{
                height: '36px',
                background: 'transparent',
                border: '0.5px solid var(--color-border-secondary)',
                color: 'var(--color-text-primary)',
              }}
            >
              Войти
            </Link>
            <button
              type="button"
              className="px-3 text-[12px] rounded-lg hidden sm:inline-flex items-center"
              style={{
                height: '36px',
                background: 'transparent',
                border: '0.5px solid var(--color-border-secondary)',
                color: 'var(--color-text-primary)',
              }}
            >
              Сохранить
            </button>
            <button
              type="button"
              className="px-3 text-[12px] rounded-lg"
              style={{
                height: '36px',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 500,
              }}
            >
              Поделиться
            </button>
          </div>
        </div>
      </header>

      {/* Mobile segment tabs (auto-hide on scroll down) */}
      <SegmentTabs tabs={MOBILE_TABS} defaultActive="overview" />

      {/* Trip-bar */}
      <section
        className="py-4"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <div className="mx-auto max-w-[1280px] px-4 flex flex-col sm:flex-row gap-3 sm:items-end justify-between">
          <div>
            <h1 className="text-[20px] sm:text-[24px]" style={{ fontWeight: 500 }}>
              {plan.fromCity} → {plan.toCity}
            </h1>
            <p
              className="text-[12px] sm:text-[13px] mt-0.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {plan.dates} · {daysLabel(plan.days)} · {paxLabel(plan.pax)} ·{' '}
              <span className="price">от {formatPrice(startingPrice)}</span>
            </p>
          </div>
          <button
            type="button"
            className="px-3 text-[12px] rounded-lg self-start"
            style={{
              height: '36px',
              background: 'transparent',
              border: '0.5px solid var(--color-border-secondary)',
              color: 'var(--color-text-primary)',
            }}
          >
            Перегенерировать
          </button>
        </div>
      </section>

      <main
        id="overview"
        className="mx-auto max-w-[1280px] px-4 py-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
        style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}
      >
        <div className="grid gap-4 min-w-0">
          <OptimalPlan
            optimal={plan.optimal}
            nights={Math.max(plan.days - 1, 1)}
            totalPrice={totalOptimal}
            onBookAll={buyAll}
          />

          <TransportSection
            id="transport"
            title="Транспорт туда"
            flights={plan.flights.there}
            onBuy={buyFlight}
          />

          <HotelsSection
            id="hotels"
            hotels={plan.hotels}
            nights={Math.max(plan.days - 1, 1)}
            onBook={buyHotel}
          />

          <TransportSection
            id="transport-back"
            title="Транспорт обратно"
            flights={plan.flights.back}
            onBuy={buyFlight}
          />

          <ItinerarySection id="itinerary" days={plan.itinerary} />

          <div className="lg:hidden">
            <MapSection id="map" days={plan.itinerary} hotel={plan.hotels[0]} />
          </div>

          <SavePlanCard planId={plan.id} />
        </div>

        <aside className="grid gap-4 content-start lg:sticky lg:top-[64px] lg:self-start">
          <div className="hidden lg:block">
            <MapSection id="map" days={plan.itinerary} hotel={plan.hotels[0]} height={200} />
          </div>
          <BudgetCard
            transportThere={bestThere?.price ?? 0}
            transportBack={bestBack?.price ?? 0}
            hotelTotal={bestHotel?.totalPrice ?? 0}
            nights={Math.max(plan.days - 1, 1)}
          />
          <AiTipCard text="Цены на Сапсан выросли на 12% за последние 3 дня — есть смысл взять билет сегодня." />
        </aside>
      </main>

      <StickyCTA
        transportLabel={bestThere?.carrier ?? 'Транспорт'}
        transportPrice={stickyTransport}
        hotelLabel={bestHotel?.name ?? 'Жильё'}
        hotelPrice={stickyHotel}
        onBuyTransport={() => bestThere && buyFlight(bestThere)}
        onBuyHotel={() => bestHotel && buyHotel(bestHotel)}
        onBuyAll={buyAll}
      />

      <SuccessOverlay
        open={overlayOpen}
        planId={plan.id}
        onClose={() => setOverlayOpen(false)}
      />

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
