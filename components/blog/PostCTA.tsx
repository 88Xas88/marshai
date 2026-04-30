import Link from 'next/link'

// Финальный CTA-блок в каждой статье — конвертирует читателя в пользователя
// планировщика. Тёмная плашка с зелёной кнопкой, без отвлечений.

export function PostCTA() {
  return (
    <aside
      className="not-prose mt-10 rounded-[12px] overflow-hidden"
      style={{
        background: 'var(--color-primary)',
        color: '#fff',
      }}
    >
      <div className="px-5 py-6 sm:px-7 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-[18px] sm:text-[20px]" style={{ fontWeight: 500, letterSpacing: '-0.3px' }}>
            Хочешь свой план поездки?
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: '#bdbdb6' }}>
            Введи откуда, куда и когда — за 30 секунд получишь маршрут с реальными ценами.
          </p>
        </div>
        <Link
          href="/"
          className="self-start sm:self-center inline-flex items-center px-5 text-[14px] rounded-lg whitespace-nowrap"
          style={{
            height: '48px',
            background: 'var(--color-success)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          Составить план за 30 секунд →
        </Link>
      </div>
    </aside>
  )
}
