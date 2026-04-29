'use client'

interface Props {
  route: string
  delta: string
  onBuy?: () => void
}

export function PriceAlert({ route, delta, onBuy }: Props) {
  return (
    <section
      className="p-3.5 rounded-[12px] flex items-start gap-3"
      style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid #9FE1CB',
      }}
    >
      <span
        aria-hidden
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--color-avatar-teal)',
          color: 'var(--color-success)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1.5l2 4.5 5 .6-3.7 3.5.9 5-4.2-2.4-4.2 2.4.9-5L1 6.6l5-.6L8 1.5z"
            fill="currentColor"
          />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px]" style={{ fontWeight: 500 }}>
          Цены изменились на ваш маршрут
        </div>
        <div
          className="text-[12px] mt-0.5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {route}: {delta}
        </div>
        {onBuy && (
          <button
            type="button"
            onClick={onBuy}
            className="mt-2 px-3 text-[12px] rounded-lg"
            style={{
              height: '36px',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            Купить сейчас →
          </button>
        )}
      </div>
    </section>
  )
}
