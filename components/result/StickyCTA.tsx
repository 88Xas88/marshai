'use client'

import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/format'

interface Props {
  transportLabel: string
  transportPrice: number
  hotelLabel: string
  hotelPrice: number
  onBuyTransport: () => void
  onBuyHotel: () => void
  onBuyAll: () => void
}

export function StickyCTA({
  transportLabel,
  transportPrice,
  hotelLabel,
  hotelPrice,
  onBuyTransport,
  onBuyHotel,
  onBuyAll,
}: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      const saveEl = document.getElementById('save-plan')
      const hideAt = saveEl ? saveEl.getBoundingClientRect().top + window.scrollY - 200 : Infinity
      setVisible(y > 300 && y < hideAt)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  const total = transportPrice + hotelPrice

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-30 animate-slide-up"
      style={{
        background: 'var(--color-primary)',
        color: '#fff',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Mobile: одна строка */}
      <div className="sm:hidden mx-auto max-w-[1080px] px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[10px]" style={{ color: '#bdbdb6' }}>Итого от</span>
          <span className="text-[15px]" style={{ fontWeight: 500 }}>
            {formatPrice(total)}
          </span>
        </div>
        <button
          type="button"
          onClick={onBuyAll}
          className="px-4 text-[13px] rounded-lg flex-shrink-0"
          style={{
            height: '44px',
            background: 'var(--color-success)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          Забронировать →
        </button>
      </div>

      {/* Desktop: 3 строки в ряд */}
      <div className="hidden sm:grid mx-auto max-w-[1080px] px-4 py-2 grid-cols-[1fr_1fr_auto] items-center gap-3">
        <Row
          label="Транспорт туда"
          name={transportLabel}
          price={transportPrice}
          onBuy={onBuyTransport}
          buttonLabel="Купить →"
        />
        <Row
          label="Жильё"
          name={hotelLabel}
          price={hotelPrice}
          onBuy={onBuyHotel}
          buttonLabel="Бронировать →"
        />
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px]" style={{ color: '#bdbdb6' }}>
              Транспорт + жильё
            </span>
            <span className="text-[15px]" style={{ fontWeight: 500 }}>
              {formatPrice(total)}
            </span>
          </div>
          <button
            type="button"
            onClick={onBuyAll}
            className="px-4 text-[13px] rounded-lg whitespace-nowrap"
            style={{
              height: '44px',
              background: 'var(--color-success)',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            Всё сразу →
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  name,
  price,
  onBuy,
  buttonLabel,
}: {
  label: string
  name: string
  price: number
  onBuy: () => void
  buttonLabel: string
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex flex-col min-w-0">
        <span className="text-[10px]" style={{ color: '#bdbdb6' }}>{label}</span>
        <span className="text-[12px] truncate" style={{ fontWeight: 500 }}>
          {name}
        </span>
      </div>
      <span
        className="text-[12px] ml-auto whitespace-nowrap"
        style={{ color: '#a1d8c2', fontWeight: 500 }}
      >
        {formatPrice(price)}
      </span>
      <button
        type="button"
        onClick={onBuy}
        className="px-3 text-[12px] rounded-lg whitespace-nowrap"
        style={{
          height: '36px',
          background: 'rgba(255,255,255,0.10)',
          color: '#fff',
          fontWeight: 500,
        }}
      >
        {buttonLabel}
      </button>
    </div>
  )
}
