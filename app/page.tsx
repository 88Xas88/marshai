import Link from 'next/link'
import { SearchForm } from '@/components/search/SearchForm'

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <NavBar />

      <main className="mx-auto max-w-[1080px] px-4 sm:px-6 pt-6 sm:pt-10 pb-20">
        <Hero />

        <section className="mt-5 sm:mt-7">
          <SearchForm />
        </section>

        <TrustStrip />

        <SocialProof />

        <HowItWorks />
      </main>

      <Footer />
    </div>
  )
}

function NavBar() {
  return (
    <header
      className="sticky top-0 z-20"
      style={{
        background: 'var(--color-background-tertiary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
      }}
    >
      <div className="mx-auto max-w-[1080px] h-14 px-4 sm:px-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Marshai — главная"
        >
          <Logo />
          <span className="text-[15px] font-medium tracking-tight">Marshai</span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          <Link href="/blog" className="hover:text-[var(--color-text-primary)]">Блог</Link>
          <Link href="/plan/example-spb" className="hover:text-[var(--color-text-primary)]">Примеры</Link>
          <Link href="/account" className="hover:text-[var(--color-text-primary)]">Мои поездки</Link>
          <Link
            href="#how"
            className="hover:text-[var(--color-text-primary)]"
          >
            Как работает
          </Link>
        </nav>
        <Link
          href="/account"
          className="px-3 sm:px-4 text-[13px] rounded-lg flex items-center"
          style={{
            height: '36px',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          Войти
        </Link>
      </div>
    </header>
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
        letterSpacing: '-0.4px',
      }}
    >
      M
    </span>
  )
}

function Hero() {
  return (
    <section className="text-center sm:text-left">
      <span
        className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[11px]"
        style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--color-success)' }}
          aria-hidden
        />
        AI-планировщик · Travelpayouts API
      </span>

      <h1
        className="mt-3 text-[28px] sm:text-[40px] leading-[1.05]"
        style={{ letterSpacing: '-0.6px', fontWeight: 500 }}
      >
        План поездки за 30 секунд —
        <br />
        <span style={{ color: 'var(--color-text-secondary)' }}>
          реальные цены, отели, маршрут и карта.
        </span>
      </h1>
      <p
        className="mt-3 text-[14px] sm:text-[15px] max-w-[640px] mx-auto sm:mx-0"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Введи откуда, куда и когда — ИИ соберёт билеты с реальными ценами, отели,
        маршрут по дням и нанесёт всё на карту.
      </p>
    </section>
  )
}

function TrustStrip() {
  const items = ['30 сек', 'Реальные цены', 'Карта по дням', 'Бесплатно']
  return (
    <ul
      className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {items.map((t) => (
        <li
          key={t}
          className="card flex items-center justify-center gap-2 text-[12px]"
          style={{ height: '40px', borderRadius: '10px' }}
        >
          <span
            className="inline-block w-1 h-1 rounded-full"
            style={{ background: 'var(--color-success)' }}
            aria-hidden
          />
          {t}
        </li>
      ))}
    </ul>
  )
}

interface SampleCard {
  route: string
  meta: string
  tags: string[]
  price: string
  initials: string
  avatarColor: 'teal' | 'blue' | 'amber'
}

const SAMPLES: SampleCard[] = [
  {
    route: 'Москва → Санкт-Петербург',
    meta: '5 дней · май · 1 чел.',
    tags: ['Сапсан', 'Апарт. в центре', '12 мест'],
    price: 'от 28 980 ₽',
    initials: 'АИ',
    avatarColor: 'teal',
  },
  {
    route: 'Москва → Сочи',
    meta: '7 дней · июль · 2 чел.',
    tags: ['Самолёт', 'Отель 4★', '18 мест'],
    price: 'от 96 400 ₽',
    initials: 'МС',
    avatarColor: 'blue',
  },
  {
    route: 'Москва → Калининград',
    meta: '4 дня · июнь · 2 чел.',
    tags: ['Самолёт', 'Бутик-отель', '14 мест'],
    price: 'от 31 200 ₽',
    initials: 'СИ',
    avatarColor: 'amber',
  },
]

function SocialProof() {
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-[18px]" style={{ fontWeight: 500 }}>
          Уже сегодня запланировали
        </h2>
        <Link
          href="/plan/example-spb"
          className="text-[12px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Все примеры →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {SAMPLES.map((s) => (
          <Link
            href="/plan/example-spb"
            key={s.route}
            className="card p-4 block transition-colors hover:border-[var(--color-text-secondary)]"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <Avatar color={s.avatarColor} initials={s.initials} />
              <span
                className="text-[11px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {s.meta}
              </span>
            </div>
            <div className="text-[14px]" style={{ fontWeight: 500 }}>
              {s.route}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {s.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--color-background-tertiary)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="price text-[14px]">{s.price}</span>
              <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                Открыть →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Avatar({
  color,
  initials,
}: {
  color: 'teal' | 'blue' | 'amber'
  initials: string
}) {
  const map = {
    teal: { bg: 'var(--color-avatar-teal)', text: 'var(--color-avatar-teal-text)' },
    blue: { bg: 'var(--color-avatar-blue)', text: 'var(--color-avatar-blue-text)' },
    amber: { bg: 'var(--color-avatar-amber)', text: 'var(--color-avatar-amber-text)' },
  }[color]
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full"
      style={{
        width: '28px',
        height: '28px',
        background: map.bg,
        color: map.text,
        fontSize: '11px',
        fontWeight: 500,
      }}
    >
      {initials}
    </span>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', t: 'Описываешь', d: 'Откуда, куда, когда и сколько дней.' },
    { n: '02', t: 'ИИ ищет',     d: 'Параллельно билеты, отели и составляет маршрут.' },
    { n: '03', t: 'Получаешь план', d: 'Цены, рейтинги, карта по дням за 30 секунд.' },
    { n: '04', t: 'Едешь',       d: 'Бронируешь по партнёрским ссылкам в один клик.' },
  ]
  return (
    <section id="how" className="mt-10">
      <div className="card p-4 sm:p-5">
        <h2 className="text-[16px] mb-4" style={{ fontWeight: 500 }}>
          Как работает
        </h2>
        <ol className="grid gap-4 sm:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.n}
              className="relative pt-2"
              style={{
                borderTop: '0.5px solid var(--color-border-tertiary)',
              }}
            >
              <div
                className="text-[11px] mb-1"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {s.n}
              </div>
              <div className="text-[14px]" style={{ fontWeight: 500 }}>
                {s.t}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {s.d}
              </div>
              {i < steps.length - 1 && (
                <span
                  className="hidden sm:block absolute right-[-12px] top-3"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  aria-hidden
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer
      className="mt-10 py-6"
      style={{
        borderTop: '0.5px solid var(--color-border-tertiary)',
        color: 'var(--color-text-tertiary)',
      }}
    >
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6 text-[11px] flex flex-col sm:flex-row gap-2 justify-between">
        <span>© Marshai · marshai.ru</span>
        <span>Данные предоставлены Travelpayouts и Яндекс.Расписаниями</span>
      </div>
    </footer>
  )
}
