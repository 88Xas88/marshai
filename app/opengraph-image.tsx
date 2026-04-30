import { ImageResponse } from 'next/og'

// 1200×630 — стандарт для Facebook/Twitter/Telegram превью.
// Рендерится один раз на билд + кеш (Next кеширует Image responses).
// Используется для og:image и twitter:image на главной + всех страницах
// которые не переопределяют свой opengraph-image.

export const runtime = 'nodejs'
export const alt = 'Marshai — AI-планировщик путешествий'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#F2F2EF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px 96px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Шапка: лого + название */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: '#2C2C2A',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 600,
              letterSpacing: '-2px',
            }}
          >
            M
          </div>
          <div style={{ fontSize: 36, color: '#1F1F1D', fontWeight: 500 }}>
            Marshai
          </div>
        </div>

        {/* Главный заголовок */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 76,
              color: '#1F1F1D',
              fontWeight: 600,
              letterSpacing: '-2.5px',
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            План поездки за 30 секунд
          </div>
          <div
            style={{
              fontSize: 36,
              color: '#6B6B66',
              fontWeight: 400,
              maxWidth: 1000,
              lineHeight: 1.3,
            }}
          >
            Реальные цены билетов, отели, маршрут по дням и карта
          </div>
        </div>

        {/* Низ: бренд-чипы */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Chip text="✈ Билеты" />
          <Chip text="🏨 Отели" />
          <Chip text="🗺 Маршрут" />
          <Chip text="📍 Карта" />
        </div>
      </div>
    ),
    size
  )
}

function Chip({ text }: { text: string }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #ECECE7',
        borderRadius: 999,
        padding: '12px 22px',
        fontSize: 24,
        color: '#1F1F1D',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {text}
    </div>
  )
}
